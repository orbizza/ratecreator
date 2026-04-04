#!/usr/bin/env bash
#
# Task 7: Set up health check cron job on the GCE VM
#
# Installs a cron job that runs every 5 minutes to:
#   1. Ping Redis/Valkey
#   2. Check OpenSearch cluster health
#   3. Restart unresponsive containers
#   4. Log everything to /var/log/ratecreator-health.log
#
# RUN THIS ON THE VM.
#
set -euo pipefail

SECRETS_DIR="/opt/ratecreator"
HEALTH_SCRIPT="/opt/ratecreator/health-check.sh"
LOG_FILE="/var/log/ratecreator-health.log"

REDIS_PASS=$(sudo cat "${SECRETS_DIR}/.redis-password")

# ─── Create health check script ──────────────────────────────
echo "==> Creating health check script..."
sudo tee "${HEALTH_SCRIPT}" > /dev/null << 'HEALTH_EOF'
#!/usr/bin/env bash
#
# RateCreator Health Check
# Runs via cron every 5 minutes.
#
LOG_FILE="/var/log/ratecreator-health.log"
REDIS_PASS=$(cat /opt/ratecreator/.redis-password 2>/dev/null)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

log() {
  echo "[${TIMESTAMP}] $1" >> "${LOG_FILE}"
}

# ── Check Valkey ──────────────────────────────────────────────
VALKEY_OK=false
if docker exec ratecreator-valkey valkey-cli -a "${REDIS_PASS}" ping 2>/dev/null | grep -q PONG; then
  VALKEY_OK=true
  log "valkey: OK"
else
  log "valkey: UNHEALTHY — attempting restart..."
  docker restart ratecreator-valkey 2>/dev/null
  sleep 5
  if docker exec ratecreator-valkey valkey-cli -a "${REDIS_PASS}" ping 2>/dev/null | grep -q PONG; then
    log "valkey: RECOVERED after restart"
    VALKEY_OK=true
  else
    log "valkey: STILL DOWN after restart — manual intervention needed"
  fi
fi

# ── Check OpenSearch ──────────────────────────────────────────
OPENSEARCH_OK=false
HEALTH_STATUS=$(curl -sf --max-time 10 http://localhost:9200/_cluster/health 2>/dev/null | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "unreachable")

if [[ "${HEALTH_STATUS}" == "green" || "${HEALTH_STATUS}" == "yellow" ]]; then
  OPENSEARCH_OK=true
  log "opensearch: OK (${HEALTH_STATUS})"
else
  log "opensearch: UNHEALTHY (${HEALTH_STATUS}) — attempting restart..."
  docker restart ratecreator-opensearch 2>/dev/null
  sleep 30  # OpenSearch needs time to start
  HEALTH_STATUS=$(curl -sf --max-time 10 http://localhost:9200/_cluster/health 2>/dev/null | \
    python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "unreachable")
  if [[ "${HEALTH_STATUS}" == "green" || "${HEALTH_STATUS}" == "yellow" ]]; then
    log "opensearch: RECOVERED after restart (${HEALTH_STATUS})"
    OPENSEARCH_OK=true
  else
    log "opensearch: STILL DOWN after restart — manual intervention needed"
  fi
fi

# ── Check Docker daemon ──────────────────────────────────────
if ! docker info &>/dev/null; then
  log "docker: DAEMON DOWN — attempting restart..."
  sudo systemctl restart docker
  sleep 10
  if docker info &>/dev/null; then
    log "docker: RECOVERED"
    # Restart all containers after docker recovery
    cd /opt/ratecreator && docker compose up -d 2>/dev/null
    log "docker: Restarted all containers"
  else
    log "docker: STILL DOWN — manual intervention needed"
  fi
fi

# ── Check disk space ─────────────────────────────────────────
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
if [[ "${DISK_USAGE}" -gt 85 ]]; then
  log "disk: WARNING — ${DISK_USAGE}% used"
  # Clean up old Docker resources
  docker system prune -f --volumes 2>/dev/null
  log "disk: Ran docker system prune"
fi

# ── Rotate log if too large (>10MB) ──────────────────────────
LOG_SIZE=$(stat -c%s "${LOG_FILE}" 2>/dev/null || echo 0)
if [[ "${LOG_SIZE}" -gt 10485760 ]]; then
  mv "${LOG_FILE}" "${LOG_FILE}.old"
  log "Log rotated (previous log: ${LOG_FILE}.old)"
fi
HEALTH_EOF

sudo chmod +x "${HEALTH_SCRIPT}"
echo "    Health check script created at ${HEALTH_SCRIPT}"

# ─── Create log file ─────────────────────────────────────────
sudo touch "${LOG_FILE}"
sudo chmod 644 "${LOG_FILE}"

# ─── Install cron job (every 5 minutes) ──────────────────────
echo "==> Installing cron job..."
CRON_LINE="*/5 * * * * /opt/ratecreator/health-check.sh"

# Add to root's crontab (needs docker access)
(sudo crontab -l 2>/dev/null | grep -v "health-check.sh"; echo "${CRON_LINE}") | sudo crontab -
echo "    Cron job installed: ${CRON_LINE}"

# ─── Verify ──────────────────────────────────────────────────
echo ""
echo "==> Verifying cron job..."
sudo crontab -l | grep health-check

echo ""
echo "============================================"
echo "  Health Check Setup Complete"
echo "============================================"
echo "  Script:   ${HEALTH_SCRIPT}"
echo "  Log:      ${LOG_FILE}"
echo "  Schedule: Every 5 minutes (cron)"
echo ""
echo "  To check logs:"
echo "    tail -f ${LOG_FILE}"
echo ""
echo "  To run manually:"
echo "    sudo ${HEALTH_SCRIPT}"
echo "============================================"
echo ""
echo "Next step: Run 07-backup-setup.sh from your local machine"

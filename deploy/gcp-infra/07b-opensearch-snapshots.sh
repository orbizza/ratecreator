#!/usr/bin/env bash
#
# Task 8 Part B: Configure OpenSearch snapshot repository + daily cron
#
# RUN THIS ON THE VM after Part A (07-backup-setup.sh) creates the GCS bucket.
#
# OpenSearch doesn't have a native GCS plugin, so we use a shared filesystem
# approach: mount GCS bucket via gcsfuse, register as fs snapshot repository.
#
set -euo pipefail

# ─── Configuration ────────────────────────────────────────────
PROJECT_ID="sinuous-aviary-410323"
BUCKET_NAME="${PROJECT_ID}-ratecreator-backups"
SNAPSHOT_DIR="/mnt/opensearch-backups"
REPO_NAME="ratecreator-daily"

# ─── Step 1: Install gcsfuse ─────────────────────────────────
echo "==> Installing gcsfuse..."
if ! command -v gcsfuse &>/dev/null; then
  export GCSFUSE_REPO=gcsfuse-$(lsb_release -c -s)
  echo "deb [signed-by=/usr/share/keyrings/cloud.google.asc] https://packages.cloud.google.com/apt ${GCSFUSE_REPO} main" | \
    sudo tee /etc/apt/sources.list.d/gcsfuse.list
  curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | \
    sudo tee /usr/share/keyrings/cloud.google.asc
  sudo apt-get update
  sudo apt-get install -y gcsfuse
fi
echo "    gcsfuse installed."

# ─── Step 2: Mount GCS bucket ────────────────────────────────
echo "==> Mounting GCS bucket..."
sudo mkdir -p "${SNAPSHOT_DIR}"
sudo chown 1000:1000 "${SNAPSHOT_DIR}"  # OpenSearch runs as UID 1000

if mountpoint -q "${SNAPSHOT_DIR}"; then
  echo "    Already mounted."
else
  sudo -u \#1000 gcsfuse --implicit-dirs "${BUCKET_NAME}" "${SNAPSHOT_DIR}"
  echo "    Mounted gs://${BUCKET_NAME} at ${SNAPSHOT_DIR}"
fi

# Add to fstab for persistence across reboots
if ! grep -q "${BUCKET_NAME}" /etc/fstab; then
  echo "${BUCKET_NAME} ${SNAPSHOT_DIR} gcsfuse rw,_netdev,allow_other,uid=1000,gid=1000 0 0" | \
    sudo tee -a /etc/fstab
  echo "    Added to /etc/fstab."
fi

# ─── Step 3: Add snapshot dir to OpenSearch container ─────────
# We need to mount the backup dir into the container and set path.repo
echo "==> Updating docker-compose to mount backup directory..."

COMPOSE_DIR="/opt/ratecreator"
# Check if already configured
if grep -q "opensearch-backups" "${COMPOSE_DIR}/docker-compose.yml" 2>/dev/null; then
  echo "    Backup mount already in docker-compose.yml."
else
  echo ""
  echo "  MANUAL STEP REQUIRED:"
  echo "  Add these to the opensearch service in ${COMPOSE_DIR}/docker-compose.yml:"
  echo ""
  echo "  Under 'volumes:':"
  echo "    - ${SNAPSHOT_DIR}:/usr/share/opensearch/backups"
  echo ""
  echo "  Under 'environment:', add:"
  echo "    - path.repo=/usr/share/opensearch/backups"
  echo ""
  echo "  Then restart: cd ${COMPOSE_DIR} && sudo docker compose up -d"
  echo ""
  read -p "  Press Enter after making the changes and restarting... "
fi

# ─── Step 4: Register snapshot repository ─────────────────────
echo "==> Registering OpenSearch snapshot repository..."
sleep 5  # Wait for OpenSearch to be ready after restart

curl -sf -X PUT "http://localhost:9200/_snapshot/${REPO_NAME}" \
  -H 'Content-Type: application/json' \
  -d "{
    \"type\": \"fs\",
    \"settings\": {
      \"location\": \"/usr/share/opensearch/backups\",
      \"compress\": true
    }
  }" && echo "" || { echo "ERROR: Could not register snapshot repo. Is OpenSearch running?"; exit 1; }

echo "    Snapshot repository '${REPO_NAME}' registered."

# ─── Step 5: Create initial snapshot ─────────────────────────
echo "==> Creating initial snapshot..."
SNAPSHOT_NAME="snapshot-$(date +%Y%m%d-%H%M%S)"
curl -sf -X PUT "http://localhost:9200/_snapshot/${REPO_NAME}/${SNAPSHOT_NAME}?wait_for_completion=true" \
  -H 'Content-Type: application/json' \
  -d '{
    "indices": "accounts,categories",
    "ignore_unavailable": true,
    "include_global_state": false
  }' && echo "" || echo "WARNING: Initial snapshot may have failed."

echo "    Initial snapshot: ${SNAPSHOT_NAME}"

# ─── Step 6: Create daily snapshot cron ───────────────────────
echo "==> Setting up daily snapshot cron..."

SNAPSHOT_SCRIPT="/opt/ratecreator/opensearch-snapshot.sh"
sudo tee "${SNAPSHOT_SCRIPT}" > /dev/null << 'SNAP_EOF'
#!/usr/bin/env bash
# Daily OpenSearch snapshot — runs via cron at 02:00 UTC
set -euo pipefail

REPO_NAME="ratecreator-daily"
SNAPSHOT_NAME="snapshot-$(date +%Y%m%d)"
LOG_FILE="/var/log/ratecreator-health.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] opensearch-snapshot: $1" >> "${LOG_FILE}"
}

# Create today's snapshot
RESULT=$(curl -sf -X PUT "http://localhost:9200/_snapshot/${REPO_NAME}/${SNAPSHOT_NAME}?wait_for_completion=true" \
  -H 'Content-Type: application/json' \
  -d '{
    "indices": "accounts,categories",
    "ignore_unavailable": true,
    "include_global_state": false
  }' 2>&1) || { log "FAILED: ${RESULT}"; exit 1; }

log "Created ${SNAPSHOT_NAME}"

# Delete snapshots older than 7 days
SNAPSHOTS=$(curl -sf "http://localhost:9200/_snapshot/${REPO_NAME}/_all" 2>/dev/null | \
  python3 -c "
import sys, json
from datetime import datetime, timedelta
data = json.load(sys.stdin)
cutoff = datetime.utcnow() - timedelta(days=7)
for snap in data.get('snapshots', []):
    ts = datetime.utcfromtimestamp(snap['start_time_in_millis']/1000)
    if ts < cutoff:
        print(snap['snapshot'])
" 2>/dev/null)

for old_snap in ${SNAPSHOTS}; do
  curl -sf -X DELETE "http://localhost:9200/_snapshot/${REPO_NAME}/${old_snap}" 2>/dev/null
  log "Deleted old snapshot: ${old_snap}"
done
SNAP_EOF

sudo chmod +x "${SNAPSHOT_SCRIPT}"

# Add to root crontab — daily at 02:00 UTC
CRON_LINE="0 2 * * * /opt/ratecreator/opensearch-snapshot.sh"
(sudo crontab -l 2>/dev/null | grep -v "opensearch-snapshot.sh"; echo "${CRON_LINE}") | sudo crontab -

echo "    Daily snapshot cron installed: 02:00 UTC"

# ─── Summary ──────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  OpenSearch Backup Setup Complete"
echo "============================================"
echo "  Repository:     ${REPO_NAME}"
echo "  GCS Bucket:     gs://${BUCKET_NAME}"
echo "  Mount Point:    ${SNAPSHOT_DIR}"
echo "  Initial Snap:   ${SNAPSHOT_NAME}"
echo "  Schedule:       Daily at 02:00 UTC (cron)"
echo "  Retention:      7 days (auto-cleanup)"
echo ""
echo "  To list snapshots:"
echo "    curl http://localhost:9200/_snapshot/${REPO_NAME}/_all?pretty"
echo ""
echo "  To restore a snapshot:"
echo "    curl -X POST 'http://localhost:9200/_snapshot/${REPO_NAME}/SNAPSHOT_NAME/_restore'"
echo "============================================"

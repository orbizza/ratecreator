#!/usr/bin/env bash
#
# Task 2: Install Docker + Docker Compose on the GCE VM
#
# RUN THIS ON THE VM (after SSH-ing in):
#   gcloud compute ssh ratecreator-services --zone=asia-south1-a
#
set -euo pipefail

echo "==> Installing Docker on Ubuntu 24.04..."

# ─── Step 1: Install Docker ──────────────────────────────────
# Remove any old versions
sudo apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker's official GPG key and repo
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# ─── Step 2: Add current user to docker group ────────────────
sudo usermod -aG docker "${USER}"
echo "    Added ${USER} to docker group. (Re-login or 'newgrp docker' to take effect)"

# ─── Step 3: Enable Docker to start on boot ──────────────────
sudo systemctl enable docker
sudo systemctl enable containerd
sudo systemctl start docker

# ─── Step 4: Set vm.max_map_count for OpenSearch ─────────────
# OpenSearch requires vm.max_map_count >= 262144
echo "==> Setting vm.max_map_count=262144 for OpenSearch..."
sudo sysctl -w vm.max_map_count=262144
if ! grep -q "vm.max_map_count=262144" /etc/sysctl.conf; then
  echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
fi

# ─── Step 5: Generate passwords ──────────────────────────────
echo "==> Generating secure passwords..."
SECRETS_DIR="/opt/ratecreator"
sudo mkdir -p "${SECRETS_DIR}"

# Only generate if not already present (idempotent)
if [[ ! -f "${SECRETS_DIR}/.redis-password" ]]; then
  openssl rand -base64 32 | tr -d '/+=' | head -c 40 | sudo tee "${SECRETS_DIR}/.redis-password" > /dev/null
  echo "    Generated Redis password."
else
  echo "    Redis password already exists."
fi

if [[ ! -f "${SECRETS_DIR}/.opensearch-password" ]]; then
  # OpenSearch requires: min 8 chars, uppercase, lowercase, digit, special char
  OPENSEARCH_PASS="Rc$(openssl rand -base64 32 | tr -d '/+=' | head -c 36)!1"
  echo -n "${OPENSEARCH_PASS}" | sudo tee "${SECRETS_DIR}/.opensearch-password" > /dev/null
  echo "    Generated OpenSearch password."
else
  echo "    OpenSearch password already exists."
fi

# Restrict file permissions
sudo chmod 600 "${SECRETS_DIR}/.redis-password" "${SECRETS_DIR}/.opensearch-password"

REDIS_PASS=$(sudo cat "${SECRETS_DIR}/.redis-password")
OPENSEARCH_PASS=$(sudo cat "${SECRETS_DIR}/.opensearch-password")

# ─── Step 6: Create docker-compose directory ─────────────────
COMPOSE_DIR="/opt/ratecreator"
sudo mkdir -p "${COMPOSE_DIR}"

# ─── Step 7: Create OpenSearch data directory ─────────────────
sudo mkdir -p /opensearch-data
sudo chown 1000:1000 /opensearch-data   # OpenSearch runs as UID 1000

# ─── Step 8: Write docker-compose.yml ─────────────────────────
echo "==> Writing docker-compose.yml..."
sudo tee "${COMPOSE_DIR}/docker-compose.yml" > /dev/null << COMPOSE_EOF
version: '3.8'

services:
  # ── Valkey (Redis-compatible) ────────────────────────────────
  valkey:
    image: valkey/valkey:8
    container_name: ratecreator-valkey
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: >
      valkey-server
        --requirepass ${REDIS_PASS}
        --maxmemory 450mb
        --maxmemory-policy allkeys-lru
        --save ""
        --appendonly no
        --protected-mode no
        --tcp-backlog 511
        --timeout 300
        --tcp-keepalive 60
    deploy:
      resources:
        limits:
          memory: 512M
    healthcheck:
      test: ["CMD", "valkey-cli", "-a", "${REDIS_PASS}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 5s
    networks:
      - ratecreator

  # ── OpenSearch (Elasticsearch-compatible) ────────────────────
  opensearch:
    image: opensearchproject/opensearch:2
    container_name: ratecreator-opensearch
    restart: unless-stopped
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
      - OPENSEARCH_JAVA_OPTS=-Xms2g -Xmx2g
      - plugins.security.disabled=true
      - OPENSEARCH_INITIAL_ADMIN_PASSWORD=${OPENSEARCH_PASS}
      - bootstrap.memory_lock=true
      - cluster.name=ratecreator
      - node.name=ratecreator-node-1
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
    deploy:
      resources:
        limits:
          memory: 4G
    volumes:
      - /opensearch-data:/usr/share/opensearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    networks:
      - ratecreator

networks:
  ratecreator:
    driver: bridge
COMPOSE_EOF

echo "    docker-compose.yml written to ${COMPOSE_DIR}/docker-compose.yml"

# ─── Step 9: Create systemd service for docker-compose ────────
echo "==> Creating systemd service for auto-start on boot..."
sudo tee /etc/systemd/system/ratecreator-docker.service > /dev/null << 'SERVICE_EOF'
[Unit]
Description=RateCreator Docker Compose Services (Valkey + OpenSearch)
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/ratecreator
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=120

[Install]
WantedBy=multi-user.target
SERVICE_EOF

sudo systemctl daemon-reload
sudo systemctl enable ratecreator-docker.service
echo "    Systemd service enabled."

# ─── Step 10: Start containers ────────────────────────────────
echo "==> Starting containers..."
cd "${COMPOSE_DIR}"
sudo docker compose up -d

# ─── Step 11: Wait and verify ─────────────────────────────────
echo "==> Waiting for services to start (30s for OpenSearch)..."
sleep 30

echo ""
echo "==> Verifying Valkey..."
if sudo docker exec ratecreator-valkey valkey-cli -a "${REDIS_PASS}" ping 2>/dev/null | grep -q PONG; then
  echo "    Valkey: OK (PONG)"
else
  echo "    Valkey: FAILED — check logs with: docker logs ratecreator-valkey"
fi

echo "==> Verifying OpenSearch..."
if curl -sf http://localhost:9200/_cluster/health > /dev/null 2>&1; then
  HEALTH=$(curl -s http://localhost:9200/_cluster/health | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "unknown")
  echo "    OpenSearch: OK (cluster status: ${HEALTH})"
else
  echo "    OpenSearch: FAILED — check logs with: docker logs ratecreator-opensearch"
fi

# ─── Print credentials ────────────────────────────────────────
STATIC_IP=$(curl -s https://ifconfig.me)
echo ""
echo "============================================"
echo "  Services Running"
echo "============================================"
echo "  Valkey (Redis):  ${STATIC_IP}:6379"
echo "  OpenSearch:      ${STATIC_IP}:9200"
echo ""
echo "  Redis Password:      ${REDIS_PASS}"
echo "  OpenSearch Password:  ${OPENSEARCH_PASS}"
echo "  (passwords saved in ${SECRETS_DIR}/)"
echo "============================================"
echo ""
echo "Test from your LOCAL machine:"
echo "  redis-cli -h ${STATIC_IP} -a '${REDIS_PASS}' ping"
echo "  curl http://${STATIC_IP}:9200/_cluster/health?pretty"
echo ""
echo "Next step: Run 04-firestore-setup.sh from your local machine"

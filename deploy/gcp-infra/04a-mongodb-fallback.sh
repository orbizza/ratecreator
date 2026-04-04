#!/usr/bin/env bash
#
# FALLBACK: Add MongoDB Community to the GCE VM
#
# Use this if Firestore MongoDB compatibility is NOT available.
# This adds a MongoDB 7 container to the existing docker-compose.
#
# RUN THIS ON THE VM.
#
set -euo pipefail

COMPOSE_DIR="/opt/ratecreator"
SECRETS_DIR="/opt/ratecreator"

# ─── Generate MongoDB password ────────────────────────────────
if [[ ! -f "${SECRETS_DIR}/.mongodb-password" ]]; then
  openssl rand -base64 32 | tr -d '/+=' | head -c 40 | sudo tee "${SECRETS_DIR}/.mongodb-password" > /dev/null
  echo "Generated MongoDB password."
else
  echo "MongoDB password already exists."
fi
sudo chmod 600 "${SECRETS_DIR}/.mongodb-password"

MONGO_PASS=$(sudo cat "${SECRETS_DIR}/.mongodb-password")

# ─── Create MongoDB data directory ────────────────────────────
sudo mkdir -p /mongodb-data

# ─── Create standalone MongoDB compose file ───────────────────
# We use a separate file to avoid overwriting the existing docker-compose.yml.
# Run both with: docker compose -f docker-compose.yml -f docker-compose.mongodb.yml up -d

sudo tee "${COMPOSE_DIR}/docker-compose.mongodb.yml" > /dev/null << COMPOSE_EOF
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: ratecreator-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=ratecreator
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASS}
      - MONGO_INITDB_DATABASE=ratecreator
    command: >
      mongod
        --wiredTigerCacheSizeGB 1.5
        --bind_ip_all
    deploy:
      resources:
        limits:
          memory: 2G
    volumes:
      - /mongodb-data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')", "-u", "ratecreator", "-p", "${MONGO_PASS}", "--authenticationDatabase", "admin"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s
    networks:
      - ratecreator

networks:
  ratecreator:
    external: true
    name: ratecreator_ratecreator
COMPOSE_EOF

echo "==> Written docker-compose.mongodb.yml"
echo ""
echo "IMPORTANT: If using MongoDB fallback, you'll need a bigger VM."
echo "  Current: e2-standard-2 (8 GB RAM)"
echo "  Recommended: e2-standard-4 (16 GB RAM)"
echo "  To resize:"
echo "    gcloud compute instances stop ratecreator-services --zone=asia-south1-a"
echo "    gcloud compute instances set-machine-type ratecreator-services \\"
echo "      --zone=asia-south1-a --machine-type=e2-standard-4"
echo "    gcloud compute instances start ratecreator-services --zone=asia-south1-a"
echo ""
echo "Also increase boot disk to 100GB:"
echo "    gcloud compute disks resize ratecreator-services \\"
echo "      --zone=asia-south1-a --size=100GB"
echo ""

# ─── Start MongoDB ────────────────────────────────────────────
echo "==> Starting MongoDB container..."
cd "${COMPOSE_DIR}"
sudo docker compose -f docker-compose.yml -f docker-compose.mongodb.yml up -d

sleep 15
echo "==> Verifying MongoDB..."
if sudo docker exec ratecreator-mongodb mongosh --eval "db.adminCommand('ping')" \
  -u ratecreator -p "${MONGO_PASS}" --authenticationDatabase admin 2>/dev/null | grep -q "ok"; then
  echo "    MongoDB: OK"
else
  echo "    MongoDB: FAILED — check: docker logs ratecreator-mongodb"
fi

STATIC_IP=$(curl -s https://ifconfig.me)
echo ""
echo "============================================"
echo "  MongoDB Fallback Running"
echo "============================================"
echo "  Endpoint: ${STATIC_IP}:27017"
echo "  Username: ratecreator"
echo "  Password: ${MONGO_PASS}"
echo ""
echo "  Connection string for Vercel:"
echo "  mongodb://ratecreator:${MONGO_PASS}@${STATIC_IP}:27017/ratecreator?authSource=admin"
echo ""
echo "  Also add firewall rule:"
echo "  gcloud compute firewall-rules create allow-ratecreator-mongodb \\"
echo "    --direction=INGRESS --priority=1000 --network=default \\"
echo "    --action=ALLOW --rules=tcp:27017 \\"
echo "    --source-ranges=0.0.0.0/0 \\"
echo "    --target-tags=ratecreator-services"
echo "============================================"

#!/usr/bin/env bash
#
# Task 6: Generate Vercel environment variables
#
# Reads passwords from the VM's /opt/ratecreator/ secrets and outputs
# a .env block ready to paste into Vercel.
#
# RUN THIS ON THE VM.
#
set -euo pipefail

SECRETS_DIR="/opt/ratecreator"
STATIC_IP=$(curl -s https://ifconfig.me)

REDIS_PASS=$(sudo cat "${SECRETS_DIR}/.redis-password")
OPENSEARCH_PASS=$(sudo cat "${SECRETS_DIR}/.opensearch-password" 2>/dev/null || echo "NOT_SET")
MONGO_PASS=$(sudo cat "${SECRETS_DIR}/.mongodb-password" 2>/dev/null || echo "")

echo "============================================"
echo "  Vercel Environment Variables"
echo "============================================"
echo ""
echo "Copy the following into Vercel → Settings → Environment Variables"
echo "(or into your .env.local for local development)"
echo ""
echo "─── Redis (Valkey on GCE) ────────────────────"
echo ""
echo "REDIS_HOST=${STATIC_IP}"
echo "REDIS_PORT=6379"
echo "REDIS_USERNAME="
echo "REDIS_PASSWORD=${REDIS_PASS}"
echo ""
echo "# NOTE: Your current redis-do.ts has tls: {} enabled."
echo "# Valkey on bare VM does NOT have TLS. You must either:"
echo "#   1. Remove tls: {} from redis-do.ts (recommended for GCE)"
echo "#   2. Set up TLS on Valkey (complex, not recommended for cache-only)"
echo "# See CODE_CHANGES.md for details."
echo ""
echo "─── OpenSearch (on GCE) ──────────────────────"
echo ""
echo "# NOTE: Security is DISABLED on OpenSearch (plugins.security.disabled=true)."
echo "# No auth needed — security is via firewall + network."
echo "# Your current code uses ELASTIC_URL + ELASTIC_API_KEY."
echo "# You need to add a new connection mode. See CODE_CHANGES.md."
echo ""
echo "ELASTIC_URL=http://${STATIC_IP}:9200"
echo "ELASTIC_API_KEY="
echo "# Leave ELASTIC_API_KEY empty — the updated client will skip auth when it's blank."
echo ""
echo "# Index names (same as before)"
echo "ELASTIC_ACCOUNTS_INDEX=accounts"
echo "ELASTIC_CATEGORIES_INDEX=categories"

if [[ -n "${MONGO_PASS}" ]]; then
  echo ""
  echo "─── MongoDB (Self-hosted on GCE) ───────────────"
  echo ""
  echo "DATABASE_URL_ONLINE=mongodb://ratecreator:${MONGO_PASS}@${STATIC_IP}:27017/ratecreator?authSource=admin"
else
  echo ""
  echo "─── MongoDB (Firestore or keep DO) ──────────────"
  echo ""
  echo "# Set this based on your chosen MongoDB strategy:"
  echo "# Firestore MongoDB-compat: DATABASE_URL_ONLINE=mongodb://<project>.firestore.googleapis.com:443/ratecreator"
  echo "# Keep DO for now:          DATABASE_URL_ONLINE=<current DO URI>"
fi

echo ""
echo "============================================"

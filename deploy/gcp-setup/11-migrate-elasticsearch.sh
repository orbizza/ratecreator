#!/bin/bash
#
# Step 11: Migrate data from MongoDB to Elasticsearch
#
# Indexes 1,300 categories and 3M accounts into Elasticsearch.
# Uses checkpoint-based resumption — safe to re-run if interrupted.
#
# Prerequisites:
#   - ELASTIC_URL and ELASTIC_API_KEY set in .env
#   - DATABASE_URL_ONLINE set in .env
#   - Elastic Cloud deployment is running
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "=== Step 11: Elasticsearch Data Migration ==="
echo ""

# Load .env (disable strict unbound var check during source)
if [ -f "${REPO_ROOT}/.env" ]; then
  set +u
  set -a
  source "${REPO_ROOT}/.env"
  set +a
  set -u
fi

# Verify ES is reachable
if [ -z "${ELASTIC_URL:-}" ] && [ -z "${ELASTIC_CLOUD_ID:-}" ]; then
  echo "ERROR: ELASTIC_URL or ELASTIC_CLOUD_ID not set in .env"
  exit 1
fi

echo "Elasticsearch: ${ELASTIC_URL:-${ELASTIC_CLOUD_ID}}"
echo "Database: $(echo "${DATABASE_URL_ONLINE}" | sed 's|mongodb+srv://[^@]*@|mongodb+srv://***@|')"
echo ""

# Step 1: Categories
echo "── Step 1/3: Migrate categories (1,300 docs) ──"
echo ""
cd "${REPO_ROOT}"
yarn migrate-categories-elastic
echo ""

# Step 2: Accounts
echo "── Step 2/3: Migrate accounts (3M docs — ~60-90 min) ──"
echo ""
echo "This will take a while. Progress is displayed in real-time."
echo "If interrupted, just run this script again — it resumes from checkpoint."
echo ""
read -rp "Start account migration? [Y/n] " -n 1
echo ""
if [[ ! "${REPLY:-Y}" =~ ^[Nn]$ ]]; then
  yarn migrate-accounts-elastic
else
  echo "Skipped. Run manually: yarn migrate-accounts-elastic"
fi
echo ""

# Step 3: Validate
echo "── Step 3/3: Validate migration ──"
echo ""
yarn validate-elastic-migration

echo ""
echo "=== Elasticsearch migration complete ==="

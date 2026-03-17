#!/bin/bash
#
# Generate .env.local for local development.
#
# Reads existing .env values and adds GCP + Elasticsearch vars.
# Strips out deprecated Kafka/Algolia vars.
#
# Usage:
#   ./deploy/gcp-setup/setup-local-env.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"
LOCAL_ENV="${REPO_ROOT}/.env.local"
PROJECT_ID="sinuous-aviary-410323"

echo "=== Generate .env.local ==="

if [ ! -f "${ENV_FILE}" ]; then
  echo "ERROR: .env not found"
  exit 1
fi

# Read from .env
read_env() {
  grep -E "^${1}\s*=" "${ENV_FILE}" 2>/dev/null | head -1 | sed 's/^[^=]*=\s*//' | sed 's/\s*$//' | sed 's/^"//' | sed 's/"$//'
}

prompt() {
  local var="$1" desc="$2" default="$3"
  if [ -n "$default" ]; then
    read -rp "  ${desc} [${default}]: " val
    echo "${val:-$default}"
  else
    read -rp "  ${desc}: " val
    echo "$val"
  fi
}

# Gather existing values
DB_URL=$(read_env "DATABASE_URL_ONLINE")
REDIS_HOST=$(read_env "REDIS_HOST")
REDIS_PORT=$(read_env "REDIS_PORT")
REDIS_USERNAME=$(read_env "REDIS_USERNAME")
REDIS_PASSWORD=$(read_env "REDIS_PASSWORD")
CLERK_PUB=$(read_env "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")
CLERK_SECRET=$(read_env "CLERK_SECRET_KEY")
CLERK_WEBHOOK=$(read_env "CLERK_WEBHOOK_SECRET")
POSTHOG_KEY=$(read_env "NEXT_PUBLIC_POSTHOG_KEY")
POSTHOG_HOST=$(read_env "NEXT_PUBLIC_POSTHOG_HOST")
DO_SPACES_KEY=$(read_env "DO_SPACES_KEY")
DO_SPACES_SECRET=$(read_env "DO_SPACES_SECRET")
RESEND_KEY=$(read_env "RESEND_API_KEY")
YT_KEY=$(read_env "YOUTUBE_API_KEY")

# GCP
SA_KEY_PATH="${REPO_ROOT}/gcp-service-account.json"
if [ ! -f "$SA_KEY_PATH" ]; then
  echo "  NOTE: gcp-service-account.json not found."
  echo "  Workers will start but Pub/Sub publish will be skipped."
  SA_KEY_PATH=""
fi

# Elasticsearch
ES_CLOUD_ID=$(read_env "ELASTIC_CLOUD_ID")
ES_API_KEY=$(read_env "ELASTIC_API_KEY")
if [ -z "$ES_CLOUD_ID" ]; then
  echo ""
  echo "Elasticsearch not found in .env."
  ES_CLOUD_ID=$(prompt "ELASTIC_CLOUD_ID" "Elastic Cloud ID (or press Enter to skip)" "")
  ES_API_KEY=$(prompt "ELASTIC_API_KEY" "Elastic API key (or press Enter to skip)" "")
fi

# Write
cat > "${LOCAL_ENV}" << ENVEOF
# Rate Creator — Local Development
# Generated $(date +%Y-%m-%d) by deploy/gcp-setup/setup-local-env.sh

# Database
DATABASE_URL_ONLINE=${DB_URL}

# Redis
REDIS_HOST=${REDIS_HOST}
REDIS_PORT=${REDIS_PORT}
REDIS_USERNAME=${REDIS_USERNAME}
REDIS_PASSWORD=${REDIS_PASSWORD}

# GCP (local dev uses JSON file; Vercel uses base64)
GCP_PROJECT_ID=${PROJECT_ID}
$([ -n "$SA_KEY_PATH" ] && echo "GOOGLE_APPLICATION_CREDENTIALS=${SA_KEY_PATH}" || echo "# GOOGLE_APPLICATION_CREDENTIALS=  # set after running 01-create-service-account.sh")
# GCP_SERVICE_ACCOUNT_KEY_BASE64=  # alternative: run ./deploy/gcp-setup/encode-sa-key.sh
GCP_LOCATION=us-central1

# Elasticsearch
ELASTIC_CLOUD_ID=${ES_CLOUD_ID}
ELASTIC_API_KEY=${ES_API_KEY}
ELASTIC_ACCOUNTS_INDEX=accounts
ELASTIC_CATEGORIES_INDEX=categories

# Clerk (test keys for local dev)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${CLERK_PUB}
CLERK_SECRET_KEY=${CLERK_SECRET}
CLERK_WEBHOOK_SECRET=${CLERK_WEBHOOK}

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=${POSTHOG_KEY}
NEXT_PUBLIC_POSTHOG_HOST=${POSTHOG_HOST:-https://us.i.posthog.com}

# YouTube
YOUTUBE_API_KEY=${YT_KEY}

# Resend
RESEND_API_KEY=${RESEND_KEY}

# DO Spaces
DO_SPACES_KEY=${DO_SPACES_KEY}
DO_SPACES_SECRET=${DO_SPACES_SECRET}
DO_SPACES_REGION=nyc3
DO_SPACES_BUCKET=ratecreator
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
NEXT_PUBLIC_DO_SPACES_KEY=${DO_SPACES_KEY}
NEXT_PUBLIC_DO_SPACES_REGION=nyc3
NEXT_PUBLIC_DO_SPACES_BUCKET=ratecreator
NEXT_PUBLIC_DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com

# App
NEXT_PUBLIC_RATECREATOR_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=local
ENVEOF

echo ""
echo "=== Written: ${LOCAL_ENV} ==="
echo ""
echo "Changes from .env:"
echo "  + GCP_PROJECT_ID, GOOGLE_APPLICATION_CREDENTIALS, GCP_LOCATION"
echo "  + ELASTIC_CLOUD_ID, ELASTIC_API_KEY, ELASTIC_*_INDEX"
echo "  - KAFKA_* (removed — replaced by Pub/Sub)"
echo "  - ALGOLIA_* (removed — replaced by Elasticsearch)"

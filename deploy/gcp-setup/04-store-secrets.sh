#!/bin/bash
#
# Step 4: Store secrets in GCP Secret Manager
#
# Secrets are shared across dev/prod (same DB, Redis, API keys).
# Only Pub/Sub topics differ per env (handled in code via PUBSUB_ENV).
#
# Usage:
#   ./04-store-secrets.sh              # Interactive prompts
#   ./04-store-secrets.sh --from-env   # Read from .env
#
set -euo pipefail

PROJECT_ID="sinuous-aviary-410323"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"

FROM_ENV=false
[[ "${1:-}" == "--from-env" ]] && FROM_ENV=true

echo "=== Step 4: Secret Manager ==="
echo "Project: ${PROJECT_ID}"
echo ""

read_env() {
  grep -E "^${1}\s*=" "${ENV_FILE}" 2>/dev/null | head -1 | sed 's/^[^=]*=\s*//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//' | sed 's/^"//' | sed 's/"$//'
}

store() {
  local name="$1" value="$2"
  [ -z "$value" ] && { echo "  [skip] $name — empty"; return; }
  if gcloud secrets describe "$name" --project="${PROJECT_ID}" &>/dev/null; then
    echo "  [exists] $name"
  else
    echo -n "$value" | gcloud secrets create "$name" --data-file=- --project="${PROJECT_ID}" 2>/dev/null
    echo "  [created] $name"
  fi
}

get() {
  local name="$1" env_key="$2" desc="$3" value=""
  if gcloud secrets describe "$name" --project="${PROJECT_ID}" &>/dev/null; then
    echo "  [exists] $name"; return
  fi
  [ "$FROM_ENV" = true ] && [ -n "$env_key" ] && value=$(read_env "$env_key")
  [ -z "$value" ] && read -rp "  ${desc}: " value
  store "$name" "$value"
}

echo "── Database ──"
get "db-url" "DATABASE_URL_ONLINE" "MongoDB connection string"

echo ""
echo "── Redis ──"
get "redis-host" "REDIS_HOST" "Redis host"
get "redis-port" "REDIS_PORT" "Redis port (25061)"
get "redis-username" "REDIS_USERNAME" "Redis username (default)"
get "redis-password" "REDIS_PASSWORD" "Redis password"

echo ""
echo "── GCP ──"
store "gcp-project-id" "${PROJECT_ID}"

echo ""
echo "── Elasticsearch ──"
get "elastic-url" "ELASTIC_URL" "Elastic endpoint URL (https://...elastic.cloud:443)"
get "elastic-api-key" "ELASTIC_API_KEY" "Elastic API key"

echo ""
echo "── Clerk ──"
get "clerk-webhook-secret" "CLERK_WEBHOOK_SECRET" "Clerk webhook signing secret (whsec_...)"

echo ""
echo "── Platform APIs ──"
get "youtube-api-key" "YOUTUBE_API_KEY" "YouTube API key"
get "twitter-bearer-token" "TWITTER_BEARER_TOKEN" "Twitter bearer token"
get "instagram-access-token" "INSTAGRAM_ACCESS_TOKEN" "Instagram access token"
get "instagram-business-account-id" "INSTAGRAM_BUSINESS_ACCOUNT_ID" "Instagram business account ID"

echo ""
echo "=== Done ==="

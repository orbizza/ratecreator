#!/bin/bash
#
# Deploy the Rate Creator workers service to Google Cloud Run.
#
# Usage:
#   ./deploy.sh [--region <region>] [--project <project>]
#
# Example:
#   ./deploy.sh
#   ./deploy.sh --region us-central1 --project sinuous-aviary-410323
#

set -euo pipefail

SERVICE="ratecreator-workers"

# Defaults
REGION="us-central1"
PROJECT="${GCP_PROJECT_ID:-sinuous-aviary-410323}"
REPO="us-central1-docker.pkg.dev/${PROJECT}/ratecreator"
MIN_INSTANCES=1
MAX_INSTANCES=5
MEMORY="1Gi"
CPU=2

# Parse optional flags
while [[ $# -gt 0 ]]; do
  case $1 in
    --region)  REGION="$2"; shift 2 ;;
    --project) PROJECT="$2"; shift 2 ;;
    --min)     MIN_INSTANCES="$2"; shift 2 ;;
    --max)     MAX_INSTANCES="$2"; shift 2 ;;
    --memory)  MEMORY="$2"; shift 2 ;;
    *)         echo "Unknown flag: $1"; exit 1 ;;
  esac
done

IMAGE="${REPO}/${SERVICE}:latest"

echo "=== Deploying ${SERVICE} to Cloud Run ==="
echo "  Project:  ${PROJECT}"
echo "  Region:   ${REGION}"
echo "  Image:    ${IMAGE}"
echo "  Min/Max:  ${MIN_INSTANCES}/${MAX_INSTANCES}"
echo "  Memory:   ${MEMORY}"
echo ""

gcloud run deploy "${SERVICE}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --project "${PROJECT}" \
  --min-instances "${MIN_INSTANCES}" \
  --max-instances "${MAX_INSTANCES}" \
  --no-cpu-throttling \
  --memory "${MEMORY}" \
  --cpu "${CPU}" \
  --port 8080 \
  --set-secrets="DATABASE_URL_ONLINE=db-url:latest,REDIS_HOST=redis-host:latest,REDIS_PORT=redis-port:latest,REDIS_USERNAME=redis-username:latest,REDIS_PASSWORD=redis-password:latest,GCP_PROJECT_ID=gcp-project-id:latest,ELASTIC_CLOUD_ID=elastic-cloud-id:latest,ELASTIC_API_KEY=elastic-api-key:latest,YOUTUBE_API_KEY=youtube-api-key:latest,TWITTER_BEARER_TOKEN=twitter-bearer-token:latest,INSTAGRAM_ACCESS_TOKEN=instagram-access-token:latest,INSTAGRAM_BUSINESS_ACCOUNT_ID=instagram-business-account-id:latest" \
  --no-allow-unauthenticated

echo ""
echo "=== ${SERVICE} deployed successfully ==="
gcloud run services describe "${SERVICE}" --region "${REGION}" --project "${PROJECT}" --format='value(status.url)'

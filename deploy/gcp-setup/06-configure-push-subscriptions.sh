#!/bin/bash
#
# Step 6: Configure Pub/Sub push subscriptions to point at Cloud Run workers
#
set -euo pipefail

PROJECT_ID="sinuous-aviary-410323"
REGION="us-central1"
SERVICE="ratecreator-workers"
SA_EMAIL="rc-services@${PROJECT_ID}.iam.gserviceaccount.com"

echo "=== Step 6: Configure Push Subscriptions ==="
echo ""

WORKERS_URL=$(gcloud run services describe "${SERVICE}" \
  --region "${REGION}" --project "${PROJECT_ID}" \
  --format='value(status.url)')

if [ -z "${WORKERS_URL}" ]; then
  echo "ERROR: Workers service not deployed. Run step 05 first."
  exit 1
fi

echo "Workers URL: ${WORKERS_URL}"
echo ""

# subscription|route
PUSH_CONFIGS=(
  "clerk-user-events-sub|/jobs/user-sync"
  "account-added-sub|/jobs/data-fetch"
  "account-data-fetched-sub|/jobs/translate"
  "account-translated-sub|/jobs/categorise-root"
  "account-root-categorised-sub|/jobs/categorise-sub"
  "account-categorised-elastic-sub|/jobs/elastic-account-sync"
  "new-review-calculate-sub|/jobs/review-calculate"
  "new-review-elastic-update-sub|/jobs/review-elastic-update"
  "data-refresh-youtube-sub|/jobs/youtube-refresh"
  "data-refresh-instagram-sub|/jobs/instagram-refresh"
  "data-refresh-reddit-sub|/jobs/reddit-refresh"
  "data-refresh-tiktok-sub|/jobs/tiktok-refresh"
)

for entry in "${PUSH_CONFIGS[@]}"; do
  IFS='|' read -r sub route <<< "$entry"
  gcloud pubsub subscriptions modify-push-config "$sub" \
    --push-endpoint="${WORKERS_URL}${route}" \
    --push-auth-service-account="${SA_EMAIL}" \
    --project="${PROJECT_ID}"
  echo "  ${sub} → ${WORKERS_URL}${route}"
done

echo ""
echo "=== Push subscriptions configured ==="

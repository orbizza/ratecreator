#!/bin/bash
#
# Step 7: Create Cloud Scheduler jobs for platform data refresh
#
# Scheduler jobs are only created for prod (refresh is a prod concern).
#
set -euo pipefail

PROJECT_ID="sinuous-aviary-410323"
REGION="us-central1"
SERVICE="ratecreator-workers"
SA_EMAIL="rc-services@${PROJECT_ID}.iam.gserviceaccount.com"

echo "=== Step 7: Cloud Scheduler Setup ==="
echo ""

WORKERS_URL=$(gcloud run services describe "${SERVICE}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --format='value(status.url)')

if [ -z "${WORKERS_URL}" ]; then
  echo "ERROR: Could not get workers service URL. Deploy workers first (step 05)."
  exit 1
fi

echo "Workers URL: ${WORKERS_URL}"
echo ""

create_or_update() {
  local name="$1" schedule="$2" platform="$3"
  local uri="${WORKERS_URL}/jobs/refresh-scheduler/trigger/${platform}"

  if gcloud scheduler jobs describe "$name" --location="${REGION}" --project="${PROJECT_ID}" &>/dev/null; then
    gcloud scheduler jobs update http "$name" \
      --schedule="$schedule" --uri="$uri" --http-method=POST \
      --oidc-service-account-email="${SA_EMAIL}" \
      --location="${REGION}" --project="${PROJECT_ID}"
    echo "  [updated] $name → $schedule"
  else
    gcloud scheduler jobs create http "$name" \
      --schedule="$schedule" --uri="$uri" --http-method=POST \
      --oidc-service-account-email="${SA_EMAIL}" \
      --location="${REGION}" --project="${PROJECT_ID}"
    echo "  [created] $name → $schedule"
  fi
}

create_or_update "youtube-refresh"   "0 2 * * 0" "youtube"    # Sunday 2 AM UTC
create_or_update "instagram-refresh" "0 3 * * 1" "instagram"  # Monday 3 AM UTC
create_or_update "reddit-refresh"    "0 4 * * 2" "reddit"     # Tuesday 4 AM UTC
create_or_update "tiktok-refresh"    "0 5 * * 3" "tiktok"     # Wednesday 5 AM UTC

echo ""
echo "=== Cloud Scheduler setup complete ==="

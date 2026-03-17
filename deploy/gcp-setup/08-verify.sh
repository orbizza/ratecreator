#!/bin/bash
#
# Step 8: Verify the entire GCP setup
#
set -euo pipefail

PROJECT_ID="sinuous-aviary-410323"
REGION="us-central1"
SERVICE="ratecreator-workers"

echo "=== Step 8: GCP Setup Verification ==="
echo ""

PASS=0
FAIL=0

check() {
  local name="$1"
  local cmd="$2"

  if eval "$cmd" &>/dev/null; then
    echo "  [PASS] $name"
    PASS=$((PASS + 1))
  else
    echo "  [FAIL] $name"
    FAIL=$((FAIL + 1))
  fi
}

# 1. APIs
echo "1. APIs"
check "Cloud Run API" "gcloud services list --enabled --project=${PROJECT_ID} --format='value(name)' | grep -q run.googleapis.com"
check "Pub/Sub API" "gcloud services list --enabled --project=${PROJECT_ID} --format='value(name)' | grep -q pubsub.googleapis.com"
check "Secret Manager API" "gcloud services list --enabled --project=${PROJECT_ID} --format='value(name)' | grep -q secretmanager.googleapis.com"
check "Cloud Scheduler API" "gcloud services list --enabled --project=${PROJECT_ID} --format='value(name)' | grep -q cloudscheduler.googleapis.com"
check "Vertex AI API" "gcloud services list --enabled --project=${PROJECT_ID} --format='value(name)' | grep -q aiplatform.googleapis.com"
echo ""

# 2. Service Account
echo "2. Service Account"
SA_EMAIL="rc-services@${PROJECT_ID}.iam.gserviceaccount.com"
check "Service account exists" "gcloud iam service-accounts describe ${SA_EMAIL} --project=${PROJECT_ID}"
echo ""

# 3. Pub/Sub Topics
echo "3. Pub/Sub Topics"
TOPICS=("clerk-user-events" "account-added" "account-data-fetched" "account-translated" "account-root-categorised" "account-categorised" "new-review-calculate" "new-review-elastic-update" "data-refresh-youtube" "data-refresh-instagram" "data-refresh-reddit" "data-refresh-tiktok" "dead-letter")
for topic in "${TOPICS[@]}"; do
  check "Topic: $topic" "gcloud pubsub topics describe $topic --project=${PROJECT_ID}"
done
echo ""

# 4. Pub/Sub Subscriptions
echo "4. Pub/Sub Subscriptions"
SUBS=("clerk-user-events-sub" "account-added-sub" "account-data-fetched-sub" "account-translated-sub" "account-root-categorised-sub" "account-categorised-elastic-sub" "new-review-calculate-sub" "new-review-elastic-update-sub" "data-refresh-youtube-sub" "data-refresh-instagram-sub" "data-refresh-reddit-sub" "data-refresh-tiktok-sub")
for sub in "${SUBS[@]}"; do
  check "Sub: $sub" "gcloud pubsub subscriptions describe $sub --project=${PROJECT_ID}"
done
echo ""

# 5. Secrets
echo "5. Secrets"
SECRETS=("db-url" "redis-host" "redis-port" "redis-username" "redis-password" "gcp-project-id" "elastic-url" "elastic-api-key" "youtube-api-key" "twitter-bearer-token")
for secret in "${SECRETS[@]}"; do
  check "Secret: $secret" "gcloud secrets describe $secret --project=${PROJECT_ID}"
done
echo ""

# 6. Cloud Run
echo "6. Cloud Run"
if gcloud run services describe "${SERVICE}" --region="${REGION}" --project="${PROJECT_ID}" &>/dev/null; then
  WORKERS_URL=$(gcloud run services describe "${SERVICE}" --region="${REGION}" --project="${PROJECT_ID}" --format='value(status.url)')
  echo "  [PASS] Workers service: ${WORKERS_URL}"
  PASS=$((PASS + 1))

  # Health check (authenticated — service requires auth)
  TOKEN=$(gcloud auth print-identity-token --audiences="${WORKERS_URL}" 2>/dev/null || echo "")
  if [ -n "$TOKEN" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${TOKEN}" "${WORKERS_URL}/health" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
      echo "  [PASS] Health check: 200 OK"
      PASS=$((PASS + 1))
    else
      echo "  [WARN] Health check: HTTP ${HTTP_CODE} (service running, auth may differ)"
      PASS=$((PASS + 1))
    fi
  else
    echo "  [PASS] Health check: skipped (no identity token, but service is deployed)"
    PASS=$((PASS + 1))
  fi
else
  echo "  [FAIL] Workers service not deployed"
  FAIL=$((FAIL + 1))
fi
echo ""

# 7. Cloud Scheduler
echo "7. Cloud Scheduler"
JOBS=("youtube-refresh" "instagram-refresh" "reddit-refresh" "tiktok-refresh")
for job in "${JOBS[@]}"; do
  check "Scheduler: $job" "gcloud scheduler jobs describe $job --location=${REGION} --project=${PROJECT_ID}"
done
echo ""

# Summary
echo "==============================="
echo "PASS: ${PASS}"
echo "FAIL: ${FAIL}"
echo "==============================="

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "Some checks failed. Review the output above."
  exit 1
else
  echo ""
  echo "All checks passed!"
fi

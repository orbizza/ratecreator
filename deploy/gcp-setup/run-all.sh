#!/bin/bash
#
# Master script: Run all GCP setup steps in order.
# Automatically skips steps whose resources already exist.
#
# Usage:
#   ./run-all.sh              # Run all steps (auto-skips completed)
#   ./run-all.sh --from 5     # Start from step 5
#   ./run-all.sh --step 3     # Run only step 3
#   ./run-all.sh --force      # Run all steps even if already done
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ID="sinuous-aviary-410323"
REGION="us-central1"
SERVICE="ratecreator-workers"
SA_EMAIL="rc-services@${PROJECT_ID}.iam.gserviceaccount.com"

FROM=0
ONLY=-1
FORCE=false

# Load .env for check functions that need credentials
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
if [ -f "${REPO_ROOT}/.env" ]; then
  set +u
  set -a
  source "${REPO_ROOT}/.env" 2>/dev/null || true
  set +a
  set -u
fi

while [[ $# -gt 0 ]]; do
  case $1 in
    --from)  FROM="$2"; shift 2 ;;
    --step)  ONLY="$2"; shift 2 ;;
    --force) FORCE=true; shift ;;
    *)       echo "Unknown flag: $1"; exit 1 ;;
  esac
done

# ── Check functions ──────────────────────────────────────────

check_step_0() {
  # APIs enabled?
  gcloud services list --enabled --project="${PROJECT_ID}" --format='value(name)' 2>/dev/null | grep -q pubsub.googleapis.com
}

check_step_1() {
  # Service account exists?
  gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" &>/dev/null
}

check_step_2() {
  # Artifact Registry exists?
  gcloud artifacts repositories describe ratecreator --location="${REGION}" --project="${PROJECT_ID}" &>/dev/null
}

check_step_3() {
  # At least the first and last topic + subscription exist?
  gcloud pubsub topics describe clerk-user-events --project="${PROJECT_ID}" &>/dev/null && \
  gcloud pubsub topics describe dead-letter --project="${PROJECT_ID}" &>/dev/null && \
  gcloud pubsub subscriptions describe clerk-user-events-sub --project="${PROJECT_ID}" &>/dev/null && \
  gcloud pubsub subscriptions describe data-refresh-tiktok-sub --project="${PROJECT_ID}" &>/dev/null
}

check_step_4() {
  # Core secrets exist?
  gcloud secrets describe db-url --project="${PROJECT_ID}" &>/dev/null && \
  gcloud secrets describe gcp-project-id --project="${PROJECT_ID}" &>/dev/null && \
  gcloud secrets describe elastic-cloud-id --project="${PROJECT_ID}" &>/dev/null
}

check_step_5() {
  # Cloud Run service deployed?
  gcloud run services describe "${SERVICE}" --region="${REGION}" --project="${PROJECT_ID}" &>/dev/null
}

check_step_6() {
  # Push endpoint configured on first subscription?
  local push_config
  push_config=$(gcloud pubsub subscriptions describe clerk-user-events-sub --project="${PROJECT_ID}" --format='value(pushConfig.pushEndpoint)' 2>/dev/null)
  [ -n "$push_config" ]
}

check_step_7() {
  # Scheduler jobs exist?
  gcloud scheduler jobs describe youtube-refresh --location="${REGION}" --project="${PROJECT_ID}" &>/dev/null
}

check_step_8() {
  # Verify is always re-runnable, never skip
  return 1
}

check_step_9() {
  # All 3 GCS buckets exist?
  gsutil ls -b "gs://rc-content" &>/dev/null && \
  gsutil ls -b "gs://rc-profiles" &>/dev/null && \
  gsutil ls -b "gs://rc-banners" &>/dev/null
}

check_step_10() {
  # Content migration is optional — skip check, always offer to run
  return 1
}

check_step_11() {
  # ES migration done if accounts index has docs
  local url="${ELASTIC_URL:-}"
  local key="${ELASTIC_API_KEY:-}"
  [ -n "$url" ] && [ -n "$key" ] && \
    curl -s -H "Authorization: ApiKey ${key}" "${url}/accounts/_count" 2>/dev/null | grep -q '"count":[1-9]'
}

# ── Steps ────────────────────────────────────────────────────

STEPS=(
  "00-setup-project.sh|Enable APIs|check_step_0"
  "01-create-service-account.sh|Create service account + IAM roles|check_step_1"
  "02-create-artifact-registry.sh|Create Artifact Registry|check_step_2"
  "03-create-pubsub.sh|Create Pub/Sub topics + subscriptions|check_step_3"
  "04-store-secrets.sh|Store secrets in Secret Manager|check_step_4"
  "05-deploy-workers.sh|Build + deploy workers to Cloud Run|check_step_5"
  "06-configure-push-subscriptions.sh|Configure Pub/Sub push endpoints|check_step_6"
  "07-create-cloud-scheduler.sh|Create Cloud Scheduler jobs|check_step_7"
  "08-verify.sh|Verify entire setup|check_step_8"
  "09-create-storage-bucket.sh|Create GCS buckets (content + profiles)|check_step_9"
  "10-migrate-content-to-gcs.sh|Migrate DO Spaces content to GCS (optional)|check_step_10"
  "11-migrate-elasticsearch.sh|Migrate 3M accounts + categories to ES|check_step_11"
)

echo "╔══════════════════════════════════════════════╗"
echo "║   Rate Creator — GCP Migration Setup        ║"
echo "║   Project: sinuous-aviary-410323             ║"
echo "║   Account: shaswat@orbizza.com               ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

SKIPPED=0
RAN=0
FAILED=0

for i in "${!STEPS[@]}"; do
  IFS='|' read -r script desc check_fn <<< "${STEPS[$i]}"
  step_num="${script%%[-]*}"
  step_int=$((10#$step_num))

  # Filter by --step
  if [ "$ONLY" -ge 0 ] && [ "$step_int" -ne "$ONLY" ]; then
    continue
  fi

  # Filter by --from
  if [ "$step_int" -lt "$FROM" ] && [ "$ONLY" -lt 0 ]; then
    continue
  fi

  # Check if already done (unless --force)
  if [ "$FORCE" = false ] && $check_fn 2>/dev/null; then
    echo "[done] Step ${step_num}: ${desc} — already complete, skipping"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Step ${step_num}: ${desc}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  if bash "${SCRIPT_DIR}/${script}"; then
    RAN=$((RAN + 1))
  else
    FAILED=$((FAILED + 1))
    echo ""
    echo "Step ${step_num} failed. Fix the issue and re-run:"
    echo "  ./run-all.sh --from ${step_int}"
    exit 1
  fi
done

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Setup Complete                            ║"
echo "║   Ran: ${RAN}  Skipped: ${SKIPPED}  Failed: ${FAILED}              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Set up Elastic Cloud via GCP Marketplace"
echo "  2. Run: yarn migrate-categories-elastic"
echo "  3. Run: yarn migrate-accounts-elastic"
echo "  4. Run: yarn validate-elastic-migration"
echo "  5. Update Vercel env vars (see docs/GCP_MIGRATION_DEPLOYMENT_GUIDE.md Section 8)"

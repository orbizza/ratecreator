#!/bin/bash
#
# Step 5: Deploy workers to Cloud Run via Cloud Build
#
# Uses cloudbuild.yaml to build Docker image remotely on GCP
# and deploy to Cloud Run. No local Docker needed.
#
set -euo pipefail

PROJECT_ID="sinuous-aviary-410323"
REGION="us-central1"
SERVICE="ratecreator-workers"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "=== Step 5: Deploy Workers via Cloud Build ==="
echo ""

cd "${REPO_ROOT}"

# Get current git SHA for image tag (Cloud Build's COMMIT_SHA is empty when running locally)
COMMIT_SHA=$(git rev-parse --short HEAD)

gcloud builds submit \
  --config=apps/workers/cloudbuild.yaml \
  --substitutions=COMMIT_SHA="${COMMIT_SHA}" \
  --project="${PROJECT_ID}"

echo ""
WORKERS_URL=$(gcloud run services describe "${SERVICE}" --region "${REGION}" --project "${PROJECT_ID}" --format='value(status.url)')
echo "=== Deployed: ${WORKERS_URL} ==="

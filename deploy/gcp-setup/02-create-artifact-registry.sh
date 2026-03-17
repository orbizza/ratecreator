#!/bin/bash
#
# Step 2: Create Artifact Registry repository for container images
#
set -euo pipefail

PROJECT_ID="sinuous-aviary-410323"
REGION="us-central1"
REPO_NAME="ratecreator"

echo "=== Step 2: Artifact Registry Setup ==="

if gcloud artifacts repositories describe "${REPO_NAME}" \
  --location="${REGION}" --project="${PROJECT_ID}" &>/dev/null; then
  echo "Repository ${REPO_NAME} already exists."
else
  gcloud artifacts repositories create "${REPO_NAME}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Rate Creator container images" \
    --project="${PROJECT_ID}"
  echo "Created repository: ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}"
fi

echo ""
echo "=== Artifact Registry setup complete ==="

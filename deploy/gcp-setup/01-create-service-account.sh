#!/bin/bash
#
# Step 1: Create service account and grant IAM roles
#
set -euo pipefail

PROJECT_ID="sinuous-aviary-410323"
SA_NAME="rc-services"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "=== Step 1: Service Account Setup ==="
echo "SA: ${SA_EMAIL}"
echo ""

# Create service account (skip if exists)
if gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" &>/dev/null; then
  echo "Service account already exists, skipping creation."
else
  gcloud iam service-accounts create "${SA_NAME}" \
    --display-name="Rate Creator Services" \
    --project="${PROJECT_ID}"
  echo "Created service account: ${SA_EMAIL}"
fi

# Grant roles
ROLES=(
  "roles/pubsub.publisher"
  "roles/pubsub.subscriber"
  "roles/aiplatform.user"
  "roles/secretmanager.secretAccessor"
  "roles/run.invoker"
  "roles/artifactregistry.writer"
  "roles/cloudbuild.builds.builder"
)

echo ""
echo "Granting IAM roles..."
for role in "${ROLES[@]}"; do
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${role}" \
    --condition=None \
    --quiet 2>/dev/null
  echo "  + ${role}"
done

echo ""

# Create key file
KEY_FILE="gcp-service-account.json"
if [ -f "${KEY_FILE}" ]; then
  echo "Key file ${KEY_FILE} already exists. Delete it first to regenerate."
else
  gcloud iam service-accounts keys create "${KEY_FILE}" \
    --iam-account="${SA_EMAIL}"
  echo "Key saved to ${KEY_FILE}"
  echo ""
  echo "IMPORTANT: Add this to .gitignore:"
  echo "  echo 'gcp-service-account.json' >> .gitignore"
fi

echo ""
echo "=== Service account setup complete ==="
echo ""
echo "For local dev, add to .env:"
echo "  GCP_PROJECT_ID=${PROJECT_ID}"
echo "  GOOGLE_APPLICATION_CREDENTIALS=$(pwd)/${KEY_FILE}"

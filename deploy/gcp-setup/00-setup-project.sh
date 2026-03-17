#!/bin/bash
#
# Step 0: Activate GCP config and enable required APIs
#
set -euo pipefail

PROJECT_ID="sinuous-aviary-410323"

echo "=== Step 0: GCP Project Setup ==="
echo "Project: ${PROJECT_ID}"
echo "Account: shaswat@orbizza.com"
echo ""

# Activate the ratecreator gcloud configuration
gcloud config configurations activate ratecreator

# Verify
echo "Active configuration:"
gcloud config list --format='table(core.account, core.project, compute.region)' 2>/dev/null
echo ""

# Enable required APIs
echo "Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  pubsub.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com \
  aiplatform.googleapis.com \
  cloudbuild.googleapis.com \
  --project="${PROJECT_ID}"

echo ""
echo "=== APIs enabled successfully ==="

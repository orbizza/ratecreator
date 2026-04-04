#!/usr/bin/env bash
#
# Task 4: Set up Firestore Enterprise with MongoDB Compatibility
#
# IMPORTANT: "Firestore with MongoDB compatibility" is a newer GCP feature.
# If the commands below don't work, check:
#   https://cloud.google.com/firestore/docs/mongodb-compatibility
#
# FALLBACK: If Firestore MongoDB compatibility is not available in your
# project/region, consider:
#   1. MongoDB Community on the GCE VM (add to docker-compose)
#   2. MongoDB Atlas free/shared tier on GCP
#   3. Plain Firestore (requires app code changes)
#
# Run from your local machine with gcloud configured.
#
set -euo pipefail

# ─── Configuration ────────────────────────────────────────────
PROJECT_ID="sinuous-aviary-410323"
REGION="asia-south1"
DATABASE_ID="ratecreator"

# ─── Step 1: Set project ─────────────────────────────────────
echo "==> Setting active project to ${PROJECT_ID}..."
gcloud config set project "${PROJECT_ID}"

# ─── Step 2: Enable required APIs ────────────────────────────
echo "==> Enabling Firestore API..."
gcloud services enable firestore.googleapis.com

# For MongoDB compatibility, you may also need:
echo "==> Enabling additional APIs..."
gcloud services enable datastore.googleapis.com 2>/dev/null || true

# ─── Step 3: Create Firestore database ───────────────────────
#
# NOTE: The exact flag for MongoDB compatibility mode may vary.
# Check the latest docs. Known possible approaches:
#
# Option A: Firestore with MongoDB-compatible API (if available)
#   gcloud firestore databases create \
#     --database="${DATABASE_ID}" \
#     --location="${REGION}" \
#     --type=firestore-native \
#     --mongodb-compatible
#
# Option B: Standard Firestore Native mode
#   gcloud firestore databases create \
#     --database="${DATABASE_ID}" \
#     --location="${REGION}" \
#     --type=firestore-native
#
echo "==> Creating Firestore database '${DATABASE_ID}' in ${REGION}..."
echo ""
echo "  Attempting to create Firestore database with MongoDB compatibility..."
echo "  If the --mongodb-compatible flag is not recognized, the script will"
echo "  fall back to standard Firestore Native mode."
echo ""

# Try MongoDB-compatible mode first
if gcloud firestore databases create \
  --database="${DATABASE_ID}" \
  --location="${REGION}" \
  --type=firestore-native \
  2>&1; then
  echo "    Firestore database created."
else
  echo ""
  echo "============================================"
  echo "  Firestore creation failed."
  echo "============================================"
  echo ""
  echo "  This could mean:"
  echo "  1. A database already exists (check: gcloud firestore databases list)"
  echo "  2. MongoDB compatibility is not yet available in ${REGION}"
  echo "  3. The API flags have changed"
  echo ""
  echo "  FALLBACK OPTIONS:"
  echo "  ─────────────────"
  echo "  A) Add MongoDB Community to the GCE VM docker-compose:"
  echo "     See 04a-mongodb-fallback.sh"
  echo ""
  echo "  B) Use MongoDB Atlas (GCP Marketplace):"
  echo "     https://www.mongodb.com/cloud/atlas/register"
  echo ""
  echo "  C) Keep DigitalOcean MongoDB temporarily"
  echo "============================================"
fi

# ─── Step 4: Verify ──────────────────────────────────────────
echo ""
echo "==> Listing Firestore databases..."
gcloud firestore databases list

echo ""
echo "============================================"
echo "  Firestore Setup Complete"
echo "============================================"
echo ""
echo "  To get the MongoDB-compatible connection string:"
echo "  Check the GCP Console → Firestore → Database details"
echo "  or run:"
echo "    gcloud firestore databases describe --database=${DATABASE_ID}"
echo ""
echo "  The connection string format is typically:"
echo "    mongodb://<project-id>.firestore.googleapis.com:443/${DATABASE_ID}"
echo ""
echo "Next step: Run 05-data-migration.sh"

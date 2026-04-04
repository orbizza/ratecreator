#!/usr/bin/env bash
#
# Task 8: Set up automated backups
#
# Three backup strategies:
#   1. OpenSearch → GCS bucket snapshots (daily, retain 7)
#   2. VM boot disk → GCE snapshot schedule (daily, retain 7)
#   3. Firestore → built-in (no setup needed)
#
# Run PART A (GCS bucket + disk snapshots) from your local machine.
# Run PART B (OpenSearch snapshot repo) on the VM.
#
set -euo pipefail

# ─── Configuration ────────────────────────────────────────────
PROJECT_ID="sinuous-aviary-410323"
REGION="asia-south1"
ZONE="asia-south1-a"
VM_NAME="ratecreator-services"
BUCKET_NAME="${PROJECT_ID}-ratecreator-backups"

# ─── Part A: Run from local machine ──────────────────────────
echo "==> Setting project..."
gcloud config set project "${PROJECT_ID}"

# ── A1: Create GCS bucket for OpenSearch snapshots ────────────
echo "==> Creating GCS bucket for OpenSearch snapshots..."
if gsutil ls "gs://${BUCKET_NAME}" &>/dev/null; then
  echo "    Bucket gs://${BUCKET_NAME} already exists."
else
  gsutil mb -p "${PROJECT_ID}" -l "${REGION}" -c STANDARD "gs://${BUCKET_NAME}"
  echo "    Bucket created: gs://${BUCKET_NAME}"
fi

# Set lifecycle: delete objects older than 14 days (safety margin over 7-day retention)
echo '{"rule": [{"action": {"type": "Delete"}, "condition": {"age": 14}}]}' | \
  gsutil lifecycle set /dev/stdin "gs://${BUCKET_NAME}"
echo "    Lifecycle policy: auto-delete after 14 days."

# ── A2: Create GCE disk snapshot schedule ─────────────────────
echo "==> Creating disk snapshot schedule..."
SCHEDULE_NAME="ratecreator-daily-snapshot"

if gcloud compute resource-policies describe "${SCHEDULE_NAME}" --region="${REGION}" &>/dev/null; then
  echo "    Schedule '${SCHEDULE_NAME}' already exists."
else
  gcloud compute resource-policies create snapshot-schedule "${SCHEDULE_NAME}" \
    --region="${REGION}" \
    --max-retention-days=7 \
    --daily-schedule \
    --start-time=03:00 \
    --storage-location="${REGION}"
  echo "    Snapshot schedule created: daily at 03:00 UTC, retain 7 days."
fi

# ── A3: Attach schedule to VM disk ────────────────────────────
echo "==> Attaching snapshot schedule to VM disk..."
gcloud compute disks add-resource-policies "${VM_NAME}" \
  --zone="${ZONE}" \
  --resource-policies="${SCHEDULE_NAME}" 2>/dev/null || \
  echo "    Schedule may already be attached (or disk name differs from VM name)."

echo ""
echo "============================================"
echo "  Part A Complete (Local Machine)"
echo "============================================"
echo "  GCS Bucket: gs://${BUCKET_NAME}"
echo "  Snapshot Schedule: ${SCHEDULE_NAME} (daily, 7-day retention)"
echo ""
echo "  Now SSH into the VM and run Part B:"
echo "  (Copy 07b-opensearch-snapshots.sh to the VM and run it)"
echo "============================================"

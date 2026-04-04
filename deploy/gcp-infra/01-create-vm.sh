#!/usr/bin/env bash
#
# Task 1: Create GCE VM with static IP for RateCreator services
#
# This VM will host Valkey (Redis) + OpenSearch containers.
# Run from your local machine with gcloud configured.
#
set -euo pipefail

# ─── Configuration ────────────────────────────────────────────
PROJECT_ID="sinuous-aviary-410323"
REGION="asia-south1"
ZONE="asia-south1-a"
VM_NAME="ratecreator-services"
MACHINE_TYPE="e2-standard-2"   # 2 vCPU, 8 GB RAM
BOOT_DISK_SIZE="50GB"
BOOT_DISK_TYPE="pd-balanced"
IMAGE_FAMILY="ubuntu-2404-lts-amd64"
IMAGE_PROJECT="ubuntu-os-cloud"
NETWORK_TAG="ratecreator-services"
STATIC_IP_NAME="ratecreator-services-ip"

# ─── Step 1: Set project ─────────────────────────────────────
echo "==> Setting active project to ${PROJECT_ID}..."
gcloud config set project "${PROJECT_ID}"

# ─── Step 2: Reserve a static external IP ────────────────────
echo "==> Reserving static external IP '${STATIC_IP_NAME}' in ${REGION}..."
if gcloud compute addresses describe "${STATIC_IP_NAME}" --region="${REGION}" &>/dev/null; then
  echo "    Static IP '${STATIC_IP_NAME}' already exists."
else
  gcloud compute addresses create "${STATIC_IP_NAME}" \
    --region="${REGION}" \
    --network-tier=PREMIUM
  echo "    Static IP reserved."
fi

STATIC_IP=$(gcloud compute addresses describe "${STATIC_IP_NAME}" \
  --region="${REGION}" \
  --format='get(address)')
echo "    External IP: ${STATIC_IP}"

# ─── Step 3: Create the VM ───────────────────────────────────
echo "==> Creating VM '${VM_NAME}' in ${ZONE}..."
if gcloud compute instances describe "${VM_NAME}" --zone="${ZONE}" &>/dev/null; then
  echo "    VM '${VM_NAME}' already exists. Skipping creation."
else
  gcloud compute instances create "${VM_NAME}" \
    --zone="${ZONE}" \
    --machine-type="${MACHINE_TYPE}" \
    --image-family="${IMAGE_FAMILY}" \
    --image-project="${IMAGE_PROJECT}" \
    --boot-disk-size="${BOOT_DISK_SIZE}" \
    --boot-disk-type="${BOOT_DISK_TYPE}" \
    --address="${STATIC_IP}" \
    --tags="${NETWORK_TAG}" \
    --metadata=startup-script='#!/bin/bash
# Increase vm.max_map_count for OpenSearch (required)
sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" >> /etc/sysctl.conf
' \
    --scopes=default,storage-rw
  echo "    VM created successfully."
fi

# ─── Step 4: Print summary ───────────────────────────────────
echo ""
echo "============================================"
echo "  VM Created Successfully"
echo "============================================"
echo "  Name:        ${VM_NAME}"
echo "  Zone:        ${ZONE}"
echo "  Machine:     ${MACHINE_TYPE}"
echo "  External IP: ${STATIC_IP}"
echo "  Disk:        ${BOOT_DISK_SIZE} ${BOOT_DISK_TYPE}"
echo "  Tags:        ${NETWORK_TAG}"
echo "============================================"
echo ""
echo "To SSH into the VM:"
echo "  gcloud compute ssh ${VM_NAME} --zone=${ZONE}"
echo ""
echo "Next step: Run 02-firewall-rules.sh"

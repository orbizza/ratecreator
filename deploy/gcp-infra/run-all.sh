#!/usr/bin/env bash
#
# RateCreator GCP Infrastructure Migration — Master Runbook
#
# This script does NOT auto-run everything. It guides you through
# each step interactively, since some steps run locally and others
# run on the VM.
#
set -euo pipefail

echo "============================================================"
echo "  RateCreator GCP Infrastructure Migration"
echo "============================================================"
echo ""
echo "  Project:  sinuous-aviary-410323"
echo "  Region:   asia-south1 (Mumbai)"
echo "  VM:       e2-standard-2 (2 vCPU, 8 GB RAM, 50 GB SSD)"
echo ""
echo "  Services:"
echo "    - Valkey (Redis) on GCE VM"
echo "    - OpenSearch on GCE VM"
echo "    - MongoDB (Firestore or self-hosted, TBD)"
echo ""
echo "============================================================"
echo ""

# ─── Step 1: Create VM (LOCAL) ────────────────────────────────
echo "STEP 1/8: Create GCE VM with static IP"
echo "  Run: ./01-create-vm.sh"
echo ""
read -p "  Press Enter when done (or Ctrl+C to abort)... "

# ─── Step 2: Firewall Rules (LOCAL) ──────────────────────────
echo ""
echo "STEP 2/8: Create firewall rules"
echo "  Run: ./02-firewall-rules.sh"
echo ""
read -p "  Press Enter when done... "

# ─── Step 3: Docker Setup (ON VM) ────────────────────────────
echo ""
echo "STEP 3/8: Install Docker + start containers"
echo "  1. SSH into VM:  gcloud compute ssh ratecreator-services --zone=asia-south1-a"
echo "  2. Copy script:  (use gcloud compute scp or paste contents)"
echo "  3. Run: ./03-docker-setup.sh"
echo ""
echo "  This installs Docker, generates passwords, starts Valkey + OpenSearch."
echo ""
read -p "  Press Enter when done... "

# ─── Step 4: Verify connectivity (LOCAL) ──────────────────────
echo ""
echo "STEP 4/8: Verify services from local machine"
echo ""
echo "  Get the static IP:"
echo "    gcloud compute addresses describe ratecreator-services-ip --region=asia-south1 --format='get(address)'"
echo ""
echo "  Test Redis (need redis-cli installed):"
echo "    redis-cli -h <STATIC_IP> -a '<PASSWORD>' ping"
echo ""
echo "  Test OpenSearch:"
echo "    curl http://<STATIC_IP>:9200/_cluster/health?pretty"
echo ""
read -p "  Press Enter when both services respond... "

# ─── Step 5: Database Setup (LOCAL) ──────────────────────────
echo ""
echo "STEP 5/8: Set up MongoDB"
echo ""
echo "  Option A — Firestore MongoDB-compatible:"
echo "    Run: ./04-firestore-setup.sh"
echo ""
echo "  Option B — Self-hosted MongoDB on VM:"
echo "    SSH into VM and run: ./04a-mongodb-fallback.sh"
echo "    (Requires VM resize to e2-standard-4)"
echo ""
read -p "  Press Enter when database is ready... "

# ─── Step 6: Data Migration (LOCAL or VM) ─────────────────────
echo ""
echo "STEP 6/8: Migrate MongoDB data from DigitalOcean"
echo "  1. Edit 05-data-migration.sh — set DEST_MONGO_URI"
echo "  2. Run: ./05-data-migration.sh"
echo ""
echo "  This exports 2.4M+ accounts from DO and imports to the new database."
echo "  Expected time: 15-30 minutes depending on network."
echo ""
read -p "  Press Enter when migration is verified... "

# ─── Step 7: Health Checks (ON VM) ───────────────────────────
echo ""
echo "STEP 7/8: Set up health checks + auto-restart"
echo "  SSH into VM and run: ./06-health-check-setup.sh"
echo ""
read -p "  Press Enter when done... "

# ─── Step 8: Backups (LOCAL + VM) ────────────────────────────
echo ""
echo "STEP 8/8: Set up automated backups"
echo "  1. Run locally:   ./07-backup-setup.sh   (GCS bucket + disk snapshots)"
echo "  2. Run on VM:     ./07b-opensearch-snapshots.sh  (OpenSearch daily snapshots)"
echo ""
read -p "  Press Enter when done... "

# ─── Generate env vars ───────────────────────────────────────
echo ""
echo "============================================================"
echo "  Infrastructure Setup Complete!"
echo "============================================================"
echo ""
echo "  NEXT STEPS:"
echo ""
echo "  1. APPLY CODE CHANGES (see CODE_CHANGES.md):"
echo "     - Redis client: make TLS opt-in via REDIS_TLS env var"
echo "     - Elasticsearch client: support no-auth mode"
echo ""
echo "  2. GET ENV VARS (run on VM):"
echo "     ./08-env-template.sh"
echo ""
echo "  3. UPDATE VERCEL:"
echo "     Paste env vars into Vercel → Settings → Environment Variables"
echo ""
echo "  4. DEPLOY + TEST:"
echo "     Deploy the app and verify end-to-end"
echo ""
echo "  5. MONITOR:"
echo "     Watch for 1-2 weeks before decommissioning DigitalOcean"
echo "     Check health: tail -f /var/log/ratecreator-health.log (on VM)"
echo ""
echo "============================================================"

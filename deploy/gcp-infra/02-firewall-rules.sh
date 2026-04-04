#!/usr/bin/env bash
#
# Task 3: Create GCP firewall rules for RateCreator services
#
# Opens Redis (6379), OpenSearch (9200) to all IPs (Vercel uses dynamic IPs),
# and SSH (22) restricted to your IP only.
#
set -euo pipefail

# ─── Configuration ────────────────────────────────────────────
PROJECT_ID="sinuous-aviary-410323"
NETWORK_TAG="ratecreator-services"

# ─── Detect your public IP for SSH restriction ────────────────
echo "==> Detecting your public IP for SSH restriction..."
MY_IP=$(curl -s https://ifconfig.me)
if [[ -z "${MY_IP}" ]]; then
  echo "ERROR: Could not detect public IP. Set MY_IP manually and re-run."
  exit 1
fi
echo "    Your IP: ${MY_IP}"

# ─── Set project ─────────────────────────────────────────────
gcloud config set project "${PROJECT_ID}"

# ─── Helper: create firewall rule if it doesn't exist ─────────
create_rule() {
  local name="$1"
  shift
  if gcloud compute firewall-rules describe "${name}" &>/dev/null; then
    echo "    Rule '${name}' already exists. Skipping."
  else
    gcloud compute firewall-rules create "${name}" "$@"
    echo "    Rule '${name}' created."
  fi
}

# ─── Rule 1: Allow Redis (6379) from all IPs ─────────────────
# Vercel serverless functions use dynamic IPs — password auth is the security layer.
echo "==> Creating firewall rule: allow-ratecreator-redis..."
create_rule "allow-ratecreator-redis" \
  --direction=INGRESS \
  --priority=1000 \
  --network=default \
  --action=ALLOW \
  --rules=tcp:6379 \
  --source-ranges="0.0.0.0/0" \
  --target-tags="${NETWORK_TAG}" \
  --description="Allow Redis/Valkey access for RateCreator (password-protected)"

# ─── Rule 2: Allow OpenSearch (9200) from all IPs ────────────
echo "==> Creating firewall rule: allow-ratecreator-opensearch..."
create_rule "allow-ratecreator-opensearch" \
  --direction=INGRESS \
  --priority=1000 \
  --network=default \
  --action=ALLOW \
  --rules=tcp:9200 \
  --source-ranges="0.0.0.0/0" \
  --target-tags="${NETWORK_TAG}" \
  --description="Allow OpenSearch access for RateCreator (API-level auth)"

# ─── Rule 3: Allow SSH (22) from your IP only ────────────────
echo "==> Creating firewall rule: allow-ratecreator-ssh..."
create_rule "allow-ratecreator-ssh" \
  --direction=INGRESS \
  --priority=1000 \
  --network=default \
  --action=ALLOW \
  --rules=tcp:22 \
  --source-ranges="${MY_IP}/32" \
  --target-tags="${NETWORK_TAG}" \
  --description="Allow SSH for RateCreator VM (restricted to admin IP)"

# ─── Summary ──────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  Firewall Rules Created"
echo "============================================"
echo "  allow-ratecreator-redis:      tcp:6379  from 0.0.0.0/0"
echo "  allow-ratecreator-opensearch:  tcp:9200  from 0.0.0.0/0"
echo "  allow-ratecreator-ssh:         tcp:22    from ${MY_IP}/32"
echo "============================================"
echo ""
echo "SECURITY NOTE:"
echo "  Ports 6379 and 9200 are open to the internet."
echo "  Strong passwords on Redis and OpenSearch are CRITICAL."
echo ""
echo "To update SSH IP later:"
echo "  gcloud compute firewall-rules update allow-ratecreator-ssh \\"
echo "    --source-ranges=NEW_IP/32"
echo ""
echo "Next step: SSH into the VM and run 03-docker-setup.sh"

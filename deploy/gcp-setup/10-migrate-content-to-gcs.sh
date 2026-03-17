#!/bin/bash
#
# Step 10: Migrate files from DigitalOcean Spaces to GCS buckets
#
# Maps DO Spaces flat structure to GCS 3-bucket structure:
#
#   DO: content/*                → GCS: rc-content/
#   DO: *-profile-image*/*       → GCS: rc-profiles/<platform>/
#   DO: *-banner-image*/*        → GCS: rc-banners/<platform>/
#
# Usage:
#   ./10-migrate-content-to-gcs.sh            # dry run (shows plan)
#   ./10-migrate-content-to-gcs.sh --execute  # copy files
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

DO_BUCKET="ratecreator"
DO_ENDPOINT="https://nyc3.digitaloceanspaces.com"

GCS_CONTENT="rc-content"
GCS_PROFILES="rc-profiles"
GCS_BANNERS="rc-banners"

DRY_RUN=true
[[ "${1:-}" == "--execute" ]] && DRY_RUN=false

echo "=== Migrate: DO Spaces → GCS ==="
echo ""
echo "Mapping:"
echo "  content/*                → gs://${GCS_CONTENT}/"
echo "  *-profile-image*/*       → gs://${GCS_PROFILES}/<platform>/"
echo "  *-banner-image*/*        → gs://${GCS_BANNERS}/<platform>/"
echo ""
[ "$DRY_RUN" = true ] && echo "MODE: DRY RUN (pass --execute to copy)"
echo ""

# Load DO credentials from .env
if [ -f "${REPO_ROOT}/.env" ]; then
  export AWS_ACCESS_KEY_ID=$(grep -E "^DO_SPACES_KEY=" "${REPO_ROOT}/.env" | cut -d= -f2-)
  export AWS_SECRET_ACCESS_KEY=$(grep -E "^DO_SPACES_SECRET=" "${REPO_ROOT}/.env" | cut -d= -f2-)
fi

if [ -z "${AWS_ACCESS_KEY_ID:-}" ] || [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
  echo "ERROR: DO_SPACES_KEY / DO_SPACES_SECRET not found"
  exit 1
fi

# Verify GCS buckets
for b in "$GCS_CONTENT" "$GCS_PROFILES" "$GCS_BANNERS"; do
  gsutil ls -b "gs://${b}" &>/dev/null || { echo "ERROR: gs://${b} not found. Run step 09."; exit 1; }
done

# Download from DO
TEMP_DIR=$(mktemp -d)
trap "rm -rf ${TEMP_DIR}" EXIT

echo "Downloading from DO Spaces..."
aws s3 sync "s3://${DO_BUCKET}" "${TEMP_DIR}" \
  --endpoint-url="${DO_ENDPOINT}" \
  --no-progress 2>/dev/null
echo "Downloaded to temp dir."
echo ""

# Categorize and copy
CONTENT_COUNT=0
PROFILE_COUNT=0
BANNER_COUNT=0
OTHER_COUNT=0

for item in "${TEMP_DIR}"/*/; do
  [ -d "$item" ] || continue
  folder=$(basename "$item")

  case "$folder" in
    content)
      echo "[content] ${folder}/ → gs://${GCS_CONTENT}/"
      CONTENT_COUNT=$(find "$item" -type f | wc -l | tr -d ' ')
      [ "$DRY_RUN" = false ] && gsutil -m cp -r "${item}"* "gs://${GCS_CONTENT}/" 2>/dev/null
      ;;
    youtube-profile-image*|twitter-profile-image*|tiktok-profile-image*|instagram-profile-image*|reddit-profile-image*|twitch-profile-image*)
      # Extract platform: "youtube-profile-image" → "youtube"
      platform=$(echo "$folder" | sed 's/-profile-image.*//')
      echo "[profile] ${folder}/ → gs://${GCS_PROFILES}/${platform}/"
      count=$(find "$item" -type f | wc -l | tr -d ' ')
      PROFILE_COUNT=$((PROFILE_COUNT + count))
      [ "$DRY_RUN" = false ] && gsutil -m cp -r "${item}"* "gs://${GCS_PROFILES}/${platform}/" 2>/dev/null
      ;;
    youtube-banner-image*|twitter-banner-image*|tiktok-banner-image*|instagram-banner-image*|reddit-banner-image*|twitch-banner-image*)
      platform=$(echo "$folder" | sed 's/-banner-image.*//')
      echo "[banner]  ${folder}/ → gs://${GCS_BANNERS}/${platform}/"
      count=$(find "$item" -type f | wc -l | tr -d ' ')
      BANNER_COUNT=$((BANNER_COUNT + count))
      [ "$DRY_RUN" = false ] && gsutil -m cp -r "${item}"* "gs://${GCS_BANNERS}/${platform}/" 2>/dev/null
      ;;
    *)
      echo "[other]   ${folder}/ → gs://${GCS_CONTENT}/${folder}/"
      count=$(find "$item" -type f | wc -l | tr -d ' ')
      OTHER_COUNT=$((OTHER_COUNT + count))
      [ "$DRY_RUN" = false ] && gsutil -m cp -r "${item}"* "gs://${GCS_CONTENT}/${folder}/" 2>/dev/null
      ;;
  esac
done

echo ""
echo "=== Summary ==="
echo "  Content files:  ${CONTENT_COUNT}"
echo "  Profile images: ${PROFILE_COUNT}"
echo "  Banner images:  ${BANNER_COUNT}"
echo "  Other files:    ${OTHER_COUNT}"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo "DRY RUN — run with --execute to copy."
else
  echo "Files copied. DO Spaces still active."
  echo ""
  echo "Next: update DB URLs"
  echo "  yarn update-storage-urls              # dry run"
  echo "  yarn update-storage-urls -- --execute # update DB"
fi

#!/bin/bash
#
# Step 9: Create GCS buckets for file storage
#
# Structure:
#   rc-content/              — blog/newsletter content images
#     ├── editor-images/     — BlockNote inline images
#     ├── feature-images/    — blog post hero images
#     ├── metadata-images/   — OG/meta images
#     └── tags/              — tag images
#
#   rc-profiles/             — creator profile images (cached from platforms)
#     ├── youtube/
#     ├── twitter/
#     ├── instagram/
#     ├── reddit/
#     ├── tiktok/
#     └── twitch/
#
#   rc-banners/              — creator banner images (cached from platforms)
#     ├── youtube/
#     ├── twitter/
#     ├── instagram/
#     ├── reddit/
#     ├── tiktok/
#     └── twitch/
#
# All buckets are publicly readable (images served directly via URL).
#
set -euo pipefail

PROJECT_ID="sinuous-aviary-410323"
REGION="us-central1"
SA_EMAIL="rc-services@${PROJECT_ID}.iam.gserviceaccount.com"

BUCKETS=("rc-content" "rc-profiles" "rc-banners")

PLATFORMS=("youtube" "twitter" "instagram" "reddit" "tiktok" "twitch")
CONTENT_FOLDERS=("editor-images" "feature-images" "metadata-images" "tags")

echo "=== Step 9: GCS Bucket Setup ==="
echo ""

for BUCKET in "${BUCKETS[@]}"; do
  echo "── ${BUCKET} ──"

  # Create bucket
  if gsutil ls -b "gs://${BUCKET}" &>/dev/null; then
    echo "  [exists] gs://${BUCKET}"
  else
    gsutil mb -p "${PROJECT_ID}" -l "${REGION}" -b on "gs://${BUCKET}"
    echo "  [created] gs://${BUCKET}"
  fi

  # Public read access
  gsutil iam ch allUsers:objectViewer "gs://${BUCKET}" 2>/dev/null
  echo "  [public] allUsers:objectViewer"

  # Service account write access
  gsutil iam ch "serviceAccount:${SA_EMAIL}:objectAdmin" "gs://${BUCKET}" 2>/dev/null
  echo "  [admin] ${SA_EMAIL}"

  # CORS
  cat > /tmp/cors-${BUCKET}.json << 'EOF'
[
  {
    "origin": ["https://ratecreator.com", "https://www.ratecreator.com", "https://content.ratecreator.com", "http://localhost:3000", "http://localhost:3002"],
    "method": ["GET", "HEAD", "PUT", "POST"],
    "responseHeader": ["Content-Type", "x-goog-content-length-range"],
    "maxAgeSeconds": 3600
  }
]
EOF
  gsutil cors set "/tmp/cors-${BUCKET}.json" "gs://${BUCKET}" 2>/dev/null
  rm "/tmp/cors-${BUCKET}.json"
  echo "  [cors] configured"
  echo ""
done

# Create folder structure
echo "Creating folders..."
echo ""

echo "  rc-content/"
for folder in "${CONTENT_FOLDERS[@]}"; do
  echo -n "" | gsutil cp - "gs://rc-content/${folder}/.keep" 2>/dev/null
  echo "    ${folder}/"
done

echo ""
echo "  rc-profiles/"
for platform in "${PLATFORMS[@]}"; do
  echo -n "" | gsutil cp - "gs://rc-profiles/${platform}/.keep" 2>/dev/null
  echo "    ${platform}/"
done

echo ""
echo "  rc-banners/"
for platform in "${PLATFORMS[@]}"; do
  echo -n "" | gsutil cp - "gs://rc-banners/${platform}/.keep" 2>/dev/null
  echo "    ${platform}/"
done

echo ""
echo "=== GCS Bucket setup complete ==="
echo ""
echo "Public URLs:"
echo "  https://storage.googleapis.com/rc-content/<path>"
echo "  https://storage.googleapis.com/rc-profiles/<platform>/<file>"
echo "  https://storage.googleapis.com/rc-banners/<platform>/<file>"

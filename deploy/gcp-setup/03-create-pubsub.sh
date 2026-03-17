#!/bin/bash
#
# Step 3: Create all Pub/Sub topics and subscriptions
#
set -euo pipefail

PROJECT_ID="sinuous-aviary-410323"

echo "=== Step 3: Pub/Sub Setup ==="
echo ""

TOPICS=(
  "clerk-user-events"
  "account-added"
  "account-data-fetched"
  "account-translated"
  "account-root-categorised"
  "account-categorised"
  "new-review-calculate"
  "new-review-elastic-update"
  "data-refresh-youtube"
  "data-refresh-instagram"
  "data-refresh-reddit"
  "data-refresh-tiktok"
  "dead-letter"
)

# Format: "topic|subscription"
SUBS=(
  "clerk-user-events|clerk-user-events-sub"
  "account-added|account-added-sub"
  "account-data-fetched|account-data-fetched-sub"
  "account-translated|account-translated-sub"
  "account-root-categorised|account-root-categorised-sub"
  "account-categorised|account-categorised-elastic-sub"
  "new-review-calculate|new-review-calculate-sub"
  "new-review-elastic-update|new-review-elastic-update-sub"
  "data-refresh-youtube|data-refresh-youtube-sub"
  "data-refresh-instagram|data-refresh-instagram-sub"
  "data-refresh-reddit|data-refresh-reddit-sub"
  "data-refresh-tiktok|data-refresh-tiktok-sub"
)

echo "Creating ${#TOPICS[@]} topics..."
for topic in "${TOPICS[@]}"; do
  if gcloud pubsub topics describe "$topic" --project="${PROJECT_ID}" &>/dev/null; then
    echo "  [exists] $topic"
  else
    gcloud pubsub topics create "$topic" --project="${PROJECT_ID}"
    echo "  [created] $topic"
  fi
done

echo ""
echo "Creating ${#SUBS[@]} subscriptions..."
for entry in "${SUBS[@]}"; do
  IFS='|' read -r topic sub <<< "$entry"
  if gcloud pubsub subscriptions describe "$sub" --project="${PROJECT_ID}" &>/dev/null; then
    echo "  [exists] $sub → $topic"
  else
    gcloud pubsub subscriptions create "$sub" \
      --topic="$topic" \
      --ack-deadline=60 \
      --message-retention-duration=7d \
      --dead-letter-topic="dead-letter" \
      --max-delivery-attempts=5 \
      --project="${PROJECT_ID}"
    echo "  [created] $sub → $topic"
  fi
done

echo ""
echo "=== Pub/Sub setup complete: ${#TOPICS[@]} topics, ${#SUBS[@]} subscriptions ==="

#!/bin/bash
#
# Cleanup: Delete env-suffixed Pub/Sub topics and subscriptions
#
# Removes *-dev and *-prod topics/subscriptions that were created
# before switching to plain (unsuffixed) names.
#
# Usage:
#   ./cleanup-env-pubsub.sh          # dry run (shows what would be deleted)
#   ./cleanup-env-pubsub.sh --delete # actually delete
#
set -euo pipefail

PROJECT_ID="sinuous-aviary-410323"
DRY_RUN=true
[[ "${1:-}" == "--delete" ]] && DRY_RUN=false

echo "=== Cleanup: Remove env-suffixed Pub/Sub resources ==="
[ "$DRY_RUN" = true ] && echo "DRY RUN — pass --delete to actually remove"
echo ""

BASE_TOPICS=(
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

BASE_SUBS=(
  "clerk-user-events-sub"
  "account-added-sub"
  "account-data-fetched-sub"
  "account-translated-sub"
  "account-root-categorised-sub"
  "account-categorised-elastic-sub"
  "new-review-calculate-sub"
  "new-review-elastic-update-sub"
  "data-refresh-youtube-sub"
  "data-refresh-instagram-sub"
  "data-refresh-reddit-sub"
  "data-refresh-tiktok-sub"
)

DELETED=0

# Delete subscriptions first (must be deleted before their topic)
echo "Subscriptions:"
for env in dev prod; do
  for base in "${BASE_SUBS[@]}"; do
    name="${base}-${env}"
    if gcloud pubsub subscriptions describe "$name" --project="${PROJECT_ID}" &>/dev/null; then
      if [ "$DRY_RUN" = true ]; then
        echo "  [would delete] $name"
      else
        gcloud pubsub subscriptions delete "$name" --project="${PROJECT_ID}" --quiet
        echo "  [deleted] $name"
      fi
      DELETED=$((DELETED + 1))
    fi
  done
done

echo ""
echo "Topics:"
for env in dev prod; do
  for base in "${BASE_TOPICS[@]}"; do
    name="${base}-${env}"
    if gcloud pubsub topics describe "$name" --project="${PROJECT_ID}" &>/dev/null; then
      if [ "$DRY_RUN" = true ]; then
        echo "  [would delete] $name"
      else
        gcloud pubsub topics delete "$name" --project="${PROJECT_ID}" --quiet
        echo "  [deleted] $name"
      fi
      DELETED=$((DELETED + 1))
    fi
  done
done

echo ""
if [ "$DELETED" -eq 0 ]; then
  echo "Nothing to clean up — no env-suffixed resources found."
else
  if [ "$DRY_RUN" = true ]; then
    echo "${DELETED} resources would be deleted. Run with --delete to proceed."
  else
    echo "${DELETED} resources deleted."
  fi
fi

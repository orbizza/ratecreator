#!/usr/bin/env bash
#
# Task 5: Migrate MongoDB data from DigitalOcean to new database
#
# This script handles:
#   1. Export (mongodump) from DigitalOcean managed MongoDB
#   2. Import (mongorestore) to the new MongoDB endpoint
#   3. Verification (document counts + sample queries)
#
# PREREQUISITES:
#   - mongodump and mongorestore installed (mongodb-database-tools)
#   - mongosh installed for verification
#   - Network access to both source and destination
#
# Run from your local machine or from the GCE VM.
#
set -euo pipefail

# ─── Configuration ────────────────────────────────────────────

# Source: DigitalOcean managed MongoDB
# IMPORTANT: Replace with your actual connection string from .env
DO_MONGO_URI="mongodb+srv://doadmin:<PASSWORD>@db-ratecreator-prod-nyc3-d551708b.mongo.ondigitalocean.com/ratecreator?tls=true&authSource=admin&replicaSet=db-ratecreator-prod-nyc3"

# Destination: Set ONE of these based on your setup
# Option A: Firestore MongoDB-compatible endpoint
# DEST_MONGO_URI="mongodb://<project-id>.firestore.googleapis.com:443/ratecreator"
#
# Option B: Self-hosted MongoDB on GCE VM (fallback)
# DEST_MONGO_URI="mongodb://ratecreator:<PASSWORD>@<STATIC_IP>:27017/ratecreator?authSource=admin"
DEST_MONGO_URI=""

DATABASE_NAME="ratecreator"
DUMP_DIR="/tmp/ratecreator-dump"

# ─── Validate ─────────────────────────────────────────────────
if [[ -z "${DEST_MONGO_URI}" ]]; then
  echo "ERROR: Set DEST_MONGO_URI before running this script."
  echo "       Edit this file or export DEST_MONGO_URI=..."
  exit 1
fi

# ─── Step 1: Install tools if needed ─────────────────────────
echo "==> Checking for MongoDB tools..."
if ! command -v mongodump &>/dev/null; then
  echo "    Installing mongodb-database-tools..."
  # On Ubuntu/Debian:
  wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
  echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
    sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
  sudo apt-get update
  sudo apt-get install -y mongodb-database-tools mongodb-mongosh
fi

# ─── Step 2: Export from DigitalOcean ─────────────────────────
echo "==> Step 2: Dumping from DigitalOcean MongoDB..."
echo "    URI: ${DO_MONGO_URI%%@*}@***"
echo "    Output: ${DUMP_DIR}"
echo ""

rm -rf "${DUMP_DIR}"
mkdir -p "${DUMP_DIR}"

mongodump \
  --uri="${DO_MONGO_URI}" \
  --db="${DATABASE_NAME}" \
  --out="${DUMP_DIR}" \
  --numParallelCollections=4 \
  --gzip

echo "    Dump complete."
echo "    Size: $(du -sh "${DUMP_DIR}" | cut -f1)"
echo ""

# Show collection sizes
echo "==> Collections dumped:"
ls -la "${DUMP_DIR}/${DATABASE_NAME}/"*.bson.gz 2>/dev/null | \
  awk '{print "    " $5 "\t" $9}' | sed "s|${DUMP_DIR}/${DATABASE_NAME}/||"
echo ""

# ─── Step 3: Import to destination ────────────────────────────
echo "==> Step 3: Restoring to destination MongoDB..."
echo "    URI: ${DEST_MONGO_URI%%@*}@***"
echo ""

mongorestore \
  --uri="${DEST_MONGO_URI}" \
  --db="${DATABASE_NAME}" \
  --gzip \
  --numParallelCollections=4 \
  --numInsertionWorkersPerCollection=2 \
  --drop \
  "${DUMP_DIR}/${DATABASE_NAME}"

echo "    Restore complete."
echo ""

# ─── Step 4: Verify document counts ──────────────────────────
echo "==> Step 4: Verifying migration..."
echo ""

# Key collections to verify
COLLECTIONS=("Account" "Category" "CategoryMapping" "Review" "Comment" "Vote" "User" "YouTubeVideo" "SaveToMyList")

echo "  Collection              Source    Dest      Match"
echo "  ──────────────────────  ────────  ────────  ─────"

ALL_MATCH=true
for coll in "${COLLECTIONS[@]}"; do
  SRC_COUNT=$(mongosh "${DO_MONGO_URI}" --quiet --eval "db.${coll}.countDocuments({})" 2>/dev/null || echo "ERR")
  DST_COUNT=$(mongosh "${DEST_MONGO_URI}" --quiet --eval "db.${coll}.countDocuments({})" 2>/dev/null || echo "ERR")

  if [[ "${SRC_COUNT}" == "${DST_COUNT}" ]]; then
    STATUS="OK"
  else
    STATUS="MISMATCH"
    ALL_MATCH=false
  fi

  printf "  %-22s  %8s  %8s  %s\n" "${coll}" "${SRC_COUNT}" "${DST_COUNT}" "${STATUS}"
done

echo ""
if [[ "${ALL_MATCH}" == true ]]; then
  echo "  All collections match!"
else
  echo "  WARNING: Some collections have mismatched counts."
  echo "  Check for write errors in the mongorestore output above."
fi

# ─── Step 5: Test sample queries ──────────────────────────────
echo ""
echo "==> Step 5: Running sample queries on destination..."

echo "  Sample Account:"
mongosh "${DEST_MONGO_URI}" --quiet --eval '
  const acc = db.Account.findOne({}, { name: 1, handle: 1, platform: 1, followerCount: 1 });
  printjson(acc);
' 2>/dev/null || echo "  (query failed)"

echo ""
echo "  Category count by depth:"
mongosh "${DEST_MONGO_URI}" --quiet --eval '
  const result = db.Category.aggregate([
    { $group: { _id: "$depth", count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]).toArray();
  printjson(result);
' 2>/dev/null || echo "  (query failed)"

# ─── Summary ──────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  Migration Complete"
echo "============================================"
echo "  Dump location: ${DUMP_DIR}"
echo "  Dump size: $(du -sh "${DUMP_DIR}" | cut -f1)"
echo ""
echo "  IMPORTANT: Keep DigitalOcean MongoDB running"
echo "  until the app is verified end-to-end on the"
echo "  new database (1-2 weeks recommended)."
echo "============================================"
echo ""
echo "  To clean up the dump later:"
echo "    rm -rf ${DUMP_DIR}"
echo ""
echo "Next step: Run 06-health-check-setup.sh on the VM"

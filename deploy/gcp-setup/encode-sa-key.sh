#!/bin/bash
#
# Encode GCP service account JSON key to base64.
#
# Outputs the base64 string for use in:
#   - Vercel env var: GCP_SERVICE_ACCOUNT_KEY_BASE64
#   - GitHub Actions secret: GCP_SA_KEY_BASE64
#   - Any platform that can't read JSON files
#
# Usage:
#   ./encode-sa-key.sh                              # uses default path
#   ./encode-sa-key.sh /path/to/service-account.json
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
KEY_FILE="${1:-${REPO_ROOT}/gcp-service-account.json}"

if [ ! -f "${KEY_FILE}" ]; then
  echo "ERROR: Key file not found: ${KEY_FILE}"
  echo ""
  echo "Run this first:"
  echo "  ./deploy/gcp-setup/01-create-service-account.sh"
  exit 1
fi

echo "=== Encoding ${KEY_FILE} to base64 ==="
echo ""

# Encode (single line, no wrapping)
BASE64_VALUE=$(base64 -i "${KEY_FILE}" | tr -d '\n')

echo "Base64 value (${#BASE64_VALUE} chars):"
echo ""
echo "${BASE64_VALUE}"
echo ""

# Copy to clipboard if possible
if command -v pbcopy &>/dev/null; then
  echo "${BASE64_VALUE}" | pbcopy
  echo "(Copied to clipboard)"
  echo ""
fi

echo "Set this as:"
echo "  Vercel:  GCP_SERVICE_ACCOUNT_KEY_BASE64"
echo "  GitHub:  GCP_SA_KEY (for CI/CD workflow)"
echo ""
echo "For .env.local:"
echo "  GCP_SERVICE_ACCOUNT_KEY_BASE64=${BASE64_VALUE}"

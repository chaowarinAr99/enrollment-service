#!/usr/bin/env bash

set -euo pipefail

URL="${1:-http://127.0.0.1:3000/health}"
TIMEOUT_SECONDS="${2:-30}"

STARTED_AT=$(date +%s)

while true; do
  if curl --silent --fail "$URL" >/dev/null; then
    exit 0
  fi

  NOW=$(date +%s)
  if (( NOW - STARTED_AT >= TIMEOUT_SECONDS )); then
    echo "Timed out waiting for health endpoint: $URL" >&2
    exit 1
  fi

  sleep 1
done

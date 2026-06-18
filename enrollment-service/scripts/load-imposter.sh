#!/usr/bin/env bash

set -euo pipefail

FILE_PATH="${1:?Expected imposter file path}"

curl --silent --show-error --fail \
  -X POST http://127.0.0.1:2525/imposters \
  -H "Content-Type: application/json" \
  -d @"$FILE_PATH" >/dev/null

#!/usr/bin/env bash

set -euo pipefail

curl --silent --fail -X DELETE http://127.0.0.1:2525/imposters/4545 >/dev/null 2>&1 || true

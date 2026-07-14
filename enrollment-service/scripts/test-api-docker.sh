#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:-all}"
COMPOSE_FILE="$ROOT_DIR/docker-compose.api-test.yml"

cleanup() {
  docker compose -f "$COMPOSE_FILE" down -v --remove-orphans >/dev/null 2>&1 || true
}

trap cleanup EXIT

cd "$ROOT_DIR"

docker compose -f "$COMPOSE_FILE" down -v --remove-orphans >/dev/null 2>&1 || true
docker compose -f "$COMPOSE_FILE" up -d --build

bash "$ROOT_DIR/scripts/wait-for-health.sh" "http://127.0.0.1:2525/imposters" 30
bash "$ROOT_DIR/scripts/wait-for-health.sh" "http://127.0.0.1:3000/health" 30

run_folder() {
  local folder_path="$1"
  local relative_path
  relative_path="${folder_path#"$ROOT_DIR/bruno/"}"

  MONGO_URL=mongodb://127.0.0.1:27018 \
  MONGO_DB_NAME=enrollment_service \
    npx tsx "$ROOT_DIR/scripts/reset-api-runtime.ts"

  (
    cd "$ROOT_DIR/bruno"
    npx bru run "$relative_path"
  )
}

run_with_imposter() {
  local folder_path="$1"
  local imposter_path="$2"
  bash "$ROOT_DIR/scripts/reset-imposter.sh"
  bash "$ROOT_DIR/scripts/load-imposter.sh" "$imposter_path"
  run_folder "$folder_path"
}

run_success() {
  run_with_imposter \
    "$ROOT_DIR/bruno/success/TC01_Create_Certificate_Success_course_PHY001" \
    "$ROOT_DIR/mountebank/imposters/certificate-service/api/generic-certificate-success.json"

  run_with_imposter \
    "$ROOT_DIR/bruno/success/TC02_Create_Certificate_Success_course_CHE001" \
    "$ROOT_DIR/mountebank/imposters/certificate-service/api/generic-certificate-success.json"

  run_with_imposter \
    "$ROOT_DIR/bruno/success/TC03_Create_Certificate_Success_course_COM001" \
    "$ROOT_DIR/mountebank/imposters/certificate-service/api/generic-certificate-success.json"
}

run_alternative() {
  run_folder "$ROOT_DIR/bruno/alternative/TC04_Create_EmployeeId_Required"
  run_folder "$ROOT_DIR/bruno/alternative/TC05_Create_CourseId_Required"
  run_folder "$ROOT_DIR/bruno/alternative/TC06_Create_Course_Not_Found"
  run_folder "$ROOT_DIR/bruno/alternative/TC07_Create_Course_Closed"
  run_folder "$ROOT_DIR/bruno/alternative/TC08_Create_Course_Full"
  run_folder "$ROOT_DIR/bruno/alternative/TC09_Create_Duplicate_PHY001"
  run_folder "$ROOT_DIR/bruno/alternative/TC10_Create_Duplicate_CHE001"
  run_folder "$ROOT_DIR/bruno/alternative/TC12_HR_Reject"
  run_folder "$ROOT_DIR/bruno/alternative/TC13_Certificate_Progress_99"
  run_folder "$ROOT_DIR/bruno/alternative/TC14_Certificate_Progress_0"
  run_folder "$ROOT_DIR/bruno/alternative/TC15_Certificate_Not_Approved"
  run_folder "$ROOT_DIR/bruno/alternative/TC16_Certificate_Course_Reject"

  run_with_imposter \
    "$ROOT_DIR/bruno/alternative/TC17_Certificate_Api_Error" \
    "$ROOT_DIR/mountebank/imposters/certificate-service/api/generic-certificate-api-error.json"
}

case "$MODE" in
  success)
    run_success
    ;;
  alternative)
    run_alternative
    ;;
  all)
    run_success
    run_alternative
    ;;
  *)
    echo "Unknown mode: $MODE" >&2
    exit 1
    ;;
esac

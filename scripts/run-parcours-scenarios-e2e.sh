#!/usr/bin/env bash
# scripts/run-parcours-scenarios-e2e.sh
#
# Usage:
#   SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." \
#   ./scripts/run-parcours-scenarios-e2e.sh \
#     <PARCOURS_ID> <LEARNER_ID> <COURSE_ID> <TEST_ID> <RESOURCE_ID> \
#     --baseUrl=http://localhost:3001
#
# What it does:
#  1) Starts `pnpm dev` in background (logs to /tmp/pnpm-dev.log, pid to /tmp/pnpm-dev.pid)
#  2) Waits until the server responds on /api/health (fallback /)
#  3) Runs the E2E script: scripts/parcours-scenarios-e2e.ts
#  4) Always stops `pnpm dev` on exit (trap)

set -euo pipefail

# ---------- helpers ----------
die() { echo "❌ $*" >&2; exit 1; }
log() { echo "▶ $*"; }

require_env() {
  local name="$1"
  [[ -n "${!name:-}" ]] || die "Missing env var: $name"
}

wait_for_url_curl() {
  local url="$1"
  local timeout_s="${2:-60}"
  log "Waiting for server: $url (timeout ${timeout_s}s) using curl…"

  local start now code
  start="$(date +%s)"

  while true; do
    code="$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)"
    if [[ "$code" =~ ^[0-9]{3}$ ]] && (( code >= 200 && code < 500 )); then
      log "Server responded (HTTP $code) on $url"
      return 0
    fi

    now="$(date +%s)"
    if (( now - start >= timeout_s )); then
      return 1
    fi
    sleep 1
  done
}

wait_for_url_node() {
  local url="$1"
  local timeout_s="${2:-60}"
  log "Waiting for server: $url (timeout ${timeout_s}s) using node fetch…"

  node - "$url" "$timeout_s" <<'NODE'
const url = process.argv[2];
const timeoutS = Number(process.argv[3] || "60");
const start = Date.now();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  while (true) {
    try {
      const res = await fetch(url, { method: "GET" });
      const code = res.status;
      if (code >= 200 && code < 500) {
        console.log(`▶ Server responded (HTTP ${code}) on ${url}`);
        process.exit(0);
      }
    } catch {}
    if (Date.now() - start > timeoutS * 1000) {
      process.exit(1);
    }
    await sleep(1000);
  }
})();
NODE
}

wait_for_url() {
  local url="$1"
  local timeout_s="${2:-60}"
  if command -v curl >/dev/null 2>&1; then
    wait_for_url_curl "$url" "$timeout_s"
  else
    wait_for_url_node "$url" "$timeout_s"
  fi
}

# ---------- parse args ----------
BASE_URL="http://localhost:3001"
POSITIONAL=()

for arg in "$@"; do
  case "$arg" in
    --baseUrl=*)
      BASE_URL="${arg#*=}"
      ;;
    *)
      POSITIONAL+=("$arg")
      ;;
  esac
done

[[ ${#POSITIONAL[@]} -ge 5 ]] || die "Missing args. Expected: <PARCOURS_ID> <LEARNER_ID> <COURSE_ID> <TEST_ID> <RESOURCE_ID> [--baseUrl=...]"

PARCOURS_ID="${POSITIONAL[0]}"
LEARNER_ID="${POSITIONAL[1]}"
COURSE_ID="${POSITIONAL[2]}"
TEST_ID="${POSITIONAL[3]}"
RESOURCE_ID="${POSITIONAL[4]}"

# ---------- preflight ----------
require_env "SUPABASE_URL"
require_env "SUPABASE_SERVICE_ROLE_KEY"

command -v pnpm >/dev/null 2>&1 || die "pnpm not found"
[[ -f "scripts/parcours-scenarios-e2e.ts" ]] || die "Missing scripts/parcours-scenarios-e2e.ts (create it first)"

# ---------- start dev server ----------
LOG_FILE="/tmp/pnpm-dev.log"
PID_FILE="/tmp/pnpm-dev.pid"

cleanup() {
  set +e
  if [[ -f "$PID_FILE" ]]; then
    DEV_PID="$(cat "$PID_FILE" 2>/dev/null)"
    if [[ -n "${DEV_PID:-}" ]] && kill -0 "$DEV_PID" 2>/dev/null; then
      log "Stopping pnpm dev (pid=$DEV_PID)…"
      kill "$DEV_PID" 2>/dev/null || true
      # give it a moment, then force if needed
      sleep 2
      kill -9 "$DEV_PID" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
  fi
}
trap cleanup EXIT INT TERM

log "Starting pnpm dev in background… (logs: $LOG_FILE)"
: > "$LOG_FILE"
( pnpm dev >"$LOG_FILE" 2>&1 ) &
DEV_PID="$!"
echo "$DEV_PID" > "$PID_FILE"
log "pnpm dev pid=$DEV_PID"

# ---------- wait for server ----------
HEALTH_URL="$BASE_URL/api/health"
ROOT_URL="$BASE_URL/"

if ! wait_for_url "$HEALTH_URL" 30; then
  log "Health endpoint not ready; trying root…"
  wait_for_url "$ROOT_URL" 60 || die "Server not ready. Check $LOG_FILE"
fi

# ---------- run e2e ----------
log "Running E2E script…"
log "baseUrl   : $BASE_URL"
log "parcoursId: $PARCOURS_ID"
log "learnerId : $LEARNER_ID"
log "courseId  : $COURSE_ID"
log "testId    : $TEST_ID"
log "resourceId: $RESOURCE_ID"

pnpm tsx scripts/parcours-scenarios-e2e.ts \
  "$PARCOURS_ID" "$LEARNER_ID" "$COURSE_ID" "$TEST_ID" "$RESOURCE_ID" \
  --baseUrl="$BASE_URL"

log "✅ DONE"


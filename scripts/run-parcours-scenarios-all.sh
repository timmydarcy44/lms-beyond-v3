#!/usr/bin/env bash
# scripts/run-parcours-scenarios-all.sh
#
# NO-TEST / NO-RESOURCE mode
#
# Usage:
#   export SUPABASE_URL="https://xxxx.supabase.co"
#   export SUPABASE_SERVICE_ROLE_KEY="xxxxx"
#   # Ensure project is linked once:
#   #   supabase login
#   #   supabase link --project-ref <PROJECT_REF>
#
#   ./scripts/run-parcours-scenarios-all.sh \
#     <PARCOURS_ID> <USER_ID> \
#     --baseUrl=http://localhost:3000 \
#     --timeout=90
#
# Optional flags:
#   --baseUrl=...      (default: http://localhost:3000)
#   --timeout=SECONDS  (default: 90)
#   --skipMigrations   (skip supabase db push / migration up)
#   --noInstall        (skip pnpm install even if node_modules missing)

set -euo pipefail

die() { echo "❌ $*" >&2; exit 1; }
log() { echo "▶ $*"; }

require_env() {
  local name="$1"
  [[ -n "${!name:-}" ]] || die "Missing env var: $name"
}

have() { command -v "$1" >/dev/null 2>&1; }

wait_for_url_curl() {
  local url="$1"
  local timeout_s="$2"
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
  local timeout_s="$2"
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
    if (Date.now() - start > timeoutS * 1000) process.exit(1);
    await sleep(1000);
  }
})();
NODE
}

wait_for_url() {
  local url="$1"
  local timeout_s="$2"
  if have curl; then
    wait_for_url_curl "$url" "$timeout_s"
  else
    wait_for_url_node "$url" "$timeout_s"
  fi
}

BASE_URL="http://localhost:3000"
TIMEOUT_S=90
SKIP_MIGRATIONS="0"
NO_INSTALL="0"
POSITIONAL=()

for arg in "$@"; do
  case "$arg" in
    --baseUrl=*)
      BASE_URL="${arg#*=}"
      ;;
    --timeout=*)
      TIMEOUT_S="${arg#*=}"
      ;;
    --skipMigrations)
      SKIP_MIGRATIONS="1"
      ;;
    --noInstall)
      NO_INSTALL="1"
      ;;
    *)
      POSITIONAL+=("$arg")
      ;;
  esac
done

[[ ${#POSITIONAL[@]} -ge 2 ]] || die "Missing args. Expected: <PARCOURS_ID> <USER_ID> [--baseUrl=...] [--timeout=...]"

PARCOURS_ID="${POSITIONAL[0]}"
USER_ID="${POSITIONAL[1]}"

require_env "SUPABASE_URL"
require_env "SUPABASE_SERVICE_ROLE_KEY"

have node || die "node not found"
have pnpm || die "pnpm not found"
have supabase || die "supabase CLI not found (required for Option A)"
[[ -f "scripts/check-parcours-access.ts" ]] || die "Missing scripts/check-parcours-access.ts (create it first)"

run_migrations_option_a() {
  log "Running Supabase migrations (Option A)…"
  if supabase db push --help >/dev/null 2>&1; then
    supabase db push
    return 0
  fi
  if supabase migration up --help >/dev/null 2>&1; then
    supabase migration up
    return 0
  fi
  die "Supabase CLI detected but no migration command available. Update the CLI."
}

if [[ "$SKIP_MIGRATIONS" == "1" ]]; then
  log "Skipping migrations (--skipMigrations)."
else
  run_migrations_option_a
  log "✅ Migrations applied."
fi

if [[ "$NO_INSTALL" == "1" ]]; then
  log "Skipping install (--noInstall)."
else
  if [[ ! -d "node_modules" ]]; then
    log "node_modules missing → pnpm install"
    pnpm install
  fi
fi

LOG_FILE="/tmp/pnpm-dev.log"
PID_FILE="$(node -e \"const path=require('path');const os=require('os');console.log(path.join(os.tmpdir(),'pnpm-dev.pid'));\" 2>/dev/null)"
if [[ -z "$PID_FILE" ]]; then
  PID_FILE="/tmp/pnpm-dev.pid"
fi

cleanup() {
  set +e
  if [[ -f "$PID_FILE" ]]; then
    DEV_PID="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [[ -n "${DEV_PID:-}" ]] && kill -0 "$DEV_PID" 2>/dev/null; then
      log "Stopping pnpm dev (pid=$DEV_PID)…"
      kill "$DEV_PID" 2>/dev/null || true
      sleep 2
      kill -9 "$DEV_PID" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
  fi
}
trap cleanup EXIT INT TERM

log "Pre-clean Next.js lock"
rm -rf .next/dev/lock || true

log "Starting pnpm dev in background… (logs: $LOG_FILE)"
: > "$LOG_FILE"
( node scripts/dev-safe.js >"$LOG_FILE" 2>&1 ) &
DEV_PID="$!"
echo "$DEV_PID" > "$PID_FILE"
log "pnpm dev pid=$DEV_PID"

HEALTH_URL="$BASE_URL/api/health"
ROOT_URL="$BASE_URL/"

if ! wait_for_url "$HEALTH_URL" "$TIMEOUT_S"; then
  log "Health endpoint not ready; trying root…"
  wait_for_url "$ROOT_URL" "$TIMEOUT_S" || die "Server not ready. Check $LOG_FILE"
fi

log "== Run access check =="
log "baseUrl   : $BASE_URL"
log "parcoursId: $PARCOURS_ID"
log "userId    : $USER_ID"

CHECK_CMD=(pnpm tsx scripts/check-parcours-access.ts "$PARCOURS_ID" "$USER_ID")
if [[ -n "${BASE_URL:-}" ]]; then
  CHECK_CMD+=("--baseUrl=$BASE_URL")
fi

"${CHECK_CMD[@]}"

log "✅ ALL DONE"
#!/usr/bin/env bash
# scripts/run-parcours-scenarios-all.sh
#
# NO-TEST / NO-RESOURCE mode
#
# Usage:
#   export SUPABASE_URL="https://xxxx.supabase.co"
#   export SUPABASE_SERVICE_ROLE_KEY="xxxxx"
#   # Ensure project is linked once:
#   #   supabase login
#   #   supabase link --project-ref <PROJECT_REF>
#
#   chmod +x scripts/run-parcours-scenarios-all.sh
#   ./scripts/run-parcours-scenarios-all.sh \
#     <PARCOURS_ID> <LEARNER_ID> <COURSE_ID> \
#     --baseUrl=http://localhost:3000 \
#     --timeout=90
#
# Optional flags:
#   --baseUrl=...      (default: http://localhost:3000)
#   --timeout=SECONDS  (default: 90)
#   --skipMigrations   (skip supabase db push / migration up)

set -euo pipefail

die() { echo "❌ $*" >&2; exit 1; }
log() { echo "▶ $*"; }

require_env() {
  local name="$1"
  [[ -n "${!name:-}" ]] || die "Missing env var: $name"
}

have() { command -v "$1" >/dev/null 2>&1; }

wait_for_url_curl() {
  local url="$1"
  local timeout_s="$2"
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
  local timeout_s="$2"
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
    if (Date.now() - start > timeoutS * 1000) process.exit(1);
    await sleep(1000);
  }
})();
NODE
}

wait_for_url() {
  local url="$1"
  local timeout_s="$2"
  if have curl; then
    wait_for_url_curl("$url", "$timeout_s")
  else
    wait_for_url_node "$url" "$timeout_s"
  fi
}

BASE_URL="http://localhost:3000"
TIMEOUT_S=90
SKIP_MIGRATIONS="0"
POSITIONAL=()

for arg in "$@"; do
  case "$arg" in
    --baseUrl=*)
      BASE_URL="${arg#*=}"
      ;;
    --timeout=*)
      TIMEOUT_S="${arg#*=}"
      ;;
    --skipMigrations)
      SKIP_MIGRATIONS="1"
      ;;
    *)
      POSITIONAL+=("$arg")
      ;;
  esac
done

[[ ${#POSITIONAL[@]} -ge 3 ]] || die "Missing args. Expected: <PARCOURS_ID> <LEARNER_ID> <COURSE_ID> [--baseUrl=...] [--timeout=...]"

PARCOURS_ID="${POSITIONAL[0]}"
LEARNER_ID="${POSITIONAL[1]}"
COURSE_ID="${POSITIONAL[2]}"

require_env "SUPABASE_URL"
require_env "SUPABASE_SERVICE_ROLE_KEY"

have node || die "node not found"
have pnpm || die "pnpm not found"
have supabase || die "supabase CLI not found (required for Option A)"
[[ -f "scripts/parcours-scenarios-e2e.ts" ]] || die "Missing scripts/parcours-scenarios-e2e.ts (create it first)"

run_migrations_option_a() {
  log "Running Supabase migrations (Option A)…"
  if supabase db push --help >/dev/null 2>&1; then
    supabase db push
    return 0
  fi
  if supabase migration up --help >/dev/null 2>&1; then
    supabase migration up
    return 0
  fi
  die "Supabase CLI detected but no migration command available. Update the CLI."
}

if [[ "$SKIP_MIGRATIONS" == "1" ]]; then
  log "Skipping migrations (--skipMigrations)."
else
  run_migrations_option_a
  log "✅ Migrations applied."
fi

if [[ ! -d "node_modules" ]]; then
  log "node_modules missing → pnpm install"
  pnpm install
fi

LOG_FILE="/tmp/pnpm-dev.log"
PID_FILE="/tmp/pnpm-dev.pid"

cleanup() {
  set +e
  if [[ -f "$PID_FILE" ]]; then
    DEV_PID="$(cat "$PID_FILE" 2>/dev/null)"
    if [[ -n "${DEV_PID:-}" ]] && kill -0 "$DEV_PID" 2>/dev/null; then
      log "Stopping pnpm dev (pid=$DEV_PID)…"
      kill "$DEV_PID" 2>/dev/null || true
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

HEALTH_URL="$BASE_URL/api/health"
ROOT_URL="$BASE_URL/"

if ! wait_for_url "$HEALTH_URL" "$TIMEOUT_S"; then
  log "Health endpoint not ready; trying root…"
  wait_for_url "$ROOT_URL" "$TIMEOUT_S" || die "Server not ready. Check $LOG_FILE"
fi

log "== Run E2E =="
log "baseUrl   : $BASE_URL"
log "parcoursId: $PARCOURS_ID"
log "learnerId : $LEARNER_ID"
log "courseId  : $COURSE_ID"

pnpm tsx scripts/parcours-scenarios-e2e.ts \
  "$PARCOURS_ID" "$LEARNER_ID" "$COURSE_ID" \
  --baseUrl="$BASE_URL"

log "✅ ALL DONE"
#!/usr/bin/env bash
# scripts/run-parcours-scenarios-all.sh
#
# Usage (Option A - Supabase CLI):
#   export SUPABASE_URL="https://xxxx.supabase.co"
#   export SUPABASE_SERVICE_ROLE_KEY="xxxxx"
#   # Ensure project is linked once:
#   #   supabase login
#   #   supabase link --project-ref <PROJECT_REF>
#
#   chmod +x scripts/run-parcours-scenarios-all.sh
#   ./scripts/run-parcours-scenarios-all.sh \
#     <PARCOURS_ID> <LEARNER_ID> <COURSE_ID> <TEST_ID> <RESOURCE_ID> \
#     --baseUrl=http://localhost:3000 \
#     --timeout=90
#
# Notes:
# - Requires scripts/parcours-scenarios-e2e.ts to exist.
# - Logs dev server to /tmp/pnpm-dev.log, pid to /tmp/pnpm-dev.pid
# - Optional flags:
#     --baseUrl=...      (default: http://localhost:3000)
#     --timeout=SECONDS  (default: 90)
#     --skipMigrations   (skip supabase db push / migration up)

set -euo pipefail

# ---------- helpers ----------
die() { echo "❌ $*" >&2; exit 1; }
log() { echo "▶ $*"; }

require_env() {
  local name="$1"
  [[ -n "${!name:-}" ]] || die "Missing env var: $name"
}

have() { command -v "$1" >/dev/null 2>&1; }

wait_for_url_curl() {
  local url="$1"
  local timeout_s="$2"
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
  local timeout_s="$2"
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
    if (Date.now() - start > timeoutS * 1000) process.exit(1);
    await sleep(1000);
  }
})();
NODE
}

wait_for_url() {
  local url="$1"
  local timeout_s="$2"
  if have curl; then
    wait_for_url_curl "$url" "$timeout_s"
  else
    wait_for_url_node "$url" "$timeout_s"
  fi
}

# ---------- parse args ----------
BASE_URL="http://localhost:3000"
TIMEOUT_S=90
SKIP_MIGRATIONS="0"
POSITIONAL=()

for arg in "$@"; do
  case "$arg" in
    --baseUrl=*)
      BASE_URL="${arg#*=}"
      ;;
    --timeout=*)
      TIMEOUT_S="${arg#*=}"
      ;;
    --skipMigrations)
      SKIP_MIGRATIONS="1"
      ;;
    *)
      POSITIONAL+=("$arg")
      ;;
  esac
done

[[ ${#POSITIONAL[@]} -ge 5 ]] || die "Missing args. Expected: <PARCOURS_ID> <LEARNER_ID> <COURSE_ID> <TEST_ID> <RESOURCE_ID> [--baseUrl=...] [--timeout=...]"

PARCOURS_ID="${POSITIONAL[0]}"
LEARNER_ID="${POSITIONAL[1]}"
COURSE_ID="${POSITIONAL[2]}"
TEST_ID="${POSITIONAL[3]}"
RESOURCE_ID="${POSITIONAL[4]}"

# ---------- preflight ----------
require_env "SUPABASE_URL"
require_env "SUPABASE_SERVICE_ROLE_KEY"

have node || die "node not found"
have pnpm || die "pnpm not found"
have supabase || die "supabase CLI not found (required for Option A)"
[[ -f "scripts/parcours-scenarios-e2e.ts" ]] || die "Missing scripts/parcours-scenarios-e2e.ts (create it first)"

# ---------- apply migrations ----------
run_migrations_option_a() {
  log "Running Supabase migrations (Option A)…"
  if supabase db push --help >/dev/null 2>&1; then
    supabase db push
    return 0
  fi

  if supabase migration up --help >/dev/null 2>&1; then
    supabase migration up
    return 0
  fi

  die "Supabase CLI detected but no migration command available. Update the CLI."
}

if [[ "$SKIP_MIGRATIONS" == "1" ]]; then
  log "Skipping migrations (--skipMigrations)."
else
  run_migrations_option_a
  log "✅ Migrations applied."
fi

# ---------- install deps ----------
if [[ ! -d "node_modules" ]]; then
  log "node_modules missing → pnpm install"
  pnpm install
fi

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

# Wait for server
HEALTH_URL="$BASE_URL/api/health"
ROOT_URL="$BASE_URL/"

if ! wait_for_url "$HEALTH_URL" "$TIMEOUT_S"; then
  log "Health endpoint not ready; trying root…"
  wait_for_url "$ROOT_URL" "$TIMEOUT_S" || die "Server not ready. Check $LOG_FILE"
fi

# ---------- run e2e ----------
log "== Step 4/4: Run E2E =="
log "baseUrl   : $BASE_URL"
log "parcoursId: $PARCOURS_ID"
log "learnerId : $LEARNER_ID"
log "courseId  : $COURSE_ID"
log "testId    : $TEST_ID"
log "resourceId: $RESOURCE_ID"

pnpm tsx scripts/parcours-scenarios-e2e.ts \
  "$PARCOURS_ID" "$LEARNER_ID" "$COURSE_ID" "$TEST_ID" "$RESOURCE_ID" \
  --baseUrl="$BASE_URL"

log "✅ ALL DONE"


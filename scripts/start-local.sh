#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${ROOT_DIR}/.local-logs"
mkdir -p "${LOG_DIR}"

LAN_IP="${KAYJOB_LAN_IP:-$(hostname -I 2>/dev/null | awk '{print $1}') }"
LAN_IP="${LAN_IP// /}"
LAN_IP="${LAN_IP:-127.0.0.1}"
API_URL="${EXPO_PUBLIC_API_URL:-http://${LAN_IP}:4000}"

declare -a CHILDREN=()
cleanup() {
  trap - EXIT INT TERM
  if ((${#CHILDREN[@]})); then kill "${CHILDREN[@]}" 2>/dev/null || true; fi
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

run_service() {
  local name="$1"; shift
  echo "[$name] $*"
  "$@" >"${LOG_DIR}/${name}.log" 2>&1 &
  CHILDREN+=("$!")
}

cd "${ROOT_DIR}"
run_service api npm run start:api
run_service public npx serve public -l 3001
run_service web npx serve apps/web -l 3000
echo "[mobile] API Expo: ${API_URL}"
(cd apps/mobile && EXPO_PUBLIC_API_URL="${API_URL}" npx expo start --lan) >"${LOG_DIR}/mobile.log" 2>&1 &
CHILDREN+=("$!")

cat <<EOF

KayJob est lancé.
  API:    http://${LAN_IP}:4000
  Web:    http://localhost:3000
  Public: http://localhost:3001
  Expo:   consulte le QR code dans le terminal ou ${LOG_DIR}/mobile.log

Logs: ${LOG_DIR}
Arrêt: Ctrl+C
EOF

wait -n "${CHILDREN[@]}"

#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IP="${KAYJOB_LAN_IP:-$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}') }"
IP="${IP// /}"
IP="${IP:-127.0.0.1}"
MODE="${1:---lan}"

if [[ "${IP}" == "127.0.0.1" ]]; then
  echo "Impossible de détecter l'IP locale. Utilise KAYJOB_LAN_IP=192.168.x.x." >&2
  exit 1
fi

echo "API mobile: http://${IP}:4000"
cd "${ROOT_DIR}/apps/mobile"
printf 'EXPO_PUBLIC_API_URL=http://%s:4000\n' "${IP}" > .env.local
EXPO_PUBLIC_API_URL="http://${IP}:4000" npx expo start "${MODE}" -c

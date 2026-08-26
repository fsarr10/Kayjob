#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
NPM_BIN="${NPM_BIN:-$(command -v npm || true)}"
LOG_DIR="${KAYJOB_LOG_DIR:-/var/log/kayjob}"

if [[ -z "${NPM_BIN}" ]]; then
  echo "Node.js et npm sont requis." >&2
  exit 1
fi

mkdir -p "${LOG_DIR}"
CRON_LINE="*/5 * * * * cd ${ROOT_DIR} && ${NPM_BIN} run api:release-expired >> ${LOG_DIR}/release-expired.log 2>&1 # kayjob-release-expired"
(crontab -l 2>/dev/null | grep -v 'kayjob-release-expired' || true; printf '%s\n' "${CRON_LINE}") | crontab -
echo "Cron KayJob installé toutes les 5 minutes pour ${ROOT_DIR}."

#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=level2_common.sh
source "${SCRIPT_DIR}/level2_common.sh"

print_runtime_header

for seed in 1 7 42 100 2026; do
  train_and_benchmark \
    openweather \
    "${OPENWEATHER_OUTPUT_DIR}" \
    "ow_l2_seed${seed}_t300k" \
    300000 \
    "${seed}" \
    "${BASE_ENV_ARGS[@]}" \
    "${BASE_PPO_ARGS[@]}"
done

log "Level 2 multi-seed stability experiments completed."

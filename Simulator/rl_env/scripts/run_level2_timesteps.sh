#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=level2_common.sh
source "${SCRIPT_DIR}/level2_common.sh"

print_runtime_header

for timesteps in 100000 300000 1000000; do
  train_and_benchmark \
    openweather \
    "${OPENWEATHER_OUTPUT_DIR}" \
    "ow_l2_seed7_t${timesteps}" \
    "${timesteps}" \
    7 \
    "${BASE_ENV_ARGS[@]}" \
    "${BASE_PPO_ARGS[@]}"
done

log "Level 2 timesteps convergence experiments completed."

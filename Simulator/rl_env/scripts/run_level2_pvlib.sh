#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=level2_common.sh
source "${SCRIPT_DIR}/level2_common.sh"

print_runtime_header

train_and_benchmark \
  pvlib \
  "${PVLIB_OUTPUT_DIR}" \
  pvlib_l2_seed7_t300k \
  300000 \
  7 \
  "${BASE_ENV_ARGS[@]}" \
  "${BASE_PPO_ARGS[@]}"

log "Level 2 pvlib control experiment completed."

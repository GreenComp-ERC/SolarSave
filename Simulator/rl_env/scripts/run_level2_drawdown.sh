#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=level2_common.sh
source "${SCRIPT_DIR}/level2_common.sh"

print_runtime_header

for drawdown_penalty in 2.0 3.0 5.0; do
  for drawdown_threshold in 0.30 0.35; do
    for drawdown_threshold_penalty in 2.0 4.0 8.0; do
      dd_tag="${drawdown_penalty/./p}"
      th_tag="${drawdown_threshold/./p}"
      thp_tag="${drawdown_threshold_penalty/./p}"

      train_and_benchmark \
        openweather \
        "${OPENWEATHER_OUTPUT_DIR}" \
        "ow_l2_dd${dd_tag}_thr${th_tag}_thp${thp_tag}_seed7_t300k" \
        300000 \
        7 \
        --scenario random \
        --drawdown-penalty "${drawdown_penalty}" \
        --oscillation-penalty 0.35 \
        --unmet-demand-penalty 0.50 \
        --liquidity-floor-penalty 0.35 \
        --drawdown-threshold "${drawdown_threshold}" \
        --drawdown-threshold-penalty "${drawdown_threshold_penalty}" \
        --action-smoothing 0.20 \
        --max-action-delta 0.08 \
        "${BASE_PPO_ARGS[@]}"
    done
  done
done

log "Level 2 drawdown-control experiments completed."

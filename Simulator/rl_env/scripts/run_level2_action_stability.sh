#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=level2_common.sh
source "${SCRIPT_DIR}/level2_common.sh"

print_runtime_header

for action_smoothing in 0.10 0.20 0.40; do
  for max_action_delta in 0.03 0.05 0.08; do
    for ent_coef in 0.001 0.005 0.01; do
      sm_tag="${action_smoothing/./p}"
      delta_tag="${max_action_delta/./p}"
      ent_tag="${ent_coef/./p}"

      train_and_benchmark \
        openweather \
        "${OPENWEATHER_OUTPUT_DIR}" \
        "ow_l2_smooth${sm_tag}_delta${delta_tag}_ent${ent_tag}_seed7_t300k" \
        300000 \
        7 \
        --scenario random \
        --drawdown-penalty 2.0 \
        --oscillation-penalty 0.35 \
        --unmet-demand-penalty 0.50 \
        --liquidity-floor-penalty 0.35 \
        --drawdown-threshold 0.35 \
        --drawdown-threshold-penalty 2.0 \
        --action-smoothing "${action_smoothing}" \
        --max-action-delta "${max_action_delta}" \
        --learning-rate 0.0003 \
        --n-steps 1024 \
        --batch-size 256 \
        --gamma 0.98 \
        --gae-lambda 0.95 \
        --ent-coef "${ent_coef}" \
        --clip-range 0.2
    done
  done
done

log "Level 2 action-stability experiments completed."

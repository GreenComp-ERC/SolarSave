#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=level2_common.sh
source "${SCRIPT_DIR}/level2_common.sh"

BENCHMARK_EPISODES="${SMOKE_BENCHMARK_EPISODES:-1}"
RUN_BENCHMARK=1

print_runtime_header

train_and_benchmark \
  openweather \
  "${SMOKE_OUTPUT_DIR}" \
  smoke_level2_openweather \
  4096 \
  7 \
  --scenario random \
  --drawdown-penalty 2.0 \
  --oscillation-penalty 0.35 \
  --unmet-demand-penalty 0.50 \
  --liquidity-floor-penalty 0.35 \
  --drawdown-threshold 0.35 \
  --drawdown-threshold-penalty 2.0 \
  --action-smoothing 0.20 \
  --max-action-delta 0.08 \
  --learning-rate 0.0003 \
  --n-steps 1024 \
  --batch-size 256 \
  --gamma 0.98 \
  --gae-lambda 0.95 \
  --ent-coef 0.005 \
  --clip-range 0.2

log "Level 2 smoke experiment completed."

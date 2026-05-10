#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=level2_common.sh
source "${SCRIPT_DIR}/level2_common.sh"

MODE="${MODE:-Focused}"

case "${MODE}" in
  Focused|ValidateSeeds|All) ;;
  *) die "MODE must be Focused, ValidateSeeds, or All" ;;
esac

print_runtime_header
log "Mode: ${MODE}"

NEXT_BEST_PPO=(
  --learning-rate 0.0001
  --n-steps 512
  --batch-size 256
  --gamma 0.95
  --gae-lambda 0.95
  --ent-coef 0.01
  --clip-range 0.2
)

LR75_PPO=(
  --learning-rate 0.000075
  --n-steps 512
  --batch-size 256
  --gamma 0.95
  --gae-lambda 0.95
  --ent-coef 0.01
  --clip-range 0.2
)

N1024_PPO=(
  --learning-rate 0.0001
  --n-steps 1024
  --batch-size 256
  --gamma 0.95
  --gae-lambda 0.95
  --ent-coef 0.01
  --clip-range 0.2
)

SMOOTH06_ENV=(
  --scenario random
  --drawdown-penalty 2.0
  --oscillation-penalty 0.50
  --unmet-demand-penalty 0.50
  --liquidity-floor-penalty 0.35
  --drawdown-threshold 0.35
  --drawdown-threshold-penalty 2.0
  --action-smoothing 0.30
  --max-action-delta 0.06
)

SMOOTH05_ENV=(
  --scenario random
  --drawdown-penalty 2.0
  --oscillation-penalty 0.70
  --unmet-demand-penalty 0.50
  --liquidity-floor-penalty 0.35
  --drawdown-threshold 0.35
  --drawdown-threshold-penalty 2.0
  --action-smoothing 0.30
  --max-action-delta 0.05
)

DD25_ENV=(
  --scenario random
  --drawdown-penalty 2.5
  --oscillation-penalty 0.35
  --unmet-demand-penalty 0.50
  --liquidity-floor-penalty 0.35
  --drawdown-threshold 0.30
  --drawdown-threshold-penalty 3.0
  --action-smoothing 0.20
  --max-action-delta 0.08
)

DD30_ENV=(
  --scenario random
  --drawdown-penalty 3.0
  --oscillation-penalty 0.35
  --unmet-demand-penalty 0.50
  --liquidity-floor-penalty 0.35
  --drawdown-threshold 0.30
  --drawdown-threshold-penalty 4.0
  --action-smoothing 0.20
  --max-action-delta 0.08
)

run_next_case() {
  local run_name="$1"
  local timesteps="$2"
  local seed="$3"
  local env_name="$4"
  local ppo_name="$5"

  local -n env_ref="${env_name}"
  local -n ppo_ref="${ppo_name}"
  train_and_benchmark \
    openweather \
    "${OPENWEATHER_OUTPUT_DIR}" \
    "${run_name}" \
    "${timesteps}" \
    "${seed}" \
    "${env_ref[@]}" \
    "${ppo_ref[@]}"
}

if [[ "${MODE}" == "Focused" || "${MODE}" == "All" ]]; then
  run_next_case "ow_l2_next_best_lr0001_n512_g0p95_ent0p01_seed7_t600k" 600000 7 BASE_ENV_ARGS NEXT_BEST_PPO
  run_next_case "ow_l2_next_lr000075_n512_g0p95_ent0p01_seed7_t600k" 600000 7 BASE_ENV_ARGS LR75_PPO
  run_next_case "ow_l2_next_lr0001_n1024_g0p95_ent0p01_seed7_t600k" 600000 7 BASE_ENV_ARGS N1024_PPO
  run_next_case "ow_l2_next_smooth0p30_delta0p06_osc0p50_seed7_t300k" 300000 7 SMOOTH06_ENV NEXT_BEST_PPO
  run_next_case "ow_l2_next_smooth0p30_delta0p05_osc0p70_seed7_t300k" 300000 7 SMOOTH05_ENV NEXT_BEST_PPO
  run_next_case "ow_l2_next_dd2p5_thr0p30_thp3p0_seed7_t300k" 300000 7 DD25_ENV NEXT_BEST_PPO
  run_next_case "ow_l2_next_dd3p0_thr0p30_thp4p0_seed7_t300k" 300000 7 DD30_ENV NEXT_BEST_PPO
fi

if [[ "${MODE}" == "ValidateSeeds" || "${MODE}" == "All" ]]; then
  for seed in 1 42 100 2026; do
    run_next_case "ow_l2_next_best_lr0001_n512_g0p95_ent0p01_seed${seed}_t300k" 300000 "${seed}" BASE_ENV_ARGS NEXT_BEST_PPO
  done
fi

log "Level 2 next optimization experiments completed."
log "Outputs: ${OPENWEATHER_OUTPUT_DIR}"

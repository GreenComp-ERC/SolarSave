#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=level2_common.sh
source "${SCRIPT_DIR}/level2_common.sh"

print_runtime_header

for learning_rate in 0.0001 0.0002 0.0003; do
  for n_steps in 512 1024 2048; do
    for gamma in 0.95 0.98 0.995; do
      for ent_coef in 0.001 0.005 0.01; do
        lr_tag="${learning_rate/0./}"
        gamma_tag="${gamma/./p}"
        ent_tag="${ent_coef/./p}"

        train_and_benchmark \
          openweather \
          "${OPENWEATHER_OUTPUT_DIR}" \
          "ow_l2_lr${lr_tag}_n${n_steps}_g${gamma_tag}_ent${ent_tag}_seed7_t300k" \
          300000 \
          7 \
          "${BASE_ENV_ARGS[@]}" \
          --learning-rate "${learning_rate}" \
          --n-steps "${n_steps}" \
          --batch-size 256 \
          --gamma "${gamma}" \
          --gae-lambda 0.95 \
          --ent-coef "${ent_coef}" \
          --clip-range 0.2
      done
    done
  done
done

log "Level 2 PPO hyperparameter experiments completed."

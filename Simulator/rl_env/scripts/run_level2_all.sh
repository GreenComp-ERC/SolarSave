#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

run_step() {
  local script_name="$1"
  printf '\n===== Running %s =====\n' "${script_name}"
  bash "${SCRIPT_DIR}/${script_name}"
}

run_step run_level2_smoke.sh
run_step run_level2_main.sh
run_step run_level2_multiseed.sh
run_step run_level2_timesteps.sh
run_step run_level2_drawdown.sh
run_step run_level2_action_stability.sh
run_step run_level2_ppo_hparams.sh
run_step run_level2_pvlib.sh

printf '\nAll Level 2 experiment suites completed.\n'

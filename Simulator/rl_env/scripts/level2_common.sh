#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SIMULATOR_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "${SIMULATOR_DIR}"

OPENWEATHER_OUTPUT_DIR="rl_env/outputs/03_level2_openweather/experiments"
PVLIB_OUTPUT_DIR="rl_env/outputs/02_level2_pvlib/experiments"
SMOKE_OUTPUT_DIR="rl_env/outputs/90_smoke_tests"

BENCHMARK_EPISODES="${BENCHMARK_EPISODES:-20}"
BENCHMARK_SEED="${BENCHMARK_SEED:-100}"
N_ENVS="${N_ENVS:-4}"
PYTHON_BIN="${PYTHON_BIN:-python}"
PROGRESS_BAR="${PROGRESS_BAR:-0}"
SKIP_EXISTING="${SKIP_EXISTING:-1}"
RUN_BENCHMARK="${RUN_BENCHMARK:-1}"

BASE_ENV_ARGS=(
  --scenario random
  --drawdown-penalty 2.0
  --oscillation-penalty 0.35
  --unmet-demand-penalty 0.50
  --liquidity-floor-penalty 0.35
  --drawdown-threshold 0.35
  --drawdown-threshold-penalty 2.0
  --action-smoothing 0.20
  --max-action-delta 0.08
)

BASE_PPO_ARGS=(
  --learning-rate 0.0003
  --n-steps 1024
  --batch-size 256
  --gamma 0.98
  --gae-lambda 0.95
  --ent-coef 0.005
  --clip-range 0.2
)

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

die() {
  log "ERROR: $*"
  exit 1
}

require_project_root() {
  [[ -f "rl_env/train_ppo.py" ]] || die "Please run from Simulator/ or keep scripts under rl_env/scripts/."
}

latest_run_dir() {
  local output_dir="$1"
  local run_name="$2"
  find "${output_dir}" -maxdepth 1 -type d -name "*_${run_name}" -printf '%T@ %p\n' \
    | sort -nr \
    | awk 'NR == 1 {print $2}'
}

has_completed_benchmark() {
  local run_dir="$1"
  find "${run_dir}/benchmark" -type f -name benchmark_summary.json -print -quit 2>/dev/null | grep -q .
}

benchmark_compatible_args() {
  local filtered=()
  while (($#)); do
    case "$1" in
      --legacy-observation)
        filtered+=("$1")
        shift
        ;;
      --forecast-window|--drawdown-penalty|--oscillation-penalty|--unmet-demand-penalty|--liquidity-floor-penalty|--drawdown-threshold|--drawdown-threshold-penalty|--action-smoothing|--max-action-delta)
        filtered+=("$1" "$2")
        shift 2
        ;;
      --scenario|--learning-rate|--n-steps|--batch-size|--gamma|--gae-lambda|--ent-coef|--clip-range)
        shift 2
        ;;
      *)
        die "Unknown argument while preparing benchmark command: $1"
        ;;
    esac
  done
  printf '%s\n' "${filtered[@]}"
}

train_exists() {
  local output_dir="$1"
  local run_name="$2"
  local found
  found="$(latest_run_dir "${output_dir}" "${run_name}" || true)"
  [[ -n "${found}" && -f "${found}/leader_agent.zip" ]]
}

benchmark_run() {
  local run_dir="$1"
  local data_source="$2"
  shift 2

  if [[ "${RUN_BENCHMARK}" != "1" ]]; then
    log "Benchmark disabled for ${run_dir}"
    return 0
  fi

  if [[ "${SKIP_EXISTING}" == "1" ]] && has_completed_benchmark "${run_dir}"; then
    log "Benchmark already exists, skipping: ${run_dir}"
    return 0
  fi

  log "Benchmarking ${run_dir}"
  local benchmark_args=()
  if (($#)); then
    mapfile -t benchmark_args < <(benchmark_compatible_args "$@")
  fi

  "${PYTHON_BIN}" -m rl_env.benchmark \
    --model "${run_dir}/leader_agent.zip" \
    --data-source "${data_source}" \
    --episodes "${BENCHMARK_EPISODES}" \
    --seed "${BENCHMARK_SEED}" \
    "${benchmark_args[@]}" \
    --output-dir "${run_dir}/benchmark" \
    --run-name eval_all \
    --timestamp-output
}

train_and_benchmark() {
  local data_source="$1"
  local output_dir="$2"
  local run_name="$3"
  local timesteps="$4"
  local seed="$5"
  shift 5

  local run_dir
  if [[ "${SKIP_EXISTING}" == "1" ]] && train_exists "${output_dir}" "${run_name}"; then
    run_dir="$(latest_run_dir "${output_dir}" "${run_name}")"
    log "Training output already exists, skipping train: ${run_dir}"
  else
    log "Training ${run_name} (${data_source}, seed=${seed}, timesteps=${timesteps})"
    local progress_arg=()
    if [[ "${PROGRESS_BAR}" == "1" ]]; then
      progress_arg=(--progress-bar)
    fi

    "${PYTHON_BIN}" -m rl_env.train_ppo \
      --data-source "${data_source}" \
      --timesteps "${timesteps}" \
      --n-envs "${N_ENVS}" \
      --seed "${seed}" \
      "$@" \
      --output-dir "${output_dir}" \
      --run-name "${run_name}" \
      --timestamp-output \
      "${progress_arg[@]}"

    run_dir="$(latest_run_dir "${output_dir}" "${run_name}")"
    [[ -n "${run_dir}" && -f "${run_dir}/leader_agent.zip" ]] || die "Could not find trained model for ${run_name}"
  fi

  benchmark_run "${run_dir}" "${data_source}" "$@"
}

print_runtime_header() {
  require_project_root
  mkdir -p "${OPENWEATHER_OUTPUT_DIR}" "${PVLIB_OUTPUT_DIR}" "${SMOKE_OUTPUT_DIR}"
  log "Simulator dir: ${SIMULATOR_DIR}"
  log "Python: $(${PYTHON_BIN} --version 2>&1)"
  log "Benchmark episodes per scenario: ${BENCHMARK_EPISODES}"
  log "n-envs: ${N_ENVS}"
  log "skip existing: ${SKIP_EXISTING}"
}

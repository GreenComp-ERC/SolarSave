# SolarChain Phase 1 RL Environment

This folder contains the independent reinforcement-learning proof-of-concept
for phase 1. It does not modify the blockchain contracts or React frontend.

## Goal

Train a Leader Agent that dynamically controls:

- `reward_ratio`: the share of generated energy converted into user rewards
- `liquidity_ratio`: the share of generated energy added to market liquidity
- `dynamic_burn_rate`: the simulated burn pressure applied to transaction flow

The benchmark compares this policy with the current static `1:3` allocation:

```text
reward_ratio = 0.25
liquidity_ratio = 0.75
```

## MDP

Observation vector:

```text
historical supply-demand gap mean
historical supply-demand gap volatility
liquidity depth
simulated token volatility
current max drawdown
last token return
previous reward ratio
previous liquidity ratio
previous burn rate
```

Action vector:

```text
[reward_ratio, liquidity_ratio, dynamic_burn_rate]
```

The environment maps PPO's `[0, 1]` action outputs into bounded market ratios
and prevents total reward/liquidity allocation from exceeding the configured
allocation cap.

Reward function:

```text
total_volume
- drawdown_penalty * max_drawdown
- oscillation_penalty * high_frequency_action_change
- unmet_demand_penalty * unmet_demand
```

## Setup

Activate the RL environment:

```powershell
conda activate SolarChain-rl
cd D:\Documents\SolarChain\SolarSave\Simulator
pip install -r rl_env\requirements-rl.txt
```

## Train

```powershell
python -m rl_env.train_ppo --timesteps 100000
```

The trained model is saved to:

```text
Simulator/rl_env/outputs/leader_agent.zip
```

For a quick smoke run:

```powershell
python -m rl_env.train_ppo --timesteps 2048 --n-envs 1
```

## Benchmark

After training:

```powershell
python -m rl_env.benchmark --model rl_env\outputs\leader_agent.zip --episodes 10
```

Smoke-test the static baseline only:

```powershell
python -m rl_env.benchmark --skip-ppo --episodes 1
```

Outputs:

```text
Simulator/rl_env/outputs/benchmark_results.csv
Simulator/rl_env/outputs/benchmark_summary.json
```

## Data Sources

The default generator is deterministic and fast:

```powershell
python -m rl_env.train_ppo --data-source synthetic
```

Level 2 supports two physical-simulation supply modes:

```powershell
python -m rl_env.train_ppo --data-source pvlib
python -m rl_env.train_ppo --data-source openweather
```

`pvlib` uses clear-sky solar physics with synthetic cloud derating.

`openweather` fetches real current weather from OpenWeather for the configured
coordinates, caches temperature, wind speed, and cloud cover in
`rl_env/cache/openweather_weather.json`, and then uses those real conditions to
derate a pvlib day-ahead PV supply curve. This is Level 2 physical simulation,
not full historical market data.

You can override the API key with:

```powershell
$env:OPENWEATHER_API_KEY="your-key"
```

The legacy flag is still available:

```powershell
python -m rl_env.train_ppo --use-pvmodel
```

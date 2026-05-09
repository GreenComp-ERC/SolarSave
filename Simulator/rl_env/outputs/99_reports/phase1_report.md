# Phase 1 Report: PPO Leader Agent vs Static 1:3 Allocation

## Scope

This phase builds an independent Gymnasium reinforcement-learning environment
without changing the existing smart contracts or React frontend.

The current on-chain static rule is represented as:

```text
reward_ratio = 25%
liquidity_ratio = 75%
dynamic_burn_rate = 2%
```

The PPO Leader Agent controls:

```text
[reward_ratio, liquidity_ratio, dynamic_burn_rate]
```

## Environment

State:

- historical supply-demand gap mean
- historical supply-demand gap volatility
- liquidity depth
- simulated token volatility
- current max drawdown
- last token return
- previous reward ratio
- previous liquidity ratio
- previous burn rate

Reward:

```text
total_volume
- 1.25 * max_drawdown
- 0.20 * action_oscillation
- 0.35 * unmet_demand
```

Shock scenarios:

- normal
- cloudy_supply_drop
- factory_demand_spike
- oversupply
- demand_collapse
- token_volatility
- mixed_shock

## Training

Command:

```powershell
conda run -n SolarChain-rl python -m rl_env.train_ppo --timesteps 100000 --n-envs 4 --output-dir rl_env\outputs
```

Output model:

```text
Simulator/rl_env/outputs/leader_agent.zip
```

## Benchmark

Command:

```powershell
conda run -n SolarChain-rl python -m rl_env.benchmark --model rl_env\outputs\leader_agent.zip --episodes 10 --output-dir rl_env\outputs
```

Summary:

| Metric | Static 1:3 | PPO Leader | PPO Delta |
| --- | ---: | ---: | ---: |
| Total episode volume | 6,904,238.19 | 8,318,295.89 | +20.48% |
| Mean liquidity | 6,900.91 | 7,616.11 | +10.36% |
| Low-liquidity steps | 320.80 | 307.33 | +4.20% fewer |
| Max drawdown | 0.951584 | 0.951524 | +0.0063% lower |
| Total unmet demand | 17,410,493.29 | 16,340,831.82 | +6.14% lower |

Detailed files:

```text
Simulator/rl_env/outputs/benchmark_results.csv
Simulator/rl_env/outputs/benchmark_summary.json
```

## Conclusion

Under the synthetic extreme supply-demand shock set, the trained PPO policy
outperformed the static 1:3 rule on total market volume, average liquidity, and
unmet-demand reduction. The result is sufficient for the phase-1 proof of
concept and provides a trained policy artifact for phase-2 oracle integration.

## Level 2 OpenWeather Run

The Level 2 OpenWeather data source uses real current weather snapshots from
OpenWeather for the default coordinates:

```text
31.2000,121.5000
32.1000,118.8000
30.6000,114.3000
```

Cached weather:

| Coordinate | Temp C | Wind m/s | Cloud % |
| --- | ---: | ---: | ---: |
| 31.2000,121.5000 | 21.97 | 7.00 | 0.00 |
| 32.1000,118.8000 | 22.59 | 3.99 | 8.00 |
| 30.6000,114.3000 | 25.01 | 4.30 | 8.00 |

Training command:

```powershell
conda run -n SolarChain-rl python -m rl_env.train_ppo --timesteps 100000 --n-envs 4 --data-source openweather --output-dir rl_env\outputs\level2_openweather
```

Benchmark command:

```powershell
conda run -n SolarChain-rl python -m rl_env.benchmark --model rl_env\outputs\level2_openweather\leader_agent.zip --episodes 10 --data-source openweather --output-dir rl_env\outputs\level2_openweather
```

Output model:

```text
Simulator/rl_env/outputs/level2_openweather/leader_agent.zip
```

Level 2 benchmark summary:

| Metric | Static 1:3 | PPO Leader | PPO Delta |
| --- | ---: | ---: | ---: |
| Total episode volume | 9,065,361.33 | 10,932,717.33 | +20.60% |
| Mean liquidity | 47,789.93 | 113,516.35 | +137.53% |
| Low-liquidity steps | 214.20 | 184.69 | +13.78% fewer |
| Max drawdown | 0.961914 | 0.963084 | -0.12% worse |
| Total unmet demand | 15,249,370.15 | 13,722,060.00 | +10.02% lower |

Interpretation:

The Level 2 OpenWeather run strengthens the phase-1 result on liquidity and
unmet-demand metrics. The policy does accept a slightly worse max drawdown, so
the next training iteration should increase the drawdown penalty or add a hard
circuit-breaker constraint before any phase-2 oracle integration.

# Phase 1 Report: PPO Leader Agent Model Selection

## 1. Phase Goal

Phase 1 builds an independent Gymnasium reinforcement-learning environment for
SolarChain without changing the existing blockchain contracts or frontend. The
goal is to prove that an AI-controlled Leader Agent can outperform the static
1:3 allocation rule under day-ahead microgrid supply-demand shocks.

Static 1:3 baseline:

```text
reward_ratio = 25%
liquidity_ratio = 75%
dynamic_burn_rate = 2%
```

PPO Leader Agent action:

```text
[reward_ratio, liquidity_ratio, dynamic_burn_rate]
```

## 2. Environment and Reward

Observation state includes:

- historical supply-demand gap mean
- historical supply-demand gap volatility
- liquidity depth
- simulated token volatility
- current max drawdown
- last token return
- previous reward ratio
- previous liquidity ratio
- previous burn rate
- Level 2 enhanced time and short-horizon forecast features

Reward function:

```text
total_volume
- drawdown_penalty * max_drawdown
- oscillation_penalty * high_frequency_action_change
- unmet_demand_penalty * unmet_demand
- liquidity_floor_penalty * liquidity_floor_violation
```

Formal benchmark scenarios:

- normal
- cloudy_supply_drop
- factory_demand_spike
- oversupply
- demand_collapse
- token_volatility
- mixed_shock

## 3. Output Scan Scope

This report is based on all comparable benchmark summaries currently found
under:

```text
Simulator/rl_env/outputs/
```

Comparable runs are those containing both `static_1_to_3` and `ppo_leader`
results in `benchmark_summary.json`. Static-only smoke tests are not used for
model selection.

Scanned comparable benchmark count:

```text
138
```

Main result groups:

| Group | Comparable Runs | Role |
| --- | ---: | --- |
| `01_synthetic_level1` | 1 | Early Level 1 proof of concept |
| `02_level2_pvlib` | 1 | Level 2 physical PV countercheck |
| `03_level2_openweather` | 133 | Main Level 2 model search |
| `90_smoke_tests` | 3 | Pipeline checks only, not final evidence |

## 4. Selection Criteria

The model is selected for Phase 2 candidacy by prioritizing practical market
control, not only highest return.

Primary criteria:

1. Higher `mean_liquidity` than static 1:3.
2. Fewer `low_liquidity_steps` than static 1:3.
3. Lower `total_unmet_demand` than static 1:3.
4. `max_drawdown` not materially worse than static 1:3.
5. Low `mean_action_oscillation`, because Phase 2 will push ratios on-chain.
6. No catastrophic regression in any benchmark scenario.

Composite scan score used for ranking:

```text
0.35 * mean_liquidity_delta_pct
+ 0.25 * unmet_demand_reduction_pct
+ 0.20 * low_liquidity_steps_reduction_pct
+ 0.10 * episode_volume_delta_pct
+ 0.10 * max_drawdown_improvement_pct
```

The score is only a sorting aid. Final selection also considers action
stability and scenario-level behavior.

## 5. Best Overall Candidates

Top comparable Level 2 OpenWeather candidates:

| Rank | Experiment | Volume | Mean Liquidity | Low-Liq Steps | Max Drawdown | Unmet Demand | PPO Oscillation |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | `20260510_111731_ow_l2_lr0003_n512_g0p98_ent0p01_seed7_t300k` | +26.11% | +265.20% | +28.31% fewer | +2.164% lower | +38.51% lower | 0.0240 |
| 2 | `20260510_084456_ow_l2_lr0001_n512_g0p95_ent0p01_seed7_t300k` | +26.19% | +261.37% | +28.22% fewer | +2.154% lower | +38.69% lower | 0.0022 |
| 3 | `20260510_072953_ow_l2_smooth0p10_delta0p03_ent0p01_seed7_t300k` | +25.62% | +256.43% | +27.76% fewer | +2.061% lower | +35.19% lower | 0.0069 |
| 4 | `20260510_111448_ow_l2_lr0003_n512_g0p98_ent0p005_seed7_t300k` | +26.06% | +251.86% | +28.05% fewer | +2.043% lower | +37.75% lower | 0.0183 |
| 5 | `20260510_080212_ow_l2_smooth0p20_delta0p05_ent0p01_seed7_t300k` | +25.62% | +251.82% | +27.85% fewer | +2.005% lower | +35.39% lower | 0.0185 |

The raw composite winner is Rank 1, but the recommended Phase 2 candidate is
Rank 2 because it has almost identical market performance with much lower
action oscillation. That makes it safer for oracle-driven on-chain parameter
updates.

## 6. Recommended Model

Recommended candidate:

```text
Simulator/rl_env/outputs/03_level2_openweather/experiments/20260510_084456_ow_l2_lr0001_n512_g0p95_ent0p01_seed7_t300k/leader_agent.zip
```

Training configuration:

| Parameter | Value |
| --- | ---: |
| data_source | `openweather` |
| scenario | `random` |
| timesteps | 300000 |
| seed | 7 |
| n_envs | 4 |
| learning_rate | 0.0001 |
| n_steps | 512 |
| batch_size | 256 |
| gamma | 0.95 |
| gae_lambda | 0.95 |
| ent_coef | 0.01 |
| drawdown_penalty | 2.0 |
| oscillation_penalty | 0.35 |
| unmet_demand_penalty | 0.50 |
| liquidity_floor_penalty | 0.35 |
| action_smoothing | 0.20 |
| max_action_delta | 0.08 |

Benchmark configuration:

```text
episodes = 20 per scenario
seed = 100
scenarios = all seven formal shock scenarios
```

Overall benchmark summary:

| Metric | Static 1:3 | PPO Leader | PPO Delta |
| --- | ---: | ---: | ---: |
| Total episode volume | 9,033,334.55 | 11,399,591.99 | +26.19% |
| Mean liquidity | 48,773.80 | 176,254.20 | +261.37% |
| Low-liquidity steps | 215.00 | 154.31 | +28.22% fewer |
| Max drawdown | 0.961122 | 0.940419 | +2.154% lower |
| Total unmet demand | 15,265,582.77 | 9,359,901.97 | +38.69% lower |
| Mean action oscillation | 0.0000595 | 0.0022 | low |

## 7. Scenario-Level Validation

Recommended model deltas against static 1:3:

| Scenario | Volume | Mean Liquidity | Low-Liq Steps | Max Drawdown | Unmet Demand |
| --- | ---: | ---: | ---: | ---: | ---: |
| normal | +26.20% | +279.03% | +29.11% fewer | -0.553% worse | +40.82% lower |
| cloudy_supply_drop | +26.13% | +259.32% | +20.88% fewer | -0.552% worse | +35.74% lower |
| factory_demand_spike | +26.20% | +259.29% | +20.98% fewer | -0.472% worse | +32.75% lower |
| oversupply | +26.28% | +304.38% | +47.35% fewer | +12.148% lower | +56.04% lower |
| demand_collapse | +26.20% | +192.00% | +38.26% fewer | +5.514% lower | +48.90% lower |
| token_volatility | +26.20% | +279.03% | +29.11% fewer | -0.553% worse | +40.82% lower |
| mixed_shock | +26.13% | +258.60% | +20.49% fewer | -0.475% worse | +29.75% lower |

Interpretation:

- The selected PPO policy improves volume, mean liquidity, low-liquidity steps,
  and unmet demand in every formal shock scenario.
- Drawdown is substantially better in `oversupply` and `demand_collapse`.
- Drawdown is slightly worse in normal-like and demand-spike scenarios, but the
  worsening is below 0.6% relative and is offset by large liquidity and unmet
  demand improvements.

## 8. Cross-Run Evidence

Important comparison points:

| Run | Volume | Mean Liquidity | Low-Liq Steps | Max Drawdown | Unmet Demand | Note |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Level 1 synthetic 100k | +20.48% | +10.36% | +4.20% fewer | +0.006% lower | +6.14% lower | Confirms initial POC |
| Level 2 OpenWeather 100k | +20.60% | +137.53% | +13.78% fewer | -0.122% worse | +10.02% lower | First Level 2 result |
| Level 2 OpenWeather main 300k | +25.04% | +207.27% | +25.89% fewer | +1.044% lower | +33.43% lower | Stronger optimized baseline |
| Level 2 pvlib 300k | +25.19% | +215.30% | +23.86% fewer | -0.384% worse | +29.44% lower | Physical PV countercheck |
| Recommended OpenWeather 300k | +26.19% | +261.37% | +28.22% fewer | +2.154% lower | +38.69% lower | Best stable candidate |

Multi-seed 300k OpenWeather runs also support the conclusion that PPO improves
liquidity and unmet demand robustly:

| Seed Run | Mean Liquidity Delta | Unmet Demand Delta | Max Drawdown Delta |
| --- | ---: | ---: | ---: |
| seed 1 | +238.97% | +38.21% lower | +1.919% lower |
| seed 7 | +207.27% | +33.43% lower | +1.044% lower |
| seed 42 | +157.51% | +34.93% lower | +0.419% lower |
| seed 100 | +149.75% | +31.70% lower | -0.008% worse |
| seed 2026 | +172.70% | +33.21% lower | +0.150% lower |

This means the PPO advantage is not caused by a single lucky random seed.

## 9. Known Risks and Caveats

1. `liquidity_floor` and `final_liquidity` still reach zero in these severe
   synthetic shock episodes. The PPO policy preserves substantially higher mean
   liquidity and reduces low-liquidity time, but it does not fully solve terminal
   liquidity depletion.
2. OpenWeather Level 2 uses real current weather snapshots plus pvlib
   physical derating. It is stronger than pure synthetic Level 1, but it is not
   yet full historical market data.
3. The selected model has very low action oscillation, but Phase 2 must still
   reproduce `action_smoothing` and `max_action_delta` in the oracle runtime.
4. On-chain deployment must use safety clamps and static fallback values before
   any live update path is enabled.

## 10. Phase 1 Conclusion

Phase 1 is successful. Across Level 1 synthetic data, Level 2 pvlib physical PV
simulation, and Level 2 OpenWeather-enhanced physical simulation, PPO Leader
Agents consistently outperform the static 1:3 rule on the core liquidity and
demand-service metrics.

The recommended candidate for Phase 2 integration planning is:

```text
20260510_084456_ow_l2_lr0001_n512_g0p95_ent0p01_seed7_t300k
```

It is preferred over the raw top-scoring model because it keeps nearly the same
liquidity, volume, drawdown, and unmet-demand gains while reducing action
oscillation from `0.0240` to `0.0022`.

## 11. Phase 2 Readiness Recommendation

Before connecting this model to contracts or frontend code, Phase 2 should add:

- oracle-side observation builder matching the training observation exactly
- action conversion from model output to integer BPS values
- hard clamps for reward, liquidity, burn, and total allocation
- model-load failure fallback to static `2500 / 7500 / 200` BPS
- replay/dry-run mode that logs actions without sending transactions
- market-history logging for future Level 3 training data

The current report supports selecting the candidate model for oracle dry-run
design, not immediate unrestricted on-chain control.

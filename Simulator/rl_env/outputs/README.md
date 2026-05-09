# RL Outputs 目录说明

本目录保存阶段一强化学习实验产物。为便于最终横评，正式模型和 benchmark 统一放进：

```text
experiments/<timestamp>_<run-name>/
```

> 注意：`Simulator/rl_env/outputs` 已在 `.gitignore` 中忽略。这里的模型和结果用于本地实验归档，不会默认进入 git。

## 目录总览

```text
outputs/
  01_synthetic_level1/
    experiments/
  02_level2_pvlib/
    smoke_static/
    experiments/
  03_level2_openweather/
    smoke_static/
    experiments/
  90_smoke_tests/
  99_reports/
  README.md
```

## 01_synthetic_level1

Level 1 合成数据实验结果。

当前已归档的正式 run：

```text
01_synthetic_level1/experiments/20260509_222049_synthetic_l1_seed7_t100k/
```

包含：

```text
leader_agent.zip
benchmark/20260509_222049_eval_all/benchmark_results.csv
benchmark/20260509_222049_eval_all/benchmark_summary.json
```

含义：使用合成供需数据训练出的 PPO Leader Agent，训练规模约 100k timesteps；benchmark 覆盖多个冲击场景，每个场景 10 个 episode。

说明：这是早期历史 run，尚未包含 `train_args.json`、`env_config.json` 和 `benchmark_by_scenario.json`。后续新实验会自动生成这些文件。

## 02_level2_pvlib

Level 2 pvlib 物理光伏模拟实验区。

```text
02_level2_pvlib/smoke_static/
```

含义：pvlib 数据源下的静态 1:3 smoke benchmark，只用于确认数据源和环境能跑通，不用于正式结论。

```text
02_level2_pvlib/experiments/
```

含义：后续 pvlib 正式训练和 benchmark 的时间戳实验目录。

## 03_level2_openweather

Level 2 OpenWeather + pvlib 物理光伏模拟实验区。

```text
03_level2_openweather/smoke_static/
```

含义：OpenWeather 数据源下的静态 1:3 smoke benchmark。用于确认 OpenWeather 拉取、缓存和环境运行正常。

当前已归档的正式 run：

```text
03_level2_openweather/experiments/20260509_222049_ow_l2_seed7_t100k/
```

包含：

```text
leader_agent.zip
benchmark/20260509_222049_eval_all/benchmark_results.csv
benchmark/20260509_222049_eval_all/benchmark_summary.json
```

含义：OpenWeather 数据源下第一版 PPO 模型，训练规模约 100k timesteps。该结果显示 PPO 在总成交量、平均流动性、低流动性步数、未满足需求上优于静态 1:3，但最大回撤略差。

说明：这是早期历史 run，尚未包含 `train_args.json`、`env_config.json` 和 `benchmark_by_scenario.json`。后续新实验会自动生成这些文件。

后续正式 Level 2 优化实验继续放在：

```text
03_level2_openweather/experiments/
```

建议每次训练使用 `--timestamp-output`，生成：

```text
03_level2_openweather/experiments/<timestamp>_<run-name>/
```

每个新实验目录应包含：

```text
leader_agent.zip
train_args.json
env_config.json
benchmark/<timestamp>_eval_all/
```

benchmark 子目录应包含：

```text
benchmark_results.csv
benchmark_summary.json
benchmark_by_scenario.json
benchmark_args.json
env_config.json
```

## 90_smoke_tests

所有临时 smoke test 统一放在这里。

这些结果只用于确认代码链路，不用于论文、报告或最终结论。

包含：

```text
90_smoke_tests/smoke_static/
90_smoke_tests/smoke_train/
90_smoke_tests/smoke_ppo/
90_smoke_tests/optimized_smoke/
```

## 99_reports

报告和阶段性总结。

```text
99_reports/phase1_report.md
```

含义：阶段一初版和 Level 2 OpenWeather 第一版结果总结。

## 后续横评推荐读取顺序

1. 先看某个实验目录下的 `train_args.json` 和 `env_config.json`，确认训练条件。
2. 再看 `benchmark/xxx/benchmark_summary.json`，确认总体表现。
3. 最后看 `benchmark/xxx/benchmark_by_scenario.json`，确认是否有某个冲击场景退化。

对于早期历史 run，如果没有 `train_args.json` 或 `benchmark_by_scenario.json`，以该目录名和本 README 的说明为准。

关键指标：

```text
episode_volume              越高越好
mean_liquidity              越高越好
low_liquidity_steps         越低越好
total_unmet_demand          越低越好
max_drawdown                越低越好
mean_action_oscillation     越低越稳
```

# Level 2 Linux 无人值守实验脚本说明

本文档配套 `实验指南_优化版.md` 中的「Level 2 必做实验清单」，用于在 Linux 服务器上按顺序完成 Level 2 OpenWeather / pvlib 训练与 benchmark。

所有命令建议在项目的 `Simulator` 目录执行：

```bash
cd /path/to/SolarSave/Simulator
conda activate SolarChain-rl
```

如果脚本没有执行权限，可以先运行：

```bash
chmod +x rl_env/scripts/*.sh
```

## 1. 推荐运行顺序

### 1.1 先跑 smoke test

用于确认 Python 环境、依赖、OpenWeather 缓存/读取、训练和 benchmark 链路能跑通。

```bash
bash rl_env/scripts/run_level2_smoke.sh
```

预期输出：

```text
rl_env/outputs/90_smoke_tests/<timestamp>_smoke_level2_openweather/
  leader_agent.zip
  train_args.json
  env_config.json
  benchmark/<timestamp>_eval_all/
    benchmark_results.csv
    benchmark_summary.json
    benchmark_by_scenario.json
    benchmark_args.json
    env_config.json
```

### 1.2 跑 Level 2 主实验

对应指南 4.1 和 4.2。

```bash
bash rl_env/scripts/run_level2_main.sh
```

预期输出：

```text
rl_env/outputs/03_level2_openweather/experiments/<timestamp>_ow_l2_main_seed7_t300k/
```

该目录下应包含：

```text
leader_agent.zip
train_args.json
env_config.json
benchmark/<timestamp>_eval_all/
```

### 1.3 跑各类 Level 2 必做实验

按清单顺序执行：

```bash
bash rl_env/scripts/run_level2_multiseed.sh
bash rl_env/scripts/run_level2_timesteps.sh
bash rl_env/scripts/run_level2_drawdown.sh
bash rl_env/scripts/run_level2_action_stability.sh
bash rl_env/scripts/run_level2_ppo_hparams.sh
bash rl_env/scripts/run_level2_pvlib.sh
```

也可以用总入口一次性无人值守运行：

```bash
nohup bash rl_env/scripts/run_level2_all.sh > rl_env/outputs/level2_all.log 2>&1 &
```

查看日志：

```bash
tail -f rl_env/outputs/level2_all.log
```

## 2. 脚本覆盖范围

`run_level2_multiseed.sh`：

```text
seed = 1, 7, 42, 100, 2026
timesteps = 300000
data_source = openweather
```

`run_level2_timesteps.sh`：

```text
timesteps = 100000, 300000, 1000000
seed = 7
data_source = openweather
```

`run_level2_drawdown.sh`：

```text
drawdown_penalty = 2.0, 3.0, 5.0
drawdown_threshold = 0.30, 0.35
drawdown_threshold_penalty = 2.0, 4.0, 8.0
```

`run_level2_action_stability.sh`：

```text
action_smoothing = 0.10, 0.20, 0.40
max_action_delta = 0.03, 0.05, 0.08
ent_coef = 0.001, 0.005, 0.01
```

`run_level2_ppo_hparams.sh`：

```text
learning_rate = 0.0001, 0.0002, 0.0003
n_steps = 512, 1024, 2048
gamma = 0.95, 0.98, 0.995
ent_coef = 0.001, 0.005, 0.01
```

`run_level2_pvlib.sh`：

```text
data_source = pvlib
seed = 7
timesteps = 300000
```

每次训练完成后，脚本会自动对该 `leader_agent.zip` 执行 benchmark。

## 3. 可调环境变量

默认每个 benchmark 使用 `20` 个 episode，`4` 个并行环境训练：

```bash
BENCHMARK_EPISODES=20
N_ENVS=4
```

可按服务器资源调整，例如：

```bash
N_ENVS=8 BENCHMARK_EPISODES=30 bash rl_env/scripts/run_level2_all.sh
```

其他常用变量：

```text
PYTHON_BIN=python          Python 命令
SKIP_EXISTING=1            已存在 leader_agent.zip 或 benchmark_summary.json 时跳过
RUN_BENCHMARK=1            训练后自动 benchmark
PROGRESS_BAR=0             是否开启 stable-baselines3 progress bar
BENCHMARK_SEED=100         benchmark 起始 seed
```

只训练不 benchmark：

```bash
RUN_BENCHMARK=0 bash rl_env/scripts/run_level2_multiseed.sh
```

强制重跑已存在实验：

```bash
SKIP_EXISTING=0 bash rl_env/scripts/run_level2_main.sh
```

## 4. 输出目录

OpenWeather 正式实验：

```text
rl_env/outputs/03_level2_openweather/experiments/
```

pvlib 对照实验：

```text
rl_env/outputs/02_level2_pvlib/experiments/
```

smoke test：

```text
rl_env/outputs/90_smoke_tests/
```

每个正式训练 run 的目录结构应为：

```text
<timestamp>_<run-name>/
  leader_agent.zip
  train_args.json
  env_config.json
  benchmark/<timestamp>_eval_all/
    benchmark_results.csv
    benchmark_summary.json
    benchmark_by_scenario.json
    benchmark_args.json
    env_config.json
```

## 5. 结果检查重点

优先看：

```text
benchmark_summary.json
benchmark_by_scenario.json
```

关键指标：

```text
episode_volume              越高越好
mean_liquidity              越高越好
low_liquidity_steps         越低越好
total_unmet_demand          越低越好
max_drawdown                越低越好
mean_action_oscillation     越低越稳
```

候选模型不应只看最高 return，应优先选择：

```text
mean_liquidity 明显优于 static_1_to_3
total_unmet_demand 明显低于 static_1_to_3
max_drawdown 不明显差于 static_1_to_3
mean_action_oscillation 不过高
benchmark_by_scenario.json 中没有明显灾难性退化场景
多 seed 结果稳定
```

## 6. 注意事项

完整 `run_level2_all.sh` 会运行大量组合，尤其是 drawdown、action stability、PPO 超参网格，耗时可能很长，适合服务器无人值守执行。

脚本默认 `SKIP_EXISTING=1`，因此中断后可以直接重新执行同一个脚本；已有 `leader_agent.zip` 的训练会跳过，已有 `benchmark_summary.json` 的 benchmark 也会跳过。

OpenWeather 数据会使用项目中的缓存：

```text
rl_env/cache/openweather_weather.json
```

如果需要重新拉取天气数据，先删除该缓存文件后再运行实验。

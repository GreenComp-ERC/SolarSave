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

---

## 7. 下一轮优化实验：风险、调参方向与 Windows 执行方式

上一轮模型选择后，当前推荐候选为：

```text
rl_env/outputs/03_level2_openweather/experiments/20260510_084456_ow_l2_lr0001_n512_g0p95_ent0p01_seed7_t300k/leader_agent.zip
```

该模型相对静态 1:3 的总体表现为：

```text
episode_volume              +26.19%
mean_liquidity              +261.37%
low_liquidity_steps         +28.22% fewer
max_drawdown                +2.154% lower
total_unmet_demand          +38.69% lower
mean_action_oscillation     0.0022
```

### 7.1 当前主要风险

1. **终局流动性仍会归零**  
   `liquidity_floor` 和 `final_liquidity` 在极端冲击 episode 中仍可能到 0。PPO 已经显著提高平均流动性并减少低流动性时长，但还没有解决“极端尾部 episode 的最终耗尽”。

2. **OpenWeather Level 2 仍不是完整历史市场数据**  
   当前是 OpenWeather 当前天气快照 + pvlib 光伏物理曲线 + 合成需求冲击，不等于真实历史光伏、真实用电需求和链上交易历史。

3. **部分场景回撤略差**  
   推荐模型在 `normal`、`cloudy_supply_drop`、`factory_demand_spike`、`token_volatility`、`mixed_shock` 中 max drawdown 比 static 略差，幅度约 0.47%-0.55%。总体平均回撤更好，但阶段二上链前仍需要 safety clamp。

4. **动作平滑必须在线上复现**  
   当前好结果依赖 `action_smoothing=0.20` 和 `max_action_delta=0.08`。如果 oracle runtime 不复现这两个约束，上链比例可能比训练环境更跳。

5. **只看平均值容易掩盖尾部风险**  
   选模不能只看 `return` 或总体均值，还要检查 `benchmark_by_scenario.json`，尤其是 `oversupply`、`demand_collapse`、`mixed_shock` 下是否出现灾难性退化。

### 7.2 下一轮优化思路

基于当前最佳参数，不建议再做超大网格搜索。下一轮优先做局部精修：

1. **围绕最佳 PPO 超参延长训练**  
   当前最佳为：
   ```text
   learning_rate = 0.0001
   n_steps = 512
   gamma = 0.95
   ent_coef = 0.01
   timesteps = 300000
   ```
   下一轮先跑 `600000` timesteps，观察是否继续提升，或是否开始过拟合。

2. **微调学习率和 rollout 长度**  
   尝试：
   ```text
   learning_rate = 0.000075
   n_steps = 512 / 1024
   gamma = 0.95
   ent_coef = 0.01
   ```
   目标是保留当前高流动性和低 unmet demand，同时让策略更稳定。

3. **增强动作稳定性**  
   当前模型已经很稳，但阶段二要上链，动作稳定性值得继续压：
   ```text
   action_smoothing = 0.30
   max_action_delta = 0.05 / 0.06
   oscillation_penalty = 0.50 / 0.70
   ```
   验收标准是 `mean_action_oscillation` 继续低于当前 `0.0022`，且 `mean_liquidity` 不明显牺牲。

4. **轻微加强回撤约束**  
   不建议一上来把 drawdown penalty 拉太高，否则可能牺牲成交和流动性。优先尝试：
   ```text
   drawdown_penalty = 2.5 / 3.0
   drawdown_threshold = 0.30
   drawdown_threshold_penalty = 3.0 / 4.0
   ```
   目标是改善分场景中轻微回撤变差的问题。

5. **用多 seed 验证最佳参数稳定性**  
   如果新一轮出现更优模型，再用：
   ```text
   seed = 1, 42, 100, 2026
   ```
   做稳定性确认。

### 7.3 Windows PowerShell 脚本

已新增：

```text
rl_env/scripts/run_level2_next_optimization.ps1
```

默认 `Focused` 模式会跑 7 个高价值实验：

```text
1. 当前最佳参数延长到 600k
2. learning_rate 0.000075 + 600k
3. n_steps 1024 + 600k
4. action_smoothing 0.30 / max_action_delta 0.06 / oscillation_penalty 0.50
5. action_smoothing 0.30 / max_action_delta 0.05 / oscillation_penalty 0.70
6. drawdown_penalty 2.5 / threshold 0.30 / threshold_penalty 3.0
7. drawdown_penalty 3.0 / threshold 0.30 / threshold_penalty 4.0
```

输出仍统一写入：

```text
rl_env/outputs/03_level2_openweather/experiments/
```

### 7.4 Windows 执行方式

在 PowerShell 中执行：

```powershell
conda activate SolarChain-rl
cd D:\Documents\SolarChain\SolarSave\Simulator
powershell -ExecutionPolicy Bypass -File .\rl_env\scripts\run_level2_next_optimization.ps1
```

如果 CPU 资源足够，可以增加并行环境数：

```powershell
powershell -ExecutionPolicy Bypass -File .\rl_env\scripts\run_level2_next_optimization.ps1 -NEnvs 8
```

只训练、不跑 benchmark：

```powershell
powershell -ExecutionPolicy Bypass -File .\rl_env\scripts\run_level2_next_optimization.ps1 -NoBenchmark
```

强制重跑已存在的同名实验：

```powershell
powershell -ExecutionPolicy Bypass -File .\rl_env\scripts\run_level2_next_optimization.ps1 -NoSkipExisting
```

跑多 seed 验证：

```powershell
powershell -ExecutionPolicy Bypass -File .\rl_env\scripts\run_level2_next_optimization.ps1 -Mode ValidateSeeds
```

一次性跑 Focused + 多 seed 验证：

```powershell
powershell -ExecutionPolicy Bypass -File .\rl_env\scripts\run_level2_next_optimization.ps1 -Mode All
```

### 7.5 下一轮选模标准

新一轮结果出来后，优先比较每个 run 的：

```text
benchmark_summary.json
benchmark_by_scenario.json
```

新的候选模型应至少满足：

```text
mean_liquidity >= 当前推荐模型的 176254.20，或不能明显低于它
total_unmet_demand <= 当前推荐模型的 9359901.97
low_liquidity_steps <= 当前推荐模型的 154.31
max_drawdown <= 当前推荐模型的 0.940419，或分场景回撤明显更稳
mean_action_oscillation <= 当前推荐模型的 0.0022
```

如果某个模型流动性略低，但显著降低回撤或动作振荡，也可以作为“更适合阶段二上链”的保守候选。

### 7.6 Mode All 耗时估算

`Mode All` 会执行：

```text
Focused:       3 个 600k run + 4 个 300k run = 10 个 300k 等价单位
ValidateSeeds: 4 个 300k run                  = 4 个 300k 等价单位
合计:                                             14 个 300k 等价单位
```

从当前已有归档的时间戳粗略反推，之前一组 `300k train + 20 episodes benchmark`
大约在 2.5-3 分钟一个 run 的量级。但这取决于机器、Python/BLAS、是否降频、
OpenWeather 缓存、并行环境数和后台负载。

在 i9-13900H 笔记本 CPU 上，建议按下面区间预估：

```text
较理想情况: 45-60 分钟
常见情况:   60-90 分钟
保守情况:   90-120 分钟
```

如果散热较好且 `-NEnvs 8` 能稳定吃满 CPU，可能接近低区间；如果笔记本长时间
功耗墙/温度墙降频，可能接近高区间。第一次建议先跑：

```powershell
powershell -ExecutionPolicy Bypass -File .\rl_env\scripts\run_level2_next_optimization.ps1 -Mode Focused
```

确认单个 run 速度和结果趋势后，再跑：

```powershell
powershell -ExecutionPolicy Bypass -File .\rl_env\scripts\run_level2_next_optimization.ps1 -Mode ValidateSeeds
```

### 7.7 Bash 版本脚本

已新增：

```text
rl_env/scripts/run_level2_next_optimization.sh
```

Linux / Git Bash / WSL 中执行：

```bash
cd /path/to/SolarSave/Simulator
conda activate SolarChain-rl
bash rl_env/scripts/run_level2_next_optimization.sh
```

指定模式：

```bash
MODE=Focused bash rl_env/scripts/run_level2_next_optimization.sh
MODE=ValidateSeeds bash rl_env/scripts/run_level2_next_optimization.sh
MODE=All bash rl_env/scripts/run_level2_next_optimization.sh
```

常用参数通过环境变量传入：

```bash
N_ENVS=8 MODE=All bash rl_env/scripts/run_level2_next_optimization.sh
BENCHMARK_EPISODES=30 MODE=Focused bash rl_env/scripts/run_level2_next_optimization.sh
RUN_BENCHMARK=0 MODE=Focused bash rl_env/scripts/run_level2_next_optimization.sh
SKIP_EXISTING=0 MODE=Focused bash rl_env/scripts/run_level2_next_optimization.sh
PROGRESS_BAR=1 MODE=Focused bash rl_env/scripts/run_level2_next_optimization.sh
```

在 Windows 上如果用 Git Bash，路径示例：

```bash
cd /d/Documents/SolarChain/SolarSave/Simulator
MODE=All bash rl_env/scripts/run_level2_next_optimization.sh
```

PowerShell 版和 Bash 版的实验组合一致，输出都写入：

```text
rl_env/outputs/03_level2_openweather/experiments/
```

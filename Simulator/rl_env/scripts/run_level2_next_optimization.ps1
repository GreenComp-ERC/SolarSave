param(
    [ValidateSet("Focused", "ValidateSeeds", "All")]
    [string]$Mode = "Focused",
    [string]$PythonExe = "",
    [string]$CondaEnv = "SolarChain-rl",
    [int]$NEnvs = 4,
    [int]$BenchmarkEpisodes = 20,
    [int]$BenchmarkSeed = 100,
    [switch]$NoBenchmark,
    [switch]$NoSkipExisting,
    [switch]$ProgressBar,
    [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SimulatorDir = Resolve-Path (Join-Path $ScriptDir "..\..")
Set-Location $SimulatorDir

$OpenWeatherOutputDir = "rl_env/outputs/03_level2_openweather/experiments"
New-Item -ItemType Directory -Force -Path $OpenWeatherOutputDir | Out-Null

function Write-Log {
    param([string]$Message)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$ts] $Message"
}

function Require-ProjectRoot {
    if (-not (Test-Path "rl_env/train_ppo.py")) {
        throw "Please run this script from Simulator/, or keep it under rl_env/scripts/."
    }
}

function Resolve-PythonExe {
    if ($PythonExe) {
        return $PythonExe
    }

    if ($env:CONDA_DEFAULT_ENV -eq $CondaEnv -and $env:CONDA_PREFIX) {
        $activePython = Join-Path $env:CONDA_PREFIX "python.exe"
        if (Test-Path $activePython) {
            return $activePython
        }
    }

    $condaExe = Get-Command conda -ErrorAction SilentlyContinue
    if ($condaExe) {
        $condaPrefix = (& conda env list --json | ConvertFrom-Json).envs |
            Where-Object { (Split-Path $_ -Leaf) -eq $CondaEnv } |
            Select-Object -First 1
        if ($condaPrefix) {
            $condaPython = Join-Path $condaPrefix "python.exe"
            if (Test-Path $condaPython) {
                return $condaPython
            }
        }
    }

    return "python"
}

function Test-RlDependencies {
    $code = "import importlib.util, sys; required = ['gymnasium', 'stable_baselines3', 'torch', 'pvlib', 'numpy', 'pandas', 'requests', 'dotenv']; missing = [name for name in required if importlib.util.find_spec(name) is None]; print(sys.executable); sys.exit('Missing Python modules: ' + ', '.join(missing) if missing else 0)"
    $output = & $script:ResolvedPythonExe -c $code
    if ($LASTEXITCODE -ne 0) {
        throw "RL dependencies are not available in Python '$script:ResolvedPythonExe'. Install them with: conda run -n $CondaEnv python -m pip install -r rl_env/requirements-rl.txt"
    }
    return ($output | Select-Object -First 1)
}

function Get-LatestRunDir {
    param(
        [string]$OutputDir,
        [string]$RunName
    )
    Get-ChildItem -Path $OutputDir -Directory -Filter "*_$RunName" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
}

function Has-CompletedBenchmark {
    param([string]$RunDir)
    $benchmarkDir = Join-Path $RunDir "benchmark"
    if (-not (Test-Path $benchmarkDir)) {
        return $false
    }
    $summary = Get-ChildItem -Path $benchmarkDir -Recurse -Filter "benchmark_summary.json" -ErrorAction SilentlyContinue |
        Select-Object -First 1
    return $null -ne $summary
}

function Invoke-PythonModule {
    param(
        [string]$Module,
        [string[]]$ArgsList
    )
    & $script:ResolvedPythonExe -m $Module @ArgsList
    if ($LASTEXITCODE -ne 0) {
        throw "Python module failed: $Module"
    }
}

function Train-AndBenchmark {
    param(
        [string]$RunName,
        [int]$Timesteps,
        [int]$Seed,
        [string[]]$EnvArgs,
        [string[]]$PpoArgs
    )

    $existing = Get-LatestRunDir -OutputDir $OpenWeatherOutputDir -RunName $RunName
    $skipExisting = -not $NoSkipExisting
    if ($skipExisting -and $existing -and (Test-Path (Join-Path $existing.FullName "leader_agent.zip"))) {
        $runDir = $existing.FullName
        Write-Log "Training output already exists, skipping train: $runDir"
    }
    else {
        Write-Log "Training $RunName (openweather, seed=$Seed, timesteps=$Timesteps)"
        $trainArgs = @(
            "--data-source", "openweather",
            "--timesteps", "$Timesteps",
            "--n-envs", "$NEnvs",
            "--seed", "$Seed"
        ) + $EnvArgs + $PpoArgs + @(
            "--output-dir", $OpenWeatherOutputDir,
            "--run-name", $RunName,
            "--timestamp-output"
        )
        if ($ProgressBar) {
            $trainArgs += "--progress-bar"
        }

        Invoke-PythonModule -Module "rl_env.train_ppo" -ArgsList $trainArgs
        $latest = Get-LatestRunDir -OutputDir $OpenWeatherOutputDir -RunName $RunName
        if (-not $latest -or -not (Test-Path (Join-Path $latest.FullName "leader_agent.zip"))) {
            throw "Could not find trained model for $RunName"
        }
        $runDir = $latest.FullName
    }

    if ($NoBenchmark) {
        Write-Log "Benchmark disabled for $runDir"
        return
    }

    if ($skipExisting -and (Has-CompletedBenchmark -RunDir $runDir)) {
        Write-Log "Benchmark already exists, skipping: $runDir"
        return
    }

    Write-Log "Benchmarking $runDir"
    $benchmarkArgs = @(
        "--model", (Join-Path $runDir "leader_agent.zip"),
        "--data-source", "openweather",
        "--episodes", "$BenchmarkEpisodes",
        "--seed", "$BenchmarkSeed"
    ) + $EnvArgs + @(
        "--output-dir", (Join-Path $runDir "benchmark"),
        "--run-name", "eval_all",
        "--timestamp-output"
    )

    Invoke-PythonModule -Module "rl_env.benchmark" -ArgsList $benchmarkArgs
}

Require-ProjectRoot
$script:ResolvedPythonExe = Resolve-PythonExe
$resolvedPythonPath = Test-RlDependencies
Write-Log "Simulator dir: $SimulatorDir"
Write-Log "Python: $(& $script:ResolvedPythonExe --version)"
Write-Log "Python executable: $resolvedPythonPath"
Write-Log "Conda env target: $CondaEnv"
Write-Log "Mode: $Mode"
Write-Log "Benchmark episodes per scenario: $BenchmarkEpisodes"
Write-Log "n-envs: $NEnvs"
Write-Log "skip existing: $(-not $NoSkipExisting)"
if ($CheckOnly) {
    Write-Log "Environment check completed."
    return
}

$baseEnv = @(
    "--scenario", "random",
    "--drawdown-penalty", "2.0",
    "--oscillation-penalty", "0.35",
    "--unmet-demand-penalty", "0.50",
    "--liquidity-floor-penalty", "0.35",
    "--drawdown-threshold", "0.35",
    "--drawdown-threshold-penalty", "2.0",
    "--action-smoothing", "0.20",
    "--max-action-delta", "0.08"
)

$bestPpo = @(
    "--learning-rate", "0.0001",
    "--n-steps", "512",
    "--batch-size", "256",
    "--gamma", "0.95",
    "--gae-lambda", "0.95",
    "--ent-coef", "0.01",
    "--clip-range", "0.2"
)

$experiments = @()

if ($Mode -in @("Focused", "All")) {
    $experiments += [pscustomobject]@{
        RunName = "ow_l2_next_best_lr0001_n512_g0p95_ent0p01_seed7_t600k"
        Timesteps = 600000
        Seed = 7
        EnvArgs = $baseEnv
        PpoArgs = $bestPpo
    }
    $experiments += [pscustomobject]@{
        RunName = "ow_l2_next_lr000075_n512_g0p95_ent0p01_seed7_t600k"
        Timesteps = 600000
        Seed = 7
        EnvArgs = $baseEnv
        PpoArgs = @("--learning-rate","0.000075","--n-steps","512","--batch-size","256","--gamma","0.95","--gae-lambda","0.95","--ent-coef","0.01","--clip-range","0.2")
    }
    $experiments += [pscustomobject]@{
        RunName = "ow_l2_next_lr0001_n1024_g0p95_ent0p01_seed7_t600k"
        Timesteps = 600000
        Seed = 7
        EnvArgs = $baseEnv
        PpoArgs = @("--learning-rate","0.0001","--n-steps","1024","--batch-size","256","--gamma","0.95","--gae-lambda","0.95","--ent-coef","0.01","--clip-range","0.2")
    }
    $experiments += [pscustomobject]@{
        RunName = "ow_l2_next_smooth0p30_delta0p06_osc0p50_seed7_t300k"
        Timesteps = 300000
        Seed = 7
        EnvArgs = @("--scenario","random","--drawdown-penalty","2.0","--oscillation-penalty","0.50","--unmet-demand-penalty","0.50","--liquidity-floor-penalty","0.35","--drawdown-threshold","0.35","--drawdown-threshold-penalty","2.0","--action-smoothing","0.30","--max-action-delta","0.06")
        PpoArgs = $bestPpo
    }
    $experiments += [pscustomobject]@{
        RunName = "ow_l2_next_smooth0p30_delta0p05_osc0p70_seed7_t300k"
        Timesteps = 300000
        Seed = 7
        EnvArgs = @("--scenario","random","--drawdown-penalty","2.0","--oscillation-penalty","0.70","--unmet-demand-penalty","0.50","--liquidity-floor-penalty","0.35","--drawdown-threshold","0.35","--drawdown-threshold-penalty","2.0","--action-smoothing","0.30","--max-action-delta","0.05")
        PpoArgs = $bestPpo
    }
    $experiments += [pscustomobject]@{
        RunName = "ow_l2_next_dd2p5_thr0p30_thp3p0_seed7_t300k"
        Timesteps = 300000
        Seed = 7
        EnvArgs = @("--scenario","random","--drawdown-penalty","2.5","--oscillation-penalty","0.35","--unmet-demand-penalty","0.50","--liquidity-floor-penalty","0.35","--drawdown-threshold","0.30","--drawdown-threshold-penalty","3.0","--action-smoothing","0.20","--max-action-delta","0.08")
        PpoArgs = $bestPpo
    }
    $experiments += [pscustomobject]@{
        RunName = "ow_l2_next_dd3p0_thr0p30_thp4p0_seed7_t300k"
        Timesteps = 300000
        Seed = 7
        EnvArgs = @("--scenario","random","--drawdown-penalty","3.0","--oscillation-penalty","0.35","--unmet-demand-penalty","0.50","--liquidity-floor-penalty","0.35","--drawdown-threshold","0.30","--drawdown-threshold-penalty","4.0","--action-smoothing","0.20","--max-action-delta","0.08")
        PpoArgs = $bestPpo
    }
}

if ($Mode -in @("ValidateSeeds", "All")) {
    foreach ($seed in @(1, 42, 100, 2026)) {
        $experiments += [pscustomobject]@{
            RunName = "ow_l2_next_best_lr0001_n512_g0p95_ent0p01_seed${seed}_t300k"
            Timesteps = 300000
            Seed = $seed
            EnvArgs = $baseEnv
            PpoArgs = $bestPpo
        }
    }
}

foreach ($exp in $experiments) {
    Train-AndBenchmark `
        -RunName $exp.RunName `
        -Timesteps $exp.Timesteps `
        -Seed $exp.Seed `
        -EnvArgs $exp.EnvArgs `
        -PpoArgs $exp.PpoArgs
}

Write-Log "Level 2 next optimization experiments completed."
Write-Log "Outputs: $OpenWeatherOutputDir"

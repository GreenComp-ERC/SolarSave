"""Train a PPO Leader Agent for the phase-1 SolarChain RL environment."""

from __future__ import annotations

import argparse
from dataclasses import asdict
from pathlib import Path

from stable_baselines3 import PPO
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.monitor import Monitor

from .experiment_utils import build_run_dir, write_json
from .microgrid_env import MicrogridEnv, MicrogridEnvConfig


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train SolarChain PPO Leader Agent")
    parser.add_argument("--timesteps", type=int, default=100_000)
    parser.add_argument("--scenario", default="random", help="Use a scenario name, or random/all for per-episode sampling")
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--n-envs", type=int, default=4)
    parser.add_argument("--output-dir", default="rl_env/outputs")
    parser.add_argument("--run-name", default=None)
    parser.add_argument("--timestamp-output", action="store_true")
    parser.add_argument("--data-source", choices=["synthetic", "pvlib", "openweather"], default="synthetic")
    parser.add_argument("--use-pvmodel", action="store_true", help="Alias for --data-source pvlib")
    parser.add_argument("--legacy-observation", action="store_true")
    parser.add_argument("--forecast-window", type=int, default=3)
    parser.add_argument("--drawdown-penalty", type=float, default=2.0)
    parser.add_argument("--oscillation-penalty", type=float, default=0.35)
    parser.add_argument("--unmet-demand-penalty", type=float, default=0.50)
    parser.add_argument("--liquidity-floor-penalty", type=float, default=0.35)
    parser.add_argument("--drawdown-threshold", type=float, default=0.35)
    parser.add_argument("--drawdown-threshold-penalty", type=float, default=2.0)
    parser.add_argument("--action-smoothing", type=float, default=0.20)
    parser.add_argument("--max-action-delta", type=float, default=0.08)
    parser.add_argument("--learning-rate", type=float, default=3e-4)
    parser.add_argument("--n-steps", type=int, default=1024)
    parser.add_argument("--batch-size", type=int, default=256)
    parser.add_argument("--gamma", type=float, default=0.98)
    parser.add_argument("--gae-lambda", type=float, default=0.95)
    parser.add_argument("--ent-coef", type=float, default=0.005)
    parser.add_argument("--clip-range", type=float, default=0.2)
    parser.add_argument("--progress-bar", action="store_true")
    return parser.parse_args()


def make_env(config: MicrogridEnvConfig):
    def _factory():
        return Monitor(MicrogridEnv(config))

    return _factory


def main() -> None:
    args = parse_args()
    output_dir = build_run_dir(args.output_dir, args.run_name, args.timestamp_output)
    output_dir.mkdir(parents=True, exist_ok=True)

    config = MicrogridEnvConfig(
        scenario=args.scenario,
        seed=args.seed,
        data_source="pvlib" if args.use_pvmodel else args.data_source,
        use_pvmodel=args.use_pvmodel,
        enhanced_observation=not args.legacy_observation,
        forecast_window=args.forecast_window,
        drawdown_penalty=args.drawdown_penalty,
        oscillation_penalty=args.oscillation_penalty,
        unmet_demand_penalty=args.unmet_demand_penalty,
        liquidity_floor_penalty=args.liquidity_floor_penalty,
        drawdown_threshold=args.drawdown_threshold,
        drawdown_threshold_penalty=args.drawdown_threshold_penalty,
        action_smoothing=args.action_smoothing,
        max_action_delta=args.max_action_delta,
    )
    env = make_vec_env(make_env(config), n_envs=args.n_envs, seed=args.seed)

    model = PPO(
        "MlpPolicy",
        env,
        verbose=1,
        seed=args.seed,
        learning_rate=args.learning_rate,
        n_steps=args.n_steps,
        batch_size=args.batch_size,
        gamma=args.gamma,
        gae_lambda=args.gae_lambda,
        ent_coef=args.ent_coef,
        clip_range=args.clip_range,
    )
    model.learn(total_timesteps=args.timesteps, progress_bar=args.progress_bar)

    model_path = output_dir / "leader_agent"
    model.save(model_path)
    write_json(output_dir / "train_args.json", vars(args))
    write_json(output_dir / "env_config.json", asdict(config))
    print(f"Saved PPO model to {model_path.with_suffix('.zip')}")
    print(f"Run output directory: {output_dir}")


if __name__ == "__main__":
    main()

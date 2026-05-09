"""Benchmark static 1:3 allocation against a trained PPO Leader Agent."""

from __future__ import annotations

import argparse
import csv
from dataclasses import asdict
import json
from pathlib import Path
from typing import Callable

import numpy as np

from stable_baselines3 import PPO

from .data_generator import scenario_names
from .experiment_utils import build_run_dir, write_json
from .microgrid_env import MicrogridEnv, MicrogridEnvConfig


PolicyFn = Callable[[np.ndarray], np.ndarray]


def encode_actual_action(
    config: MicrogridEnvConfig,
    reward_ratio: float = 0.25,
    liquidity_ratio: float = 0.75,
    burn_rate: float = 0.02,
) -> np.ndarray:
    reward = (reward_ratio - config.min_reward_ratio) / (
        config.max_reward_ratio - config.min_reward_ratio
    )
    liquidity = (liquidity_ratio - config.min_liquidity_ratio) / (
        config.max_liquidity_ratio - config.min_liquidity_ratio
    )
    burn = burn_rate / config.max_burn_rate
    return np.clip(np.array([reward, liquidity, burn], dtype=np.float32), 0.0, 1.0)


def run_episode(env: MicrogridEnv, policy: PolicyFn, seed: int, scenario: str) -> dict[str, float | str]:
    obs, _ = env.reset(seed=seed, options={"scenario": scenario})
    rewards = []
    oscillation = []
    unmet = []
    liquidity = []
    done = False
    while not done:
        action = policy(obs)
        obs, reward, terminated, truncated, info = env.step(action)
        rewards.append(reward)
        oscillation.append(float(info.get("action_oscillation", 0.0)))
        unmet.append(float(info.get("unmet_demand", 0.0)))
        liquidity.append(float(info.get("liquidity", 0.0)))
        done = terminated or truncated

    metrics = env.episode_metrics()
    return {
        "scenario": scenario,
        "return": float(np.sum(rewards)),
        "episode_volume": float(metrics["episode_volume"]),
        "liquidity_floor": float(metrics["liquidity_floor"]),
        "final_liquidity": float(metrics["liquidity"]),
        "mean_liquidity": float(np.mean(liquidity)),
        "low_liquidity_steps": float(
            np.sum(np.asarray(liquidity) < env.config.initial_liquidity * 0.05)
        ),
        "max_drawdown": float(metrics["max_drawdown"]),
        "final_token_price": float(metrics["final_token_price"]),
        "mean_action_oscillation": float(np.mean(oscillation)),
        "total_unmet_demand": float(np.sum(unmet)),
    }


def aggregate(rows: list[dict[str, float | str]]) -> dict[str, float]:
    numeric_keys = [key for key in rows[0] if key not in {"scenario", "policy"}]
    return {
        key: float(np.mean([float(row[key]) for row in rows]))
        for key in numeric_keys
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Benchmark SolarChain RL phase-1 policies")
    parser.add_argument("--model", default="rl_env/outputs/leader_agent.zip")
    parser.add_argument("--episodes", type=int, default=5)
    parser.add_argument("--seed", type=int, default=100)
    parser.add_argument("--output-dir", default="rl_env/outputs")
    parser.add_argument("--run-name", default=None)
    parser.add_argument("--timestamp-output", action="store_true")
    parser.add_argument("--scenarios", default=",".join(scenario_names()))
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
    parser.add_argument("--skip-ppo", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_dir = build_run_dir(args.output_dir, args.run_name, args.timestamp_output)
    output_dir.mkdir(parents=True, exist_ok=True)

    config = MicrogridEnvConfig(
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
    static_action = encode_actual_action(config, 0.25, 0.75, 0.02)
    static_policy = lambda _obs: static_action

    model = None
    if not args.skip_ppo:
        model_path = Path(args.model)
        if not model_path.exists():
            raise FileNotFoundError(
                f"PPO model not found at {model_path}. Run train_ppo.py first or pass --skip-ppo."
            )
        model = PPO.load(model_path)

    rows: list[dict[str, float | str]] = []
    selected_scenarios = [item.strip() for item in args.scenarios.split(",") if item.strip()]
    for scenario in selected_scenarios:
        for episode in range(args.episodes):
            seed = args.seed + episode

            env = MicrogridEnv(config)
            static_metrics = run_episode(env, static_policy, seed, scenario)
            static_metrics["policy"] = "static_1_to_3"
            rows.append(static_metrics)

            if model is not None:
                ppo_env = MicrogridEnv(config)

                def ppo_policy(obs):
                    action, _ = model.predict(obs, deterministic=True)
                    return action

                ppo_metrics = run_episode(ppo_env, ppo_policy, seed, scenario)
                ppo_metrics["policy"] = "ppo_leader"
                rows.append(ppo_metrics)

    csv_path = output_dir / "benchmark_results.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    summary: dict[str, dict[str, float]] = {}
    for policy in sorted({str(row["policy"]) for row in rows}):
        policy_rows = [row for row in rows if row["policy"] == policy]
        summary[policy] = aggregate(policy_rows)

    if "ppo_leader" in summary and "static_1_to_3" in summary:
        static = summary["static_1_to_3"]
        ppo = summary["ppo_leader"]
        summary["ppo_vs_static_delta_pct"] = {
            "episode_volume": 100.0 * (ppo["episode_volume"] - static["episode_volume"]) / max(static["episode_volume"], 1.0),
            "liquidity_floor": 100.0 * (ppo["liquidity_floor"] - static["liquidity_floor"]) / max(static["liquidity_floor"], 1.0),
            "mean_liquidity": 100.0 * (ppo["mean_liquidity"] - static["mean_liquidity"]) / max(static["mean_liquidity"], 1.0),
            "low_liquidity_steps": 100.0 * (static["low_liquidity_steps"] - ppo["low_liquidity_steps"]) / max(static["low_liquidity_steps"], 1.0),
            "max_drawdown": 100.0 * (static["max_drawdown"] - ppo["max_drawdown"]) / max(static["max_drawdown"], 1e-9),
            "total_unmet_demand": 100.0 * (static["total_unmet_demand"] - ppo["total_unmet_demand"]) / max(static["total_unmet_demand"], 1.0),
        }

    by_scenario: dict[str, dict[str, dict[str, float]]] = {}
    for scenario in selected_scenarios:
        scenario_rows = [row for row in rows if row["scenario"] == scenario]
        scenario_summary: dict[str, dict[str, float]] = {}
        for policy in sorted({str(row["policy"]) for row in scenario_rows}):
            policy_rows = [row for row in scenario_rows if row["policy"] == policy]
            scenario_summary[policy] = aggregate(policy_rows)
        if "ppo_leader" in scenario_summary and "static_1_to_3" in scenario_summary:
            static = scenario_summary["static_1_to_3"]
            ppo = scenario_summary["ppo_leader"]
            scenario_summary["ppo_vs_static_delta_pct"] = {
                "episode_volume": 100.0 * (ppo["episode_volume"] - static["episode_volume"]) / max(static["episode_volume"], 1.0),
                "mean_liquidity": 100.0 * (ppo["mean_liquidity"] - static["mean_liquidity"]) / max(static["mean_liquidity"], 1.0),
                "low_liquidity_steps": 100.0 * (static["low_liquidity_steps"] - ppo["low_liquidity_steps"]) / max(static["low_liquidity_steps"], 1.0),
                "max_drawdown": 100.0 * (static["max_drawdown"] - ppo["max_drawdown"]) / max(static["max_drawdown"], 1e-9),
                "total_unmet_demand": 100.0 * (static["total_unmet_demand"] - ppo["total_unmet_demand"]) / max(static["total_unmet_demand"], 1.0),
            }
        by_scenario[scenario] = scenario_summary

    summary_path = output_dir / "benchmark_summary.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    by_scenario_path = output_dir / "benchmark_by_scenario.json"
    by_scenario_path.write_text(json.dumps(by_scenario, indent=2), encoding="utf-8")
    write_json(output_dir / "benchmark_args.json", vars(args))
    write_json(output_dir / "env_config.json", asdict(config))

    print(f"Wrote detailed results to {csv_path}")
    print(f"Wrote summary to {summary_path}")
    print(f"Wrote per-scenario summary to {by_scenario_path}")
    print(f"Run output directory: {output_dir}")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()

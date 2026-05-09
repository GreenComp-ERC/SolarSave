"""Gymnasium MDP for SolarChain phase-1 Leader Agent experiments."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import gymnasium as gym
from gymnasium import spaces
import numpy as np

from .data_generator import DataSource, ScenarioName, generate_market_series, scenario_names


@dataclass
class MicrogridEnvConfig:
    scenario: str = "normal"
    data_source: DataSource = "synthetic"
    episode_steps: int = 24 * 14
    history_window: int = 12
    forecast_window: int = 3
    seed: int = 7
    use_pvmodel: bool = False
    enhanced_observation: bool = True
    initial_liquidity: float = 120_000.0
    initial_token_price: float = 1.0
    min_reward_ratio: float = 0.05
    max_reward_ratio: float = 0.65
    min_liquidity_ratio: float = 0.20
    max_liquidity_ratio: float = 0.95
    max_burn_rate: float = 0.20
    max_total_allocation: float = 0.98
    drawdown_penalty: float = 1.25
    oscillation_penalty: float = 0.20
    unmet_demand_penalty: float = 0.35
    liquidity_floor_penalty: float = 0.20
    drawdown_threshold: float = 0.35
    drawdown_threshold_penalty: float = 1.50
    action_smoothing: float = 0.0
    max_action_delta: float = 1.0
    safety_liquidity_floor_ratio: float = 0.05


class MicrogridEnv(gym.Env):
    """A compact microgrid market simulator.

    State:
      [gap mean, gap std, liquidity depth, token volatility, drawdown,
       last token return, previous reward ratio, previous liquidity ratio,
       previous burn rate]

    Action:
      [reward ratio, liquidity ratio, dynamic burn rate]
    """

    metadata = {"render_modes": []}

    def __init__(self, config: MicrogridEnvConfig | None = None):
        super().__init__()
        self.config = config or MicrogridEnvConfig()
        self.action_space = spaces.Box(low=0.0, high=1.0, shape=(3,), dtype=np.float32)
        obs_size = 16 if self.config.enhanced_observation else 9
        self.observation_space = spaces.Box(low=-5.0, high=5.0, shape=(obs_size,), dtype=np.float32)
        self._rng = np.random.default_rng(self.config.seed)
        self._series = None
        self._step = 0
        self._liquidity = self.config.initial_liquidity
        self._token_price = self.config.initial_token_price
        self._peak_price = self.config.initial_token_price
        self._max_drawdown = 0.0
        self._prev_action = np.array([0.25, 0.75, 0.02], dtype=np.float32)
        self._returns: list[float] = []
        self._gaps: list[float] = []
        self._liquidity_history: list[float] = []
        self._episode_volume = 0.0
        self._liquidity_floor = self._liquidity
        self._last_metrics: dict[str, float] = {}

    def reset(self, *, seed: int | None = None, options: dict[str, Any] | None = None):
        super().reset(seed=seed)
        if seed is not None:
            self._rng = np.random.default_rng(seed)
        scenario = (options or {}).get("scenario", self.config.scenario)
        if scenario in {"random", "all"}:
            scenario = str(self._rng.choice(scenario_names()))
        series_seed = int(self._rng.integers(0, 2**31 - 1))
        self._series = generate_market_series(
            scenario=scenario,
            steps=self.config.episode_steps + self.config.history_window + 1,
            seed=series_seed,
            data_source=self.config.data_source,
            use_pvmodel=self.config.use_pvmodel,
        )
        self._step = 0
        self._liquidity = self.config.initial_liquidity
        self._token_price = self.config.initial_token_price
        self._peak_price = self.config.initial_token_price
        self._max_drawdown = 0.0
        self._prev_action = np.array([0.25, 0.75, 0.02], dtype=np.float32)
        self._returns = [0.0] * self.config.history_window
        self._gaps = [0.0] * self.config.history_window
        self._liquidity_history = [self._liquidity] * self.config.history_window
        self._episode_volume = 0.0
        self._liquidity_floor = self._liquidity
        self._last_metrics = {}
        return self._observation(), {}

    def step(self, action):
        action = self._sanitize_action(np.asarray(action, dtype=np.float32))
        supply = float(self._series.supply[self._step])  # type: ignore[union-attr]
        demand = float(self._series.demand[self._step])  # type: ignore[union-attr]
        external_vol = float(self._series.external_volatility[self._step])  # type: ignore[union-attr]

        reward_ratio, liquidity_ratio, burn_rate = map(float, action)
        effective_demand = demand * max(0.75, 1.0 - burn_rate * 0.80)
        liquidity_added = supply * liquidity_ratio
        reward_tokens = supply * reward_ratio / 100_000.0

        available_energy = self._liquidity + liquidity_added
        matched_energy = min(available_energy, effective_demand)
        unmet_demand = max(effective_demand - available_energy, 0.0)
        self._liquidity = max(available_energy - matched_energy, 0.0)
        self._liquidity_floor = min(self._liquidity_floor, self._liquidity)

        base = max(float(np.mean(self._series.demand)), 1.0)  # type: ignore[arg-type,union-attr]
        volume_norm = matched_energy / base
        gap_norm = (supply - demand) / base
        burn_support = burn_rate * volume_norm
        shortage_pressure = unmet_demand / base
        noise = float(self._rng.normal(0.0, external_vol))

        price_return = (
            0.018 * gap_norm
            + 0.020 * volume_norm
            + 0.090 * burn_support
            - 0.060 * shortage_pressure
            - 0.010 * reward_tokens
            + noise
        )
        price_return = float(np.clip(price_return, -0.35, 0.35))
        self._token_price = max(0.05, self._token_price * (1.0 + price_return))
        self._peak_price = max(self._peak_price, self._token_price)
        drawdown = 1.0 - self._token_price / self._peak_price
        self._max_drawdown = max(self._max_drawdown, drawdown)

        action_oscillation = float(np.linalg.norm(action - self._prev_action, ord=1))
        liquidity_depth = self._liquidity / max(self.config.initial_liquidity, 1.0)
        liquidity_shortfall = max(self.config.safety_liquidity_floor_ratio - liquidity_depth, 0.0)
        excess_drawdown = max(self._max_drawdown - self.config.drawdown_threshold, 0.0)
        reward = (
            volume_norm
            - self.config.drawdown_penalty * self._max_drawdown
            - self.config.oscillation_penalty * action_oscillation
            - self.config.unmet_demand_penalty * shortage_pressure
            - self.config.liquidity_floor_penalty * liquidity_shortfall
            - self.config.drawdown_threshold_penalty * excess_drawdown
        )

        self._episode_volume += matched_energy
        self._returns.append(price_return)
        self._returns = self._returns[-self.config.history_window :]
        self._gaps.append(gap_norm)
        self._gaps = self._gaps[-self.config.history_window :]
        self._liquidity_history.append(self._liquidity)
        self._liquidity_history = self._liquidity_history[-self.config.history_window :]
        self._prev_action = action
        self._step += 1

        terminated = False
        truncated = self._step >= self.config.episode_steps
        self._last_metrics = {
            "supply": supply,
            "demand": demand,
            "effective_demand": effective_demand,
            "matched_energy": matched_energy,
            "unmet_demand": unmet_demand,
            "liquidity": self._liquidity,
            "token_price": self._token_price,
            "max_drawdown": self._max_drawdown,
            "volume": self._episode_volume,
            "reward_ratio": reward_ratio,
            "liquidity_ratio": liquidity_ratio,
            "burn_rate": burn_rate,
            "action_oscillation": action_oscillation,
            "liquidity_shortfall": liquidity_shortfall,
            "excess_drawdown": excess_drawdown,
        }
        return self._observation(), float(reward), terminated, truncated, dict(self._last_metrics)

    def _sanitize_action(self, action: np.ndarray) -> np.ndarray:
        action = np.nan_to_num(action, nan=0.0, posinf=1.0, neginf=0.0)
        action = np.clip(action, 0.0, 1.0)
        reward_ratio = self.config.min_reward_ratio + action[0] * (
            self.config.max_reward_ratio - self.config.min_reward_ratio
        )
        liquidity_ratio = self.config.min_liquidity_ratio + action[1] * (
            self.config.max_liquidity_ratio - self.config.min_liquidity_ratio
        )
        total = reward_ratio + liquidity_ratio
        if total > self.config.max_total_allocation:
            scale = self.config.max_total_allocation / total
            reward_ratio *= scale
            liquidity_ratio *= scale
        burn_rate = action[2] * self.config.max_burn_rate
        actual = np.array([reward_ratio, liquidity_ratio, burn_rate], dtype=np.float32)

        smoothing = float(np.clip(self.config.action_smoothing, 0.0, 0.95))
        if smoothing > 0:
            actual = smoothing * self._prev_action + (1.0 - smoothing) * actual

        max_delta = max(float(self.config.max_action_delta), 0.0)
        if max_delta < 1.0:
            lower = self._prev_action - max_delta
            upper = self._prev_action + max_delta
            actual = np.clip(actual, lower, upper)

        total = float(actual[0] + actual[1])
        if total > self.config.max_total_allocation:
            scale = self.config.max_total_allocation / total
            actual[0] *= scale
            actual[1] *= scale
        return actual.astype(np.float32)

    def _observation(self) -> np.ndarray:
        gap_mean = float(np.mean(self._gaps))
        gap_std = float(np.std(self._gaps))
        liquidity_depth = self._liquidity / max(self.config.initial_liquidity, 1.0)
        volatility = float(np.std(self._returns))
        last_return = float(self._returns[-1] if self._returns else 0.0)
        base_obs = [
            gap_mean,
            gap_std,
            liquidity_depth,
            volatility,
            self._max_drawdown,
            last_return,
            float(self._prev_action[0]),
            float(self._prev_action[1]),
            float(self._prev_action[2]),
        ]
        if not self.config.enhanced_observation:
            obs = np.array(base_obs, dtype=np.float32)
            return np.clip(obs, -5.0, 5.0)

        demand_mean = max(float(np.mean(self._series.demand)), 1.0)  # type: ignore[arg-type,union-attr]
        supply_mean = max(float(np.mean(self._series.supply)), 1.0)  # type: ignore[arg-type,union-attr]
        lookahead_start = self._step
        lookahead_end = min(
            self._step + max(self.config.forecast_window, 1),
            len(self._series.supply),  # type: ignore[union-attr]
        )
        supply_forecast = float(np.mean(self._series.supply[lookahead_start:lookahead_end])) / supply_mean  # type: ignore[index,union-attr]
        demand_forecast = float(np.mean(self._series.demand[lookahead_start:lookahead_end])) / demand_mean  # type: ignore[index,union-attr]
        hour = self._step % 24
        hour_sin = float(np.sin(2.0 * np.pi * hour / 24.0))
        hour_cos = float(np.cos(2.0 * np.pi * hour / 24.0))
        liquidity_trend = 0.0
        if len(self._liquidity_history) >= 2:
            liquidity_trend = (
                self._liquidity_history[-1] - self._liquidity_history[0]
            ) / max(self.config.initial_liquidity, 1.0)
        next_gap = (supply_forecast * supply_mean - demand_forecast * demand_mean) / demand_mean
        daylight = 1.0 if supply_forecast > 0.05 else 0.0
        obs = np.array(
            base_obs
            + [
                hour_sin,
                hour_cos,
                supply_forecast,
                demand_forecast,
                next_gap,
                liquidity_trend,
                daylight,
            ],
            dtype=np.float32,
        )
        return np.clip(obs, -5.0, 5.0)

    def episode_metrics(self) -> dict[str, float]:
        metrics = dict(self._last_metrics)
        metrics.update(
            {
                "episode_volume": self._episode_volume,
                "liquidity_floor": self._liquidity_floor,
                "final_token_price": self._token_price,
                "max_drawdown": self._max_drawdown,
            }
        )
        return metrics

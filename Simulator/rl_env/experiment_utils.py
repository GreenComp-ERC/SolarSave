"""Small helpers for repeatable RL experiments."""

from __future__ import annotations

from datetime import datetime
import json
from pathlib import Path
from typing import Any


def timestamp() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def build_run_dir(base_dir: str | Path, run_name: str | None, timestamp_output: bool) -> Path:
    base = Path(base_dir)
    if timestamp_output:
        name = run_name or "run"
        return base / f"{timestamp()}_{name}"
    if run_name:
        return base / run_name
    return base


def write_json(path: str | Path, payload: dict[str, Any]) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(payload, indent=2), encoding="utf-8")

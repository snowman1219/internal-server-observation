import os
from pathlib import Path

import yaml
from pydantic_settings import BaseSettings

from server.models.config import AppConfig, ServerConfig


class _EnvOverrides(BaseSettings):
    """Environment variable overrides for top-level config fields."""

    poll_interval_seconds: int | None = None
    ssh_timeout_seconds: int | None = None
    ssh_key_path: str | None = None

    model_config = {"extra": "ignore"}


def load_config() -> AppConfig:
    """Load config from YAML file with environment variable overrides."""
    config_path = Path(os.getenv("CONFIG_PATH", "./config.yaml"))
    with config_path.open() as f:
        raw = yaml.safe_load(f)

    config = AppConfig(
        poll_interval_seconds=raw.get("poll_interval_seconds", 30),
        ssh_timeout_seconds=raw.get("ssh_timeout_seconds", 5),
        ssh_key_path=raw.get("ssh_key_path", "~/.ssh/id_rsa"),
        servers=[ServerConfig(**s) for s in raw["servers"]],
    )

    # Apply environment variable overrides
    env = _EnvOverrides()
    if env.poll_interval_seconds is not None:
        config.poll_interval_seconds = env.poll_interval_seconds
    if env.ssh_timeout_seconds is not None:
        config.ssh_timeout_seconds = env.ssh_timeout_seconds
    if env.ssh_key_path is not None:
        config.ssh_key_path = env.ssh_key_path

    return config

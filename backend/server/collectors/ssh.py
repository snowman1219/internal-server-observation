import logging
from pathlib import Path

import asyncssh

from server.models.config import AppConfig, ServerConfig

logger = logging.getLogger(__name__)


async def connect(
    server: ServerConfig,
    config: AppConfig,
) -> asyncssh.SSHClientConnection:
    """Create an SSH connection to the given server.

    Uses the server-specific key if set, otherwise the global key.
    Resolves 'localhost' to '127.0.0.1'.
    """
    host = "127.0.0.1" if server.host == "localhost" else server.host
    key_path = server.ssh_key_path or config.ssh_key_path
    resolved_key = str(Path(key_path).expanduser())  # noqa: ASYNC240

    logger.debug("Connecting to %s@%s:%d", server.ssh_user, host, server.ssh_port)

    return await asyncssh.connect(
        host=host,
        port=server.ssh_port,
        username=server.ssh_user,
        client_keys=[resolved_key],
        known_hosts=None,
        login_timeout=config.ssh_timeout_seconds,
    )

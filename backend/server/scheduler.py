import asyncio
import logging
from datetime import UTC, datetime

from server.collectors import ssh
from server.collectors.parsers import cpu_memory, disk, gpu, processes, tmux
from server.collectors.runner import run_all_commands
from server.models.config import AppConfig, ServerConfig
from server.models.status import DiskUsage, GpuStatus, ServerStatus
from server.store import StatusStore

logger = logging.getLogger(__name__)


async def poll_loop(config: AppConfig, store: StatusStore) -> None:
    """Background polling loop that collects data from all servers."""
    while True:
        tasks = [collect_server(server, config, store) for server in config.servers]
        await asyncio.gather(*tasks, return_exceptions=True)
        await asyncio.sleep(config.poll_interval_seconds)


async def collect_server(
    server: ServerConfig,
    config: AppConfig,
    store: StatusStore,
) -> None:
    """Collect status from a single server via SSH."""
    try:
        conn = await ssh.connect(server, config)
    except Exception as e:  # noqa: BLE001
        logger.warning("SSH connection failed for %s: %s", server.name, e)
        await store.update(
            server.name,
            ServerStatus(
                server_name=server.name,
                host=server.host,
                is_online=False,
                last_updated_at=datetime.now(UTC),
                error=str(e),
            ),
        )
        return

    try:
        async with conn:
            sections = await run_all_commands(conn)

        # Parse all sections
        cpu_mem = cpu_memory.parse(
            raw_free=sections.get("free", ""),
            raw_nproc=sections.get("nproc", ""),
            raw_uptime=sections.get("uptime", ""),
        )
        proc_summary = processes.parse(sections.get("ps", ""))

        filesystems = disk.parse_df(sections.get("df", ""))
        user_home = disk.parse_du(sections.get("du", ""))
        disk_usage = (
            DiskUsage(filesystems=filesystems or [], user_home=user_home or [])
            if filesystems is not None or user_home is not None
            else None
        )

        tmux_sessions = tmux.parse(sections.get("tmux", ""))

        gpu_infos = gpu.parse_info(sections.get("gpu_info", ""))
        gpu_procs = gpu.parse_procs(
            raw_procs=sections.get("gpu_procs", ""),
            raw_pid_map=sections.get("gpu_pid_map", ""),
        )
        gpu_status = GpuStatus(gpus=gpu_infos, gpu_processes=gpu_procs) if gpu_infos is not None else None

        status = ServerStatus(
            server_name=server.name,
            host=server.host,
            is_online=True,
            last_updated_at=datetime.now(UTC),
            cpu_memory_overview=cpu_mem,
            process_summary=proc_summary,
            disk_usage=disk_usage,
            tmux_sessions=tmux_sessions,
            gpu_status=gpu_status,
        )

        await store.update(server.name, status)
        logger.info("Collected status for %s", server.name)

    except Exception as e:  # noqa: BLE001
        logger.exception("Failed to collect data from %s", server.name)
        await store.update(
            server.name,
            ServerStatus(
                server_name=server.name,
                host=server.host,
                is_online=False,
                last_updated_at=datetime.now(UTC),
                error=str(e),
            ),
        )

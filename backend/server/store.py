import asyncio

from server.models.responses import ServerSummary
from server.models.status import ServerStatus

# System users to exclude from active_users
_SYSTEM_USERS = frozenset(
    {
        "root",
        "daemon",
        "bin",
        "sys",
        "sync",
        "games",
        "man",
        "lp",
        "mail",
        "news",
        "uucp",
        "proxy",
        "www-data",
        "backup",
        "list",
        "irc",
        "gnats",
        "nobody",
        "systemd-network",
        "systemd-resolve",
        "systemd-timesync",
        "messagebus",
        "syslog",
        "avahi",
        "colord",
        "hplip",
        "kernoops",
        "nm-openvpn",
        "rtkit",
        "saned",
        "usbmux",
        "whoopsie",
        "dnsmasq",
        "cups-pk-helper",
        "pulse",
        "geoclue",
        "gdm",
        "sssd",
        "chrony",
        "sshd",
        "ntp",
        "postfix",
        "polkitd",
        "tcpdump",
        "_apt",
        "statd",
        "crontab",
    }
)


class StatusStore:
    def __init__(self) -> None:
        self._snapshots: dict[str, ServerStatus] = {}
        self._lock = asyncio.Lock()

    async def update(self, server_name: str, status: ServerStatus) -> None:
        """Replace snapshot for a server."""
        async with self._lock:
            self._snapshots[server_name] = status

    async def get(self, server_name: str) -> ServerStatus | None:
        """Get snapshot for a specific server."""
        async with self._lock:
            return self._snapshots.get(server_name)

    async def get_all_summaries(self) -> list[ServerSummary]:
        """Get summary info for all servers."""
        async with self._lock:
            return [_build_summary(status) for status in self._snapshots.values()]


def _build_summary(status: ServerStatus) -> ServerSummary:
    """Build a ServerSummary from a ServerStatus."""
    if not status.is_online:
        return ServerSummary(
            name=status.server_name,
            host=status.host,
            is_online=False,
            last_updated_at=status.last_updated_at,
            error=status.error,
        )

    active_users = _collect_active_users(status)
    cpu_used_percent = _calc_cpu_used_percent(status)
    memory_used_percent = status.cpu_memory_overview.memory_used_percent if status.cpu_memory_overview else None
    disk_max_used_percent = (
        max(fs.used_percent for fs in status.disk_usage.filesystems)
        if status.disk_usage and status.disk_usage.filesystems
        else None
    )
    gpu_max_utilization_percent = (
        max(g.utilization_percent for g in status.gpu_status.gpus)
        if status.gpu_status and status.gpu_status.gpus
        else None
    )

    return ServerSummary(
        name=status.server_name,
        host=status.host,
        is_online=True,
        last_updated_at=status.last_updated_at,
        error=status.error,
        active_users=active_users,
        cpu_used_percent=cpu_used_percent,
        memory_used_percent=memory_used_percent,
        disk_max_used_percent=disk_max_used_percent,
        gpu_max_utilization_percent=gpu_max_utilization_percent,
    )


def _collect_active_users(status: ServerStatus) -> list[str]:
    """Collect active (non-system) users from processes and tmux sessions."""
    user_set: set[str] = set()
    if status.process_summary:
        for pu in status.process_summary.per_user:
            if pu.user not in _SYSTEM_USERS:
                user_set.add(pu.user)
    if status.tmux_sessions:
        for ts in status.tmux_sessions:
            if ts.user not in _SYSTEM_USERS:
                user_set.add(ts.user)
    return sorted(user_set)


def _calc_cpu_used_percent(status: ServerStatus) -> float | None:
    """Calculate CPU used percent: total CPU% / cpu_count."""
    if not status.cpu_memory_overview or not status.process_summary:
        return None
    total_cpu = sum(pu.cpu_percent for pu in status.process_summary.per_user)
    cpu_count = status.cpu_memory_overview.cpu_count
    if cpu_count <= 0:
        return 0.0
    return round(total_cpu / cpu_count, 1)

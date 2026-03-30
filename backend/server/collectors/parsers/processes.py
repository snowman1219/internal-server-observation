import logging
from collections import defaultdict

from server.models.status import ProcessSummary, TopProcess, UserProcessSummary

logger = logging.getLogger(__name__)

# Standard Linux UID range for regular (human) users.
_UID_MIN = 1000
_UID_MAX = 60000


def _is_regular_user(uid: int) -> bool:
    return _UID_MIN <= uid < _UID_MAX


def parse(raw: str) -> ProcessSummary | None:
    """Parse `ps -eo uid,user:32,pid,%cpu,%mem,command --no-headers` output.

    Returns None if raw is empty or parsing fails.
    """
    if not raw or not raw.strip():
        return None

    try:
        user_cpu: dict[str, float] = defaultdict(float)
        user_mem: dict[str, float] = defaultdict(float)
        total_cpu = 0.0
        all_processes: list[TopProcess] = []

        for line in raw.strip().splitlines():
            parts = line.split(None, 5)
            if len(parts) < 6:  # noqa: PLR2004
                continue

            uid = int(parts[0])
            user = parts[1]
            pid = int(parts[2])
            cpu_percent = float(parts[3])
            mem_percent = float(parts[4])
            command = parts[5]

            total_cpu += cpu_percent

            # Only aggregate regular (human) users for per_user summary
            if _is_regular_user(uid):
                user_cpu[user] += cpu_percent
                user_mem[user] += mem_percent

            if _is_regular_user(uid):
                all_processes.append(
                    TopProcess(
                        user=user,
                        pid=pid,
                        cpu_percent=cpu_percent,
                        memory_percent=mem_percent,
                        command=command,
                    )
                )

        # Per-user summary sorted by CPU% descending (regular users only)
        per_user = sorted(
            [
                UserProcessSummary(
                    user=user,
                    cpu_percent=round(user_cpu[user], 1),
                    memory_percent=round(user_mem[user], 1),
                )
                for user in user_cpu
            ],
            key=lambda x: x.cpu_percent,
            reverse=True,
        )

        # Top 5 processes by CPU%
        top_processes = sorted(all_processes, key=lambda x: x.cpu_percent, reverse=True)[:5]

        return ProcessSummary(
            per_user=per_user,
            top_processes=top_processes,
            total_cpu_percent=round(total_cpu, 1),
        )
    except Exception:
        logger.exception("Failed to parse ps output")
        return None

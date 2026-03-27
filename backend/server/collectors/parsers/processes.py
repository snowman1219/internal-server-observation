import logging
from collections import defaultdict

from server.models.status import ProcessSummary, TopProcess, UserProcessSummary

logger = logging.getLogger(__name__)


def parse(raw: str) -> ProcessSummary | None:
    """Parse `ps aux --no-headers` output into ProcessSummary.

    Returns None if raw is empty or parsing fails.
    """
    if not raw or not raw.strip():
        return None

    try:
        user_cpu: dict[str, float] = defaultdict(float)
        user_mem: dict[str, float] = defaultdict(float)
        all_processes: list[TopProcess] = []

        for line in raw.strip().splitlines():
            parts = line.split(None, 10)
            if len(parts) < 11:  # noqa: PLR2004
                continue

            user = parts[0]
            pid = int(parts[1])
            cpu_percent = float(parts[2])
            mem_percent = float(parts[3])
            command = parts[10]

            user_cpu[user] += cpu_percent
            user_mem[user] += mem_percent

            all_processes.append(
                TopProcess(
                    user=user,
                    pid=pid,
                    cpu_percent=cpu_percent,
                    memory_percent=mem_percent,
                    command=command,
                )
            )

        # Per-user summary sorted by CPU% descending
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

        return ProcessSummary(per_user=per_user, top_processes=top_processes)
    except Exception:
        logger.exception("Failed to parse ps aux output")
        return None

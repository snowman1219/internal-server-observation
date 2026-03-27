import logging

from server.models.status import GpuInfo, GpuProcess

logger = logging.getLogger(__name__)

_NO_GPU = "NO_GPU"


def parse_info(raw: str) -> list[GpuInfo] | None:
    """Parse nvidia-smi GPU info CSV output.

    Format: index, name, utilization.gpu [%], utilization.memory [%],
            memory.used [MiB], memory.total [MiB], temperature.gpu
    Returns None if no GPU or parsing fails.
    """
    if not raw or not raw.strip() or raw.strip() == _NO_GPU:
        return None

    try:
        result: list[GpuInfo] = []
        for line in raw.strip().splitlines():
            parts = [p.strip() for p in line.split(",")]
            if len(parts) < 7:  # noqa: PLR2004
                continue

            index = int(parts[0])
            name = parts[1]
            utilization_percent = int(parts[2].replace("%", "").strip())
            memory_used_raw = parts[4].strip()
            memory_total_raw = parts[5].strip()
            temperature_celsius = int(parts[6])

            # Calculate memory used percent
            mem_used_val = float(memory_used_raw.split()[0])
            mem_total_val = float(memory_total_raw.split()[0])
            memory_used_percent = round(mem_used_val / mem_total_val * 100, 1) if mem_total_val > 0 else 0.0

            result.append(
                GpuInfo(
                    index=index,
                    name=name,
                    utilization_percent=utilization_percent,
                    memory_used=memory_used_raw,
                    memory_total=memory_total_raw,
                    memory_used_percent=memory_used_percent,
                    temperature_celsius=temperature_celsius,
                )
            )
    except Exception:
        logger.exception("Failed to parse nvidia-smi GPU info")
        return None
    else:
        return result or None


def parse_procs(
    raw_procs: str,
    raw_pid_map: str,
) -> list[GpuProcess]:
    """Parse nvidia-smi compute apps CSV + PID-to-user mapping.

    raw_procs format: pid, used_memory [MiB], gpu_name
    raw_pid_map format: pid user (from ps -p <pid> -o pid=,user=)
    Returns empty list if no GPU or parsing fails.
    """
    if not raw_procs or raw_procs.strip() == _NO_GPU:
        return []
    if not raw_pid_map or raw_pid_map.strip() == _NO_GPU:
        raw_pid_map = ""

    try:
        # Build PID -> user map
        pid_user: dict[int, str] = {}
        for line in raw_pid_map.strip().splitlines():
            parts = line.split()
            if len(parts) >= 2:  # noqa: PLR2004
                pid_user[int(parts[0])] = parts[1]

        result: list[GpuProcess] = []
        for line in raw_procs.strip().splitlines():
            parts = [p.strip() for p in line.split(",")]
            if len(parts) < 3:  # noqa: PLR2004
                continue

            pid = int(parts[0])
            used_memory = parts[1].strip()
            gpu_name = parts[2].strip()
            user = pid_user.get(pid, "unknown")

            result.append(
                GpuProcess(
                    gpu_index=0,
                    gpu_name=gpu_name,
                    pid=pid,
                    user=user,
                    used_memory=used_memory,
                )
            )
    except Exception:
        logger.exception("Failed to parse nvidia-smi process info")
        return []
    else:
        return result

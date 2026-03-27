import logging
import re
from dataclasses import dataclass

from server.models.status import CpuMemoryOverview

logger = logging.getLogger(__name__)


@dataclass
class _MemValues:
    memory_total: str
    memory_used: str
    memory_free: str
    memory_available: str
    memory_used_percent: float


@dataclass
class _SwapValues:
    swap_total: str
    swap_used: str
    swap_free: str
    swap_used_percent: float


def parse(raw_free: str, raw_nproc: str, raw_uptime: str) -> CpuMemoryOverview | None:
    """Parse `free -h`, `nproc`, and `uptime` output into CpuMemoryOverview.

    Returns None if any input is empty or parsing fails.
    """
    inputs = [raw_free, raw_nproc, raw_uptime]
    if any(not s or not s.strip() for s in inputs):
        return None

    try:
        cpu_count = int(raw_nproc.strip())
        load_averages = _parse_load_averages(raw_uptime)
        if load_averages is None:
            return None

        mem = _parse_free_mem(raw_free)
        if mem is None:
            return None

        swap = _parse_free_swap(raw_free)

        return CpuMemoryOverview(
            cpu_count=cpu_count,
            load_average_1m=load_averages[0],
            load_average_5m=load_averages[1],
            load_average_15m=load_averages[2],
            memory_total=mem.memory_total,
            memory_used=mem.memory_used,
            memory_free=mem.memory_free,
            memory_available=mem.memory_available,
            memory_used_percent=mem.memory_used_percent,
            swap_total=swap.swap_total,
            swap_used=swap.swap_used,
            swap_free=swap.swap_free,
            swap_used_percent=swap.swap_used_percent,
        )
    except Exception:
        logger.exception("Failed to parse cpu/memory info")
        return None


def _parse_load_averages(raw_uptime: str) -> tuple[float, float, float] | None:
    """Extract load averages from uptime output."""
    match = re.search(r"load average:\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)", raw_uptime)
    if not match:
        return None
    return float(match.group(1)), float(match.group(2)), float(match.group(3))


def _parse_free_mem(raw_free: str) -> _MemValues | None:
    """Parse the Mem: line from free -h output."""
    for line in raw_free.strip().splitlines():
        if line.startswith("Mem:"):
            parts = line.split()
            if len(parts) < 7:  # noqa: PLR2004
                return None
            total_val = _parse_size_to_bytes(parts[1])
            avail_val = _parse_size_to_bytes(parts[6])
            used_pct = round((total_val - avail_val) / total_val * 100, 1) if total_val > 0 else 0.0
            return _MemValues(
                memory_total=parts[1],
                memory_used=parts[2],
                memory_free=parts[3],
                memory_available=parts[6],
                memory_used_percent=used_pct,
            )
    return None


def _parse_free_swap(raw_free: str) -> _SwapValues:
    """Parse the Swap: line from free -h output."""
    for line in raw_free.strip().splitlines():
        if line.startswith("Swap:"):
            parts = line.split()
            if len(parts) >= 4:  # noqa: PLR2004
                total_val = _parse_size_to_bytes(parts[1])
                used_val = _parse_size_to_bytes(parts[2])
                used_pct = round(used_val / total_val * 100, 1) if total_val > 0 else 0.0
                return _SwapValues(
                    swap_total=parts[1],
                    swap_used=parts[2],
                    swap_free=parts[3],
                    swap_used_percent=used_pct,
                )
    return _SwapValues(swap_total="0", swap_used="0", swap_free="0", swap_used_percent=0.0)


def _parse_size_to_bytes(size_str: str) -> float:
    """Parse human-readable size string to bytes (approximate).

    Handles suffixes: Ki/K, Mi/M, Gi/G, Ti/T, B
    """
    size_str = size_str.strip()
    if not size_str or size_str == "0":
        return 0.0

    multipliers = {
        "Ti": 1024**4,
        "T": 1024**4,
        "Gi": 1024**3,
        "G": 1024**3,
        "Mi": 1024**2,
        "M": 1024**2,
        "Ki": 1024,
        "K": 1024,
        "B": 1,
    }

    for suffix, multiplier in multipliers.items():
        if size_str.endswith(suffix):
            num_str = size_str[: -len(suffix)]
            return float(num_str) * multiplier

    return float(size_str)

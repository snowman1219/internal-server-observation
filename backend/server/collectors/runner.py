import logging

import asyncssh

logger = logging.getLogger(__name__)

_DELIMITER = "===SECTION==="

# Section keys in order
SECTION_KEYS = [
    "ps",
    "df",
    "du",
    "tmux",
    "gpu_info",
    "gpu_procs",
    "gpu_pid_map",
    "free",
    "nproc",
    "uptime",
]

_DELIM_ECHO = f"echo {_DELIMITER}"

# Shell script that collects all metrics in one SSH session.
# Each section is separated by the delimiter for easy parsing.
_COMMANDS = [
    "ps -eo uid,user:32,pid,%cpu,%mem,command --no-headers",
    "df -h --output=source,fstype,size,used,avail,pcent,target",
    "timeout 10 du -sh /home/* 2>/dev/null || true",
    # tmux: enumerate sockets and list sessions per regular user (UID 1000-59999)
    """for dir in /tmp/tmux-*/; do
    [ -d "$dir" ] || continue
    uid=$(basename "$dir" | sed 's/tmux-//')
    [ "$uid" -ge 1000 ] 2>/dev/null && [ "$uid" -lt 60000 ] 2>/dev/null || continue
    user=$(getent passwd "$uid" | cut -d: -f1)
    if [ -n "$user" ]; then
        for sock in "$dir"*; do
            count=$(tmux -S "$sock" list-sessions 2>/dev/null | wc -l)
            windows=$(tmux -S "$sock" list-sessions -F '#{session_windows}' 2>/dev/null | paste -sd+ | bc 2>/dev/null || echo 0)
            [ "$count" -gt 0 ] && echo "$user $count $windows"
        done
    fi
done""",
    "nvidia-smi --query-gpu=index,name,utilization.gpu,utilization.memory,memory.used,memory.total,temperature.gpu --format=csv,noheader 2>/dev/null || echo NO_GPU",
    "nvidia-smi --query-compute-apps=pid,used_memory,gpu_name --format=csv,noheader 2>/dev/null || echo NO_GPU",
    "nvidia-smi --query-compute-apps=pid --format=csv,noheader 2>/dev/null | tr -d ' ' | xargs -I{} ps -p {} -o pid=,user= 2>/dev/null || echo NO_GPU",
    "free -h",
    "nproc",
    "uptime",
]

_SCRIPT = f"\n{_DELIM_ECHO}\n".join(_COMMANDS)


async def run_all_commands(conn: asyncssh.SSHClientConnection) -> dict[str, str]:
    """Run all monitoring commands in a single SSH session.

    Returns a dict mapping section keys to their raw output strings.
    """
    result = await conn.run("bash -s", input=_SCRIPT, check=False)
    stdout = str(result.stdout) if result.stdout else ""

    sections = stdout.split(_DELIMITER)
    output: dict[str, str] = {}

    for i, key in enumerate(SECTION_KEYS):
        if i < len(sections):
            output[key] = sections[i].strip()
        else:
            output[key] = ""

    return output

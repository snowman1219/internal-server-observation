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

# Shell script that collects all metrics in one SSH session.
# Each section is separated by the delimiter for easy parsing.
_SCRIPT = (
    "ps aux --no-headers\n"
    f"echo '{_DELIMITER}'\n"
    "df -h --output=source,fstype,size,used,avail,pcent,target\n"
    f"echo '{_DELIMITER}'\n"
    "timeout 10 du -sh /home/* 2>/dev/null\n"
    f"echo '{_DELIMITER}'\n"
    "for dir in /tmp/tmux-*/; do\n"
    "    uid=$(basename \"$dir\" | sed 's/tmux-//')\n"
    '    user=$(getent passwd "$uid" | cut -d: -f1)\n'
    '    if [ -n "$user" ]; then\n'
    '        for sock in "$dir"*; do\n'
    '            count=$(tmux -S "$sock" list-sessions 2>/dev/null | wc -l)\n'
    "            windows=$(tmux -S \"$sock\" list-sessions -F '#{session_windows}' "
    "2>/dev/null | paste -sd+ | bc 2>/dev/null || echo 0)\n"
    '            [ "$count" -gt 0 ] && echo "$user $count $windows"\n'
    "        done\n"
    "    fi\n"
    "done\n"
    f"echo '{_DELIMITER}'\n"
    "nvidia-smi --query-gpu=index,name,utilization.gpu,utilization.memory,"
    "memory.used,memory.total,temperature.gpu "
    "--format=csv,noheader 2>/dev/null || echo 'NO_GPU'\n"
    f"echo '{_DELIMITER}'\n"
    "nvidia-smi --query-compute-apps=pid,used_memory,gpu_name "
    "--format=csv,noheader 2>/dev/null || echo 'NO_GPU'\n"
    f"echo '{_DELIMITER}'\n"
    "nvidia-smi --query-compute-apps=pid --format=csv,noheader 2>/dev/null "
    "| tr -d ' ' | xargs -I{} ps -p {} -o pid=,user= 2>/dev/null || echo 'NO_GPU'\n"
    f"echo '{_DELIMITER}'\n"
    "free -h\n"
    f"echo '{_DELIMITER}'\n"
    "nproc\n"
    f"echo '{_DELIMITER}'\n"
    "uptime"
)


async def run_all_commands(conn: asyncssh.SSHClientConnection) -> dict[str, str]:
    """Run all monitoring commands in a single SSH session.

    Returns a dict mapping section keys to their raw output strings.
    """
    result = await conn.run(_SCRIPT, check=False)
    stdout = str(result.stdout) if result.stdout else ""

    sections = stdout.split(_DELIMITER)
    output: dict[str, str] = {}

    for i, key in enumerate(SECTION_KEYS):
        if i < len(sections):
            output[key] = sections[i].strip()
        else:
            output[key] = ""

    return output

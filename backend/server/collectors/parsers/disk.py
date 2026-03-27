import logging
from pathlib import PurePosixPath

from server.models.status import FilesystemUsage, UserHomeUsage

logger = logging.getLogger(__name__)


def parse_df(raw: str) -> list[FilesystemUsage] | None:
    """Parse `df -h --output=source,fstype,size,used,avail,pcent,target` output.

    Returns None if raw is empty or parsing fails.
    """
    if not raw or not raw.strip():
        return None

    try:
        lines = raw.strip().splitlines()
        # Skip header line
        result: list[FilesystemUsage] = []
        for line in lines[1:]:
            parts = line.split()
            if len(parts) < 7:  # noqa: PLR2004
                continue

            # pcent field is like "67%" -- strip the %
            used_percent_str = parts[5].rstrip("%")
            used_percent = float(used_percent_str)

            result.append(
                FilesystemUsage(
                    source=parts[0],
                    fstype=parts[1],
                    size=parts[2],
                    used=parts[3],
                    available=parts[4],
                    used_percent=used_percent,
                    mount_point=parts[6],
                )
            )
    except Exception:
        logger.exception("Failed to parse df output")
        return None
    else:
        return result


def parse_du(raw: str) -> list[UserHomeUsage] | None:
    """Parse `du -sh /home/*` output.

    Returns None if raw is empty or parsing fails.
    """
    if not raw or not raw.strip():
        return None

    try:
        result: list[UserHomeUsage] = []
        for line in raw.strip().splitlines():
            parts = line.split("\t", 1)
            if len(parts) < 2:  # noqa: PLR2004
                continue

            size = parts[0].strip()
            path = parts[1].strip()

            # Extract username from /home/<user>
            user = PurePosixPath(path).name

            result.append(UserHomeUsage(user=user, size=size))
    except Exception:
        logger.exception("Failed to parse du output")
        return None
    else:
        return result

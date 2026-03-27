import logging

from server.models.status import TmuxUserSummary

logger = logging.getLogger(__name__)


def parse(raw: str) -> list[TmuxUserSummary] | None:
    """Parse tmux script output into list of TmuxUserSummary.

    Expected format: `user session_count window_count` per line.
    Returns None if raw is empty or parsing fails.
    """
    if not raw or not raw.strip():
        return None

    try:
        result: list[TmuxUserSummary] = []
        for line in raw.strip().splitlines():
            parts = line.split()
            if len(parts) < 3:  # noqa: PLR2004
                continue

            result.append(
                TmuxUserSummary(
                    user=parts[0],
                    session_count=int(parts[1]),
                    window_count=int(parts[2]),
                )
            )
    except Exception:
        logger.exception("Failed to parse tmux output")
        return None
    else:
        return result or None

interface StaleBadgeProps {
  lastUpdatedAt: string;
}

function getMinutesAgo(isoDate: string): number {
  const updatedAt = new Date(isoDate).getTime();
  const now = Date.now();
  return Math.floor((now - updatedAt) / 1000 / 60);
}

export function StaleBadge({ lastUpdatedAt }: StaleBadgeProps) {
  const secondsAgo = Math.floor(
    (Date.now() - new Date(lastUpdatedAt).getTime()) / 1000,
  );

  if (secondsAgo <= 120) {
    return null;
  }

  const minutesAgo = getMinutesAgo(lastUpdatedAt);

  return (
    <span data-testid="stale-badge" className="inline-flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-200">
      <span>&#9888;</span>
      データが古い可能性があります（{minutesAgo}分前に更新）
    </span>
  );
}

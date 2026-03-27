interface HeaderProps {
  lastUpdatedAt?: string;
}

function formatTimeAgo(isoDate: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(isoDate).getTime()) / 1000,
  );
  if (seconds < 60) return `${seconds}秒前`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}分前`;
}

export function Header({ lastUpdatedAt }: HeaderProps) {
  return (
    <header className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-bold">Server Monitor</h1>
      {lastUpdatedAt && (
        <span className="text-sm text-gray-300">
          最終更新: {formatTimeAgo(lastUpdatedAt)}
        </span>
      )}
    </header>
  );
}

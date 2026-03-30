import type { TmuxUserSummary } from "../../lib/api/generated/models";

interface TmuxCardProps {
  data: TmuxUserSummary[] | null;
}

export function TmuxCard({ data }: TmuxCardProps) {
  return (
    <div data-testid="tmux-card" className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">tmux セッション</h3>
      {data == null ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm">データなし</p>
      ) : data.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm">アクティブなセッションなし</p>
      ) : (
        <div className="space-y-2">
          {data.map((user) => (
            <div
              key={user.user}
              className="flex justify-between items-center text-sm"
            >
              <span className="font-medium text-gray-700 dark:text-gray-200">{user.user}</span>
              <span className="text-gray-500 dark:text-gray-400">
                {user.session_count} セッション / {user.window_count} ウィンドウ
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

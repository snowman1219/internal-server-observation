import type { TmuxUserSummary } from "../../lib/api/generated/models";

interface TmuxCardProps {
  data: TmuxUserSummary[] | null;
}

export function TmuxCard({ data }: TmuxCardProps) {
  return (
    <div data-testid="tmux-card" className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="font-semibold text-lg mb-4">tmux セッション</h3>
      {data == null ? (
        <p className="text-gray-400 text-sm">データなし</p>
      ) : data.length === 0 ? (
        <p className="text-gray-400 text-sm">アクティブなセッションなし</p>
      ) : (
        <div className="space-y-2">
          {data.map((user) => (
            <div
              key={user.user}
              className="flex justify-between items-center text-sm"
            >
              <span className="font-medium text-gray-700">{user.user}</span>
              <span className="text-gray-500">
                {user.session_count} セッション / {user.window_count} ウィンドウ
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

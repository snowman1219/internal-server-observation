import { useNavigate } from "react-router";
import type { ServerSummary } from "../../lib/api/generated/models";
import { ProgressBar } from "../common/progress-bar";

interface ServerCardProps {
  server: ServerSummary;
}

function formatTimeAgo(isoDate: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(isoDate).getTime()) / 1000,
  );
  if (seconds < 60) return `${seconds}秒前`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}分前`;
}

export function ServerCard({ server }: ServerCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/servers/${server.name}`);
  };

  const isOnline = server.is_online;

  return (
    <div
      data-testid={`server-card-${server.name}`}
      className={`rounded-lg border p-4 cursor-pointer transition-shadow hover:shadow-md ${
        isOnline
          ? "bg-white border-gray-200"
          : "bg-gray-50 border-gray-300 opacity-70"
      }`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg">{server.name}</h3>
        <span
          className={`inline-flex items-center gap-1 text-sm ${
            isOnline ? "text-green-600" : "text-gray-400"
          }`}
        >
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              isOnline ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>

      <p className="text-sm text-gray-500 mb-2">{server.host}</p>

      {server.active_users && server.active_users.length > 0 && (
        <p className="text-xs text-gray-500 mb-2">
          ユーザー: {server.active_users.join(", ")}
        </p>
      )}

      {isOnline && (
        <div className="space-y-2 mt-3">
          {server.cpu_used_percent != null && (
            <ProgressBar
              percent={server.cpu_used_percent}
              label="CPU"
              size="sm"
            />
          )}
          {server.memory_used_percent != null && (
            <ProgressBar
              percent={server.memory_used_percent}
              label="メモリ"
              size="sm"
            />
          )}
          {server.disk_max_used_percent != null && (
            <ProgressBar
              percent={server.disk_max_used_percent}
              label="ディスク"
              size="sm"
            />
          )}
          {server.gpu_max_utilization_percent != null && (
            <ProgressBar
              percent={server.gpu_max_utilization_percent}
              label="GPU"
              size="sm"
            />
          )}
        </div>
      )}

      {server.error && (
        <p className="text-xs text-red-500 mt-2">{server.error}</p>
      )}

      <p className="text-xs text-gray-400 mt-2">
        更新: {formatTimeAgo(server.last_updated_at)}
      </p>
    </div>
  );
}

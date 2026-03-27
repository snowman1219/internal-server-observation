import type { ProcessSummary } from "../../lib/api/generated/models";

interface ProcessSummaryCardProps {
  data: ProcessSummary | null;
}

function getBarColor(percent: number): string {
  if (percent >= 80) return "bg-red-500";
  if (percent >= 60) return "bg-yellow-500";
  return "bg-green-500";
}

export function ProcessSummaryCard({ data }: ProcessSummaryCardProps) {
  return (
    <div data-testid="process-summary-card" className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="font-semibold text-lg mb-4">プロセス / リソース</h3>
      {data == null ? (
        <p className="text-gray-400 text-sm">データなし</p>
      ) : (
        <div className="space-y-4">
          {/* Per-user summary bars */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              ユーザー別リソース使用
            </h4>
            <div className="space-y-2">
              {data.per_user.map((user) => (
                <div key={user.user} className="text-sm">
                  <div className="flex justify-between text-gray-600 mb-0.5">
                    <span className="font-medium">{user.user}</span>
                    <span>
                      CPU {user.cpu_percent.toFixed(1)}% / MEM{" "}
                      {user.memory_percent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getBarColor(user.cpu_percent)}`}
                        style={{
                          width: `${Math.min(100, user.cpu_percent)}%`,
                        }}
                      />
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getBarColor(user.memory_percent)}`}
                        style={{
                          width: `${Math.min(100, user.memory_percent)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 5 processes table */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              上位プロセス
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="text-left py-1 pr-2">ユーザー</th>
                    <th className="text-left py-1 pr-2">コマンド</th>
                    <th className="text-right py-1 pr-2">CPU%</th>
                    <th className="text-right py-1">MEM%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_processes.map((proc) => (
                    <tr
                      key={`${proc.pid}`}
                      className="border-b border-gray-100"
                    >
                      <td className="py-1 pr-2 text-gray-700">{proc.user}</td>
                      <td
                        className="py-1 pr-2 text-gray-600 max-w-[200px] truncate"
                        title={proc.command}
                      >
                        {proc.command}
                      </td>
                      <td className="py-1 pr-2 text-right text-gray-700">
                        {proc.cpu_percent.toFixed(1)}
                      </td>
                      <td className="py-1 text-right text-gray-700">
                        {proc.memory_percent.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

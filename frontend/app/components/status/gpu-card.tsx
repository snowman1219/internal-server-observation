import type { GpuStatus } from "../../lib/api/generated/models";
import { ProgressBar } from "../common/progress-bar";

interface GpuCardProps {
  data: GpuStatus | null;
}

export function GpuCard({ data }: GpuCardProps) {
  if (data == null) {
    return null;
  }

  return (
    <div data-testid="gpu-card" className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">GPU 使用状況</h3>
      <div className="space-y-4">
        {data.gpus.map((gpu) => (
          <div
            key={gpu.index}
            className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-b-0 last:pb-0"
          >
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              GPU {gpu.index}: {gpu.name}
            </p>
            <div className="space-y-2">
              <ProgressBar
                percent={gpu.utilization_percent}
                label="使用率"
                size="sm"
              />
              <ProgressBar
                percent={gpu.memory_used_percent}
                label={`VRAM: ${gpu.memory_used} / ${gpu.memory_total}`}
                size="sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                温度: {gpu.temperature_celsius}°C
              </p>
            </div>
          </div>
        ))}

        {data.gpu_processes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              GPU プロセス
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    <th className="text-left py-1 pr-2">ユーザー</th>
                    <th className="text-left py-1 pr-2">PID</th>
                    <th className="text-left py-1 pr-2">使用VRAM</th>
                    <th className="text-left py-1">GPU</th>
                  </tr>
                </thead>
                <tbody>
                  {data.gpu_processes.map((proc) => (
                    <tr
                      key={`${proc.pid}-${proc.gpu_index}`}
                      className="border-b border-gray-100 dark:border-gray-700"
                    >
                      <td className="py-1 pr-2 text-gray-700 dark:text-gray-200">{proc.user}</td>
                      <td className="py-1 pr-2 text-gray-600 dark:text-gray-300 font-mono">
                        {proc.pid}
                      </td>
                      <td className="py-1 pr-2 text-gray-600 dark:text-gray-300 font-mono">
                        {proc.used_memory}
                      </td>
                      <td className="py-1 text-gray-600 dark:text-gray-300">
                        GPU {proc.gpu_index}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

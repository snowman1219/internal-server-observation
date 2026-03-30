import type { CpuMemoryOverview } from "../../lib/api/generated/models";
import { ProgressBar } from "../common/progress-bar";

interface CpuMemoryCardProps {
  data: CpuMemoryOverview | null;
  cpuUsedPercent: number | null;
}

export function CpuMemoryCard({ data, cpuUsedPercent }: CpuMemoryCardProps) {
  return (
    <div data-testid="cpu-memory-card" className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">CPU / メモリ概況</h3>
      {data == null ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm">データなし</p>
      ) : (
        <div className="space-y-4">
          <div>
            <ProgressBar
              percent={cpuUsedPercent ?? 0}
              label={`CPU: ${data.cpu_count}コア`}
            />
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Load Average: {data.load_average_1m.toFixed(2)} /{" "}
              {data.load_average_5m.toFixed(2)} /{" "}
              {data.load_average_15m.toFixed(2)}
            </p>
          </div>
          <div>
            <ProgressBar
              percent={data.memory_used_percent}
              label={`メモリ: ${data.memory_used} / ${data.memory_total}`}
            />
          </div>
          <div>
            <ProgressBar
              percent={data.swap_used_percent}
              label={`スワップ: ${data.swap_used} / ${data.swap_total}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

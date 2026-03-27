import type { CpuMemoryOverview } from "../../lib/api/generated/models";
import { ProgressBar } from "../common/progress-bar";

interface CpuMemoryCardProps {
  data: CpuMemoryOverview | null;
}

export function CpuMemoryCard({ data }: CpuMemoryCardProps) {
  return (
    <div data-testid="cpu-memory-card" className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="font-semibold text-lg mb-4">CPU / メモリ概況</h3>
      {data == null ? (
        <p className="text-gray-400 text-sm">データなし</p>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">
              CPU: {data.cpu_count}コア
            </p>
            <p className="text-sm text-gray-600">
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

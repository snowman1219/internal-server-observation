import { useParams, useNavigate } from "react-router";
import { Header } from "../components/layout/header";
import { StaleBadge } from "../components/common/stale-badge";
import { ErrorAlert } from "../components/common/error-alert";
import { CpuMemoryCard } from "../components/status/cpu-memory-card";
import { ProcessSummaryCard } from "../components/status/process-summary-card";
import { DiskUsageCard } from "../components/status/disk-usage-card";
import { TmuxCard } from "../components/status/tmux-card";
import { GpuCard } from "../components/status/gpu-card";
import { useServerStatus } from "../lib/hooks/use-server-status";

export default function ServerDetail() {
  const { serverName } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useServerStatus(serverName ?? "");

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header lastUpdatedAt={data?.last_updated_at} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Sub-header */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <button
            type="button"
            data-testid="back-button"
            onClick={() => navigate("/")}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            &larr; 戻る
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{serverName}</h2>
          {data && (
            <>
              <span
                className={`inline-flex items-center gap-1 text-sm ${
                  data.is_online ? "text-green-600" : "text-gray-400"
                }`}
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    data.is_online ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                {data.is_online ? "Online" : "Offline"}
              </span>
              <StaleBadge lastUpdatedAt={data.last_updated_at} />
            </>
          )}
        </div>

        {isLoading && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-12">読み込み中...</p>
        )}

        {error && <ErrorAlert message={String(error.message)} />}

        {data && data.error && <ErrorAlert message={data.error} />}

        {data && (
          <div className="space-y-4">
            {/* 2-column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CpuMemoryCard
                data={data.cpu_memory_overview ?? null}
                cpuUsedPercent={
                  data.process_summary && data.cpu_memory_overview
                    ? Math.round(
                        (data.process_summary.total_cpu_percent / data.cpu_memory_overview.cpu_count) * 10
                      ) / 10
                    : null
                }
              />
              <ProcessSummaryCard data={data.process_summary ?? null} />
              <DiskUsageCard data={data.disk_usage ?? null} />
              <TmuxCard data={data.tmux_sessions ?? null} />
            </div>

            {/* GPU full width */}
            <GpuCard data={data.gpu_status ?? null} />
          </div>
        )}
      </main>
    </div>
  );
}

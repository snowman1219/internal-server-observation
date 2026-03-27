import type { DiskUsage } from "../../lib/api/generated/models";
import { ProgressBar } from "../common/progress-bar";

interface DiskUsageCardProps {
  data: DiskUsage | null;
}

export function DiskUsageCard({ data }: DiskUsageCardProps) {
  return (
    <div data-testid="disk-usage-card" className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="font-semibold text-lg mb-4">ディスク使用状況</h3>
      {data == null ? (
        <p className="text-gray-400 text-sm">データなし</p>
      ) : (
        <div className="space-y-4">
          {/* Filesystem usage */}
          <div className="space-y-3">
            {data.filesystems.map((fs) => (
              <div key={`${fs.source}-${fs.mount_point}`}>
                <p className="text-xs text-gray-500 mb-1">
                  {fs.source} ({fs.mount_point})
                </p>
                <ProgressBar
                  percent={fs.used_percent}
                  label={`${fs.used} / ${fs.size}`}
                  size="sm"
                />
              </div>
            ))}
          </div>

          {/* User home usage */}
          {data.user_home.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                ユーザー別ホームディレクトリ
              </h4>
              <div className="space-y-1">
                {data.user_home.map((uh) => (
                  <div
                    key={uh.user}
                    className="flex justify-between text-sm text-gray-600"
                  >
                    <span>{uh.user}</span>
                    <span className="font-mono">{uh.size}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

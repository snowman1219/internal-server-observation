interface ProgressBarProps {
  percent: number;
  label?: string;
  size?: "sm" | "md";
}

function getColorClass(percent: number): string {
  if (percent >= 80) return "bg-red-500";
  if (percent >= 60) return "bg-yellow-500";
  return "bg-green-500";
}

export function ProgressBar({ percent, label, size = "md" }: ProgressBarProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const heightClass = size === "sm" ? "h-2" : "h-4";

  return (
    <div className="w-full" data-testid="progress-bar">
      {label && (
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
          <span>{label}</span>
          <span>{clampedPercent.toFixed(1)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${heightClass}`}>
        <div
          className={`${heightClass} rounded-full ${getColorClass(clampedPercent)}`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
}

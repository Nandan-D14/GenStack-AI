import { StatusDot } from "./StatusDot";

type Status = "queued" | "generating" | "done" | "failed";

const labels: Record<Status, string> = {
  queued: "Queued",
  generating: "Generating",
  done: "Done",
  failed: "Failed",
};

const mapStatus = (s: Status) =>
  s === "generating" ? "running" : s === "queued" ? "queued" : s;

export function TaskRow({
  title,
  subtitle,
  status,
  index,
}: {
  title: string;
  subtitle?: string;
  status: Status;
  index?: number;
}) {
  return (
    <div className="gs-task-row animate-gs-fade-in">
      <StatusDot status={mapStatus(status)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {typeof index === "number" && (
            <span className="text-[11px] text-gs-muted font-mono tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
          <span className="text-sm text-gs-text truncate">{title}</span>
        </div>
        {subtitle && <p className="text-[11px] text-gs-muted truncate mt-0.5">{subtitle}</p>}
      </div>
      <span
        className={`text-[11px] font-medium ${
          status === "done"
            ? "text-emerald-400"
            : status === "failed"
              ? "text-rose-400"
              : status === "generating"
                ? "text-gs-accent-text"
                : "text-gs-muted"
        }`}
      >
        {labels[status]}
      </span>
    </div>
  );
}

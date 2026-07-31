type Status = "idle" | "running" | "done" | "failed" | "queued";

const colors: Record<Status, string> = {
  idle: "bg-gs-muted",
  queued: "bg-gs-muted",
  running: "bg-gs-accent animate-gs-pulse",
  done: "bg-gs-success",
  failed: "bg-gs-danger",
};

export function StatusDot({ status = "idle" }: { status?: Status }) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${colors[status]}`} />;
}

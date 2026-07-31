export function ContextCard({
  source,
  text,
  index,
}: {
  source: string;
  text: string;
  index?: number;
}) {
  return (
    <div className="gs-context-card animate-gs-fade-in">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="material-symbols-outlined text-[14px] text-gs-info">menu_book</span>
        <span className="text-[11px] font-medium text-gs-text truncate">
          {typeof index === "number" ? `[${index + 1}] ` : ""}
          {source}
        </span>
      </div>
      <p className="line-clamp-3 leading-relaxed">{text}</p>
    </div>
  );
}

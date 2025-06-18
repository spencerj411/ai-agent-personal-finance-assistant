import type { ChatSource } from "@/types/chat";

interface SourcesDisplayProps {
  sources: ChatSource[];
}

export default function SourcesDisplay({ sources }: SourcesDisplayProps) {
  if (!sources.length) return null;

  return (
    <div className="w-full max-w-xs lg:max-w-md mb-2">
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source, index) => (
          <div key={source.id} className="group relative inline-flex">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 bg-muted/50 hover:bg-muted text-xs rounded-md border border-border/50 hover:border-border transition-all"
            >
              <span className="text-muted-foreground">📄</span>
              <span className="max-w-[150px] truncate">{source.title}</span>
              {source.relevancy && (
                <span className="text-[10px] text-muted-foreground">
                  {Math.round(source.relevancy * 100)}%
                </span>
              )}
            </a>

            {/* Tooltip with full content on hover */}
            <div className="absolute bottom-full left-0 mb-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-10 w-80">
              <div className="bg-popover text-popover-foreground rounded-lg shadow-lg border border-border p-3">
                <div className="text-xs font-medium mb-1">{source.title}</div>
                <div className="text-xs text-muted-foreground whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {source.snippet}
                </div>
                <div className="absolute bottom-[-6px] left-4 w-3 h-3 bg-popover border-r border-b border-border transform rotate-45"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

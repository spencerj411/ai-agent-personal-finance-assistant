import type { ChatSource } from "@/types/chat";

interface SourcesDisplayProps {
  sources: ChatSource[];
}

export default function SourcesDisplay({ sources }: SourcesDisplayProps) {
  if (!sources.length) return null;

  return (
    <div className="w-full max-w-xs lg:max-w-md space-y-2">
      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1 px-1">
        <span>📚</span>
        Sources ({sources.length})
      </div>
      <div className="grid gap-2">
        {sources.map((source) => (
          <div
            key={source.id}
            className="bg-card border border-border rounded-lg p-3 hover:shadow-sm transition-shadow"
          >
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline line-clamp-1"
            >
              {source.title}
            </a>
            {source.relevancy && (
              <span className="text-xs text-muted-foreground ml-2">
                {Math.round(source.relevancy * 100)}% relevant
              </span>
            )}
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {source.snippet}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageIndicatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PageIndicator = ({
  currentPage,
  totalPages,
  onPageChange,
}: PageIndicatorProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-card/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-border shadow-lg z-50">
      <button
        onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0}
        className={cn(
          "p-1 rounded-full transition-colors",
          currentPage === 0
            ? "text-muted-foreground/30 cursor-not-allowed"
            : "text-foreground hover:bg-muted"
        )}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => onPageChange(i)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              i === currentPage
                ? "bg-primary w-6"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
        disabled={currentPage === totalPages - 1}
        className={cn(
          "p-1 rounded-full transition-colors",
          currentPage === totalPages - 1
            ? "text-muted-foreground/30 cursor-not-allowed"
            : "text-foreground hover:bg-muted"
        )}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

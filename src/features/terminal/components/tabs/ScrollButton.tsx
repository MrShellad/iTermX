import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

interface ScrollButtonProps {
  dir: 'left' | 'right';
  onClick: () => void;
}

export const ScrollButton = ({ dir, onClick }: ScrollButtonProps) => (
    <button
        onClick={onClick}
        className={clsx(
          "h-8 w-6 flex items-center justify-center transition-colors duration-200 shrink-0 z-20 rounded-md my-1",
          "hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500",
          "app-region-no-drag" 
        )}
    >
        {dir === 'left' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
    </button>
);
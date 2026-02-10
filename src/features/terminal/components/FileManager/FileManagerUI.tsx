// src/features/terminal/components/FileManager/FileManagerUI.tsx
import { AlertTriangle } from "lucide-react";

export const LoadingOverlay = () => (
  <div className="absolute inset-0 z-20 bg-white/50 dark:bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center pointer-events-none transition-opacity duration-200">
      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export const ErrorBar = ({ error, onRetry }: { error: string, onRetry: () => void }) => (
  <div className="p-2 text-center text-red-500 text-xs bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/20 shrink-0 flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
      <AlertTriangle className="w-3 h-3" />
      <span className="truncate max-w-[80%]">{error}</span>
      <button onClick={onRetry} className="text-blue-500 hover:underline font-medium">
          Retry
      </button>
  </div>
);
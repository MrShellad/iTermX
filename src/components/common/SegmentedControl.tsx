import { clsx } from "clsx";
import { motion } from "framer-motion";

interface Option<T> {
  value: T;
  label: string | React.ReactNode;
}

interface SegmentedControlProps<T> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) => {
  return (
    <div className={clsx("flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg", className)}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={clsx(
              "relative flex-1 flex items-center justify-center py-1.5 text-sm font-medium transition-colors z-10",
              isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="segmented-bg"
                className="absolute inset-0 bg-white dark:bg-slate-700 shadow-sm rounded-md border border-slate-200/50 dark:border-white/5 -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
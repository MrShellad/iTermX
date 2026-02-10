import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Code2, Search, X, Filter, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    Popover, 
    PopoverContent, 
    PopoverTrigger 
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// 🟢 引入逻辑 Hook
import { useSnippetLibrary } from "../../application/useSnippetLibrary";

interface Props {
  onSnippetSelect: (code: string, autoRun: boolean) => void;
}

export const SnippetLibraryPopover = ({ onSnippetSelect }: Props) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // 🟢 使用 Hook 获取数据和逻辑
  const {
    isLoading,
    snippets,
    allTags,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    autoRun,
    setAutoRun
  } = useSnippetLibrary(isOpen);

  const handleSelect = (code: string) => {
      onSnippetSelect(code, autoRun);
      if (!autoRun) {
          // 如果不是自动运行，通常意味着需要编辑，关闭弹窗
          setIsOpen(false);
      } else {
          // 自动运行后也关闭弹窗
          setIsOpen(false);
      }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
         <Tooltip>
             <TooltipTrigger asChild>
                 <PopoverTrigger asChild>
                     <Button 
                         size="icon" 
                         variant="ghost" 
                         className={clsx(
                             "shrink-0 transition-colors",
                             isOpen 
                                 ? "text-blue-400 bg-blue-400/10" 
                                 : "text-slate-400 hover:text-white hover:bg-white/10" 
                         )}
                     >
                         <Code2 className="w-4 h-4" />
                     </Button>
                 </PopoverTrigger>
             </TooltipTrigger>
             <TooltipContent>{t('cmd.library', 'Snippets Library')}</TooltipContent>
         </Tooltip>
      </TooltipProvider>

      <PopoverContent 
         className="w-96 p-0 bg-slate-900 border-slate-700 text-slate-200 shadow-2xl flex flex-col max-h-[500px]" 
         side="top" 
         align="start"
         sideOffset={10}
      >
         {/* 顶部控制区 */}
         <div className="p-3 space-y-3 border-b border-slate-700/50 bg-slate-800/30">
             <div className="relative">
                 <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                 <Input 
                     placeholder={t('cmd.searchPlaceholder', 'Search snippets...')}
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="h-8 pl-8 bg-black/20 border-slate-700 text-xs text-white focus-visible:bg-black/40 focus-visible:ring-blue-500/50 focus-visible:border-slate-600"
                 />
                 {searchQuery && (
                     <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-white text-slate-500">
                         <X className="w-3 h-3" />
                     </button>
                 )}
             </div>

             {allTags.length > 0 && (
                 <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1">
                     <Filter className="w-3 h-3 text-slate-500 shrink-0 mr-1" />
                     {allTags.map(tag => (
                         <button
                             key={tag}
                             onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                             className={clsx(
                                 "px-2 py-0.5 text-[10px] rounded-full border transition-colors shrink-0",
                                 selectedTag === tag 
                                     ? "bg-blue-600 border-blue-600 text-white" 
                                     : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                             )}
                         >
                             {tag}
                         </button>
                     ))}
                 </div>
             )}

             <div className="flex items-center gap-2 pt-1">
                 <Checkbox 
                     id="autorun-mode"
                     checked={autoRun}
                     onCheckedChange={(checked) => setAutoRun(checked === true)}
                     className="w-3.5 h-3.5 border-slate-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                 />
                 <label htmlFor="autorun-mode" className="text-xs text-slate-300 cursor-pointer select-none hover:text-white transition-colors">
                     {t('cmd.pasteAndRun', 'Paste & Run immediately')}
                 </label>
             </div>
         </div>

         {/* 列表区域 */}
         <div className="flex-1 overflow-y-auto custom-scrollbar p-1 min-h-[200px]">
             {isLoading ? (
                 <div className="flex justify-center py-10">
                     <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                 </div>
             ) : snippets.length === 0 ? (
                 <div className="text-center py-10 text-xs text-slate-500 flex flex-col items-center gap-2">
                     <Code2 className="w-8 h-8 opacity-20" />
                     {t('cmd.noSnippets', 'No matching snippets')}
                 </div>
             ) : (
                 <div className="space-y-0.5">
                     {snippets.map(snippet => (
                         <button
                             key={snippet.id}
                             onClick={() => handleSelect(snippet.code)}
                             className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:bg-blue-600/90 hover:text-white rounded transition-colors group relative"
                         >
                             <div className="flex items-center justify-between gap-2 mb-0.5">
                                 <span className="truncate font-medium flex-1">{snippet.title}</span>
                                 {snippet.language === 'bash' && (
                                     <span className="text-[9px] font-bold bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-600/50 group-hover:border-white/20 group-hover:text-white">SH</span>
                                 )}
                             </div>
                             <div className="text-[10px] text-slate-500 truncate group-hover:text-blue-100/70 font-mono opacity-80">
                                 {snippet.code.slice(0, 50).replace(/\n/g, ' ')}...
                             </div>
                         </button>
                     ))}
                 </div>
             )}
         </div>
      </PopoverContent>
    </Popover>
  );
};
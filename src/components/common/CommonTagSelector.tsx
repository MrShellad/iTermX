import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslation } from "react-i18next";
import { toast } from "sonner"; // 🟢 [新增] 引入 toast 提示

interface CommonTagSelectorProps {
  value: string[];
  onChange: (tags: string[]) => void;
  allTags?: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  allowCreate?: boolean;
  className?: string;
  maxTags?: number; // 🟢 [新增] 最大标签数量限制
}

export const CommonTagSelector = ({
  value = [],
  onChange,
  allTags = [],
  placeholder,
  searchPlaceholder,
  allowCreate = true,
  className,
  maxTags, // 🟢 [新增] 解构
}: CommonTagSelectorProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const availableTags = useMemo(() => {
    return allTags.filter((tag) => !value.includes(tag));
  }, [allTags, value]);

  // 处理选中
  const handleSelect = (tag: string) => {
    if (value.includes(tag)) {
      // 取消选中：不受限制
      onChange(value.filter((t) => t !== tag));
    } else {
      // 选中：检查限制
      if (maxTags && value.length >= maxTags) {
        toast.warning(t('common.maxTagsWarning', { count: maxTags, defaultValue: `Max ${maxTags} tags allowed.` }));
        return;
      }
      onChange([...value, tag]);
    }
    setInputValue(""); 
  };

  // 处理移除
  const handleRemove = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  // 处理创建
  const handleCreate = () => {
    if (!inputValue.trim()) return;
    
    // 🟢 [新增] 创建前检查限制
    if (maxTags && value.length >= maxTags) {
      toast.warning(t('common.maxTagsWarning', { count: maxTags, defaultValue: `Max ${maxTags} tags allowed.` }));
      return;
    }

    const newTag = inputValue.trim();
    if (!value.includes(newTag)) {
      onChange([...value, newTag]);
    }
    setInputValue("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-[40px] h-auto py-2 px-3 bg-transparent",
            "border-slate-200 dark:border-slate-800",
            className
          )}
        >
          <div className="flex flex-wrap gap-1.5 items-center">
            {value.length > 0 ? (
              value.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="rounded-sm px-1.5 py-0.5 text-xs font-normal bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  {tag}
                  <div
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={() => handleRemove(tag)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </div>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground font-normal">
                {placeholder || t("common.selectTags", "Select tags...")}
              </span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[200]" align="start">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder || t("common.searchTags", "Search tags...")}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty className="py-2 px-4 text-sm">
              {allowCreate && inputValue.trim() ? (
                <div
                  className="flex items-center gap-2 cursor-pointer text-blue-500 hover:text-blue-600"
                  onClick={handleCreate}
                >
                  <Plus className="h-4 w-4" />
                  <span>
                    {t("common.create", "Create")}: "{inputValue}"
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground">
                  {t("common.noTagsFound", "No tags found.")}
                </span>
              )}
            </CommandEmpty>

            <CommandGroup>
              {availableTags.map((tag) => (
                <CommandItem
                  key={tag}
                  value={tag}
                  onSelect={() => handleSelect(tag)}
                  // 🟢 [可选] 当达到上限且未选中时，可以置灰 (但为了 UX 通常保留点击出提示)
                  // disabled={maxTags ? (value.length >= maxTags && !value.includes(tag)) : false}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(tag) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {tag}
                </CommandItem>
              ))}
            </CommandGroup>
            
            {value.length > 0 && availableTags.length > 0 && <CommandSeparator />}
            
            {value.length > 0 && (
              <CommandGroup heading={t("common.selected", "Selected")}>
                {value.map((tag) => (
                  <CommandItem
                    key={tag}
                    value={tag}
                    onSelect={() => handleSelect(tag)}
                    className="bg-slate-50 dark:bg-slate-900"
                  >
                    <Check className="mr-2 h-4 w-4 opacity-100" />
                    {tag}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
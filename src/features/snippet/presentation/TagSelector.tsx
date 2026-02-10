import { useSnippetStore } from "@/features/snippet/store/useSnippetStore";
import { CommonTagSelector } from "@/components/common/CommonTagSelector";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

export const TagSelector = ({
  selectedTags,
  onChange,
  className,
}: TagSelectorProps) => {
  const { t } = useTranslation();
  
  // 1. 只订阅 snippets 数据，避免直接调用 getAllTags() 导致死循环
  const snippets = useSnippetStore((state) => state.snippets);

  // 2. 使用 useMemo 缓存标签列表
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    snippets.forEach(s => s.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [snippets]);

  return (
    <CommonTagSelector
      value={selectedTags}
      onChange={onChange}
      allTags={allTags}
      className={className}
      placeholder={t("common.selectTags", "Select tags...")}
      searchPlaceholder={t("common.searchTags", "Search tags...")}
      // 🟢 [新增] 限制标签数量为 2
      maxTags={2} 
    />
  );
};
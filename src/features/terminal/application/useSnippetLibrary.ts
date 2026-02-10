import { useState, useEffect, useMemo } from "react";
import { SnippetService } from "@/features/snippet/application/snippetService";
import { Snippet } from "@/features/snippet/domain/types";

export const useSnippetLibrary = (isOpen: boolean) => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 筛选状态
  const [searchQuery, setSearchQuery] = useState(""); 
  const [selectedTag, setSelectedTag] = useState<string | null>(null); 
  const [autoRun, setAutoRun] = useState(false);

  // 1. 加载数据
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      SnippetService.getAll()
        .then((data) => setSnippets(data))
        .catch((err) => console.error("Failed to load snippets", err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  // 2. 计算所有标签
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    snippets.forEach(s => s.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [snippets]);

  // 3. 筛选与排序逻辑
  const filteredSnippets = useMemo(() => {
    const filtered = snippets.filter(s => {
      const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTag = selectedTag ? s.tags?.includes(selectedTag) : true;
      return matchSearch && matchTag;
    });

    return filtered.sort((a, b) => {
      // Bash 优先
      if (a.language === 'bash' && b.language !== 'bash') return -1;
      if (a.language !== 'bash' && b.language === 'bash') return 1;
      // 时间倒序
      return b.createdAt - a.createdAt;
    });
  }, [snippets, searchQuery, selectedTag]);

  return {
    isLoading,
    snippets: filteredSnippets, // 返回处理后的列表
    allTags,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    autoRun,
    setAutoRun
  };
};
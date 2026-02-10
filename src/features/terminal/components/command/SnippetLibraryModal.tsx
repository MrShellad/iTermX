import { useState } from "react";
// 引入业务逻辑
import { useSnippetLibrary } from "@/features/terminal/application/useSnippetLibrary";
import { useCommandHistory } from "../../hooks/useCommandHistory"; // 请确保路径正确
// 引入 UI 组件
import { SnippetLibraryUI } from "./SnippetLibraryUI";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (code: string, autoRun: boolean) => void;
  sessionId: string | null;
}

export const SnippetLibraryModal = ({ isOpen, onClose, onSelect, sessionId }: Props) => {
  const [activeTab, setActiveTab] = useState<'snippets' | 'history'>('snippets');

  // 1. Snippets 业务逻辑
  const {
    isLoading: isSnippetsLoading,
    snippets,
    allTags,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
  } = useSnippetLibrary(isOpen && activeTab === 'snippets');

  // 2. History 业务逻辑
  const {
    historyList,
    isLoading: isHistoryLoading,
    server,
    deleteHistory
  } = useCommandHistory(isOpen, activeTab === 'history', sessionId);

  // 3. 交互逻辑
  const handleRun = (code: string) => {
    if (!code) return;
    onSelect(code, true);
    onClose();
  };

  const handleInsert = (code: string) => {
    if (!code) return;
    onSelect(code, false);
    onClose();
  };

  // 4. 组装并渲染 UI
  return (
    <SnippetLibraryUI 
        isOpen={isOpen}
        onClose={onClose}
        activeTab={activeTab}
        onTabChange={setActiveTab}

        // Snippets
        snippets={snippets}
        isSnippetsLoading={isSnippetsLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        allTags={allTags}
        selectedTag={selectedTag}
        onTagSelect={setSelectedTag}

        // History
        historyList={historyList}
        isHistoryLoading={isHistoryLoading}
        serverName={server?.name}
        serverIp={server?.ip}

        // Actions
        onRun={handleRun}
        onInsert={handleInsert}
        onDeleteHistory={deleteHistory}
    />
  );
};
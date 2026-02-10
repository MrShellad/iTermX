import { useTerminalStore } from "@/store/useTerminalStore";
import { TerminalWelcome } from "./components/TerminalWelcome";
import { TerminalSessionView } from "./components/TerminalSessionView";
import { TerminalSplitLayout } from "./layout/TerminalSplitLayout";
import { TerminalVerticalLayout } from "./layout/TerminalVerticalLayout"; 
import { FileManagerPanel } from "./components/FileManagerPanel";
import { CommandToolbar } from "./components/CommandToolbar";
import clsx from "clsx";

export const TerminalLayout = () => {
  const { tabs, activeTabId } = useTerminalStore();

  if (tabs.length === 0) return null;

  return (
    <div className="w-full h-full bg-transparent relative">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const currentSessionId = tab.sessions?.[0];

        return (
          <div
            key={tab.id}
            className={clsx(
              "absolute inset-0 w-full h-full bg-transparent",
              !isActive && "hidden" 
            )}
          >
            {tab.type === 'welcome' ? (
              <TerminalWelcome />
            ) : (
              <TerminalSplitLayout>
                <TerminalVerticalLayout
                  // 🟢 [核心修改] top 区域改为 Flex Column 布局
                  // 1. TerminalSessionView 占据剩余空间 (flex-1)
                  // 2. CommandToolbar 固定在底部，自然排列
                  top={
                    <div className="flex flex-col w-full h-full relative overflow-hidden">
                        {/* 终端区域 */}
                        <div className="flex-1 min-h-0 relative w-full">
                            <TerminalSessionView tab={tab} isActive={isActive} />
                        </div>
                        
                        {/* 工具栏区域 (不再是 absolute，而是流式布局) */}
                        <CommandToolbar />
                    </div>
                  }
                  
                  // 下部内容：文件管理器 (保持不变)
                  bottom={
                    <FileManagerPanel 
                      sessionId={currentSessionId} 
                      isActive={isActive} 
                    />
                  }
                />
              </TerminalSplitLayout>
            )}
          </div>
        );
      })}
    </div>
  );
};
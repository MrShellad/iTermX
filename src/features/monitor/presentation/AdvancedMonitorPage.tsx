import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { listen } from "@tauri-apps/api/event";
import { Activity, X, Server, LayoutDashboard } from "lucide-react";
import { SingleSessionMonitor } from "./components/SingleSessionMonitor";
import { MonitorTitleBar } from "./components/MonitorTitleBar";

interface MonitorTab {
    sessionId: string;
    title: string;
}

export const AdvancedMonitorPage = () => {
    const [searchParams] = useSearchParams();
    const [tabs, setTabs] = useState<MonitorTab[]>([]);
    const initializedRef = useRef(false);

    // --- 主题同步逻辑 (保持不变) ---
    useEffect(() => {
        const applyTheme = (theme: string) => {
            const root = document.documentElement;
            const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            root.classList.toggle('dark', isDark);
        };
        try {
            const storageKey = 'settings-storage'; 
            const raw = localStorage.getItem(storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                const savedTheme = parsed?.state?.settings?.['appearance.appTheme'];
                if (savedTheme) applyTheme(savedTheme);
            }
        } catch (e) { console.error(e); }

        const unlistenPromise = listen<string>("app:theme-change", (event) => applyTheme(event.payload));
        return () => { unlistenPromise.then(unlisten => unlisten()); };
    }, []);

    // --- 逻辑部分 (保持不变，只是去掉了 activeSessionId) ---
    
    // 1. 初始化
    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;
        const initSessionId = searchParams.get("sessionId");
        const initTitle = searchParams.get("name");
        if (initSessionId && initTitle) {
            setTabs([{ sessionId: initSessionId, title: initTitle }]);
        }
    }, []);

    // 2. 监听添加会话
    useEffect(() => {
        const unlistenPromise = listen<{ sessionId: string; title: string }>("monitor:open-session", (event) => {
            const { sessionId, title } = event.payload;
            setTabs(prev => {
                const exists = prev.some(t => t.sessionId === sessionId);
                if (exists) return prev;
                // 新服务器追加在右侧
                return [...prev, { sessionId, title }];
            });
            // 仪表盘模式下，不需要切换 focus，因为是一览式的
        });
        return () => { unlistenPromise.then(unlisten => unlisten()); };
    }, []); 

    const removeTab = (sessionId: string) => {
        setTabs(prev => prev.filter(t => t.sessionId !== sessionId));
    };

    return (
        <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-200">
            
            {/* 🟢 标题栏：仅显示 Dashboard 标题，不再显示 Tabs */}
            <MonitorTitleBar>
                <div className="flex items-center gap-2 px-4 h-full text-slate-500 dark:text-slate-400 select-none">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                        Live Dashboard
                    </span>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                        {tabs.length}
                    </span>
                </div>
            </MonitorTitleBar>

            {/* 🟢 内容区域：水平滚动容器 (Dashboard Container) */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-slate-100/50 dark:bg-black/20">
                {tabs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                        <div className="p-4 rounded-full bg-slate-200/50 dark:bg-slate-800/50">
                            <Activity className="w-8 h-8 opacity-40" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium">Dashboard is empty</p>
                            <p className="text-xs opacity-60 mt-1">Open a server monitor from the main window.</p>
                        </div>
                    </div>
                ) : (
                    // 🟢 Flex Row 实现横向排列
                    <div className="flex h-full p-4 gap-4 items-start min-w-max">
                        {tabs.map(tab => (
                            // 🟢 单个服务器的大卡片 (Column)
                            <div 
                                key={tab.sessionId} 
                                className="w-[340px] h-full flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 group"
                            >
                                {/* Column Header */}
                                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-xl shrink-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                            <Server className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-bold truncate text-slate-700 dark:text-slate-200" title={tab.title}>
                                                {tab.title}
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-mono truncate opacity-80">
                                                {tab.sessionId.split('-')[0]}...
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => removeTab(tab.sessionId)}
                                        className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Close Monitor"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Column Content (Monitor Cards) */}
                                <div className="flex-1 overflow-hidden min-h-0 bg-slate-50/30 dark:bg-slate-950/30 rounded-b-xl">
                                    {/* 传入 isDashboard=true 以启用垂直紧凑布局 */}
                                    <SingleSessionMonitor sessionId={tab.sessionId} isDashboard={true} />
                                </div>
                            </div>
                        ))}
                        
                        {/* 占位符，防止最后一个卡片贴边太紧 */}
                        <div className="w-1 shrink-0" />
                    </div>
                )}
            </div>
        </div>
    );
};
// src/features/terminal/components/TerminalMonitor.tsx
import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { 
  PanelLeft, PanelRight, ChevronLeft, ChevronRight, ExternalLink,
  Server, Cpu, Zap, Database, Wifi 
} from "lucide-react"; 
import { useTranslation } from "react-i18next";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow"; 
import { emitTo } from "@tauri-apps/api/event"; 
import { LayoutGroup } from "framer-motion";

import { useTerminalStore } from "@/store/useTerminalStore";
import { useServerStore } from "@/features/server/application/useServerStore";
import { useMonitorStore, RemoteCpuInfo, RemoteMemInfo, RemoteDiskInfo, RemoteOsInfo, RemoteNetworkInfo } from "@/store/useMonitorStore";
import { MonitorDescriptor } from "./monitor/types";

import { InfoCard } from "./monitor/card/InfoCard";
import { CpuCard } from "./monitor/card/CpuCard";
import { MemoryCard } from "./monitor/card/MemoryCard";
import { DiskCard } from "./monitor/card/DiskCard";
import { NetworkCard } from "./monitor/card/NetworkCard";

import { Button } from "@/components/ui/button"; 

interface Props {
    collapsed?: boolean;
    onToggle?: () => void;
}

export const TerminalMonitor = ({ collapsed = false, onToggle }: Props) => {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { activeTabId, tabs, sessions: terminalSessions, monitorPosition, setMonitorPosition } = useTerminalStore();
  const currentTab = tabs.find(t => t.id === activeTabId);
  const sessionId = currentTab?.sessions?.[0];
  const sessionObj = sessionId ? terminalSessions[sessionId] : undefined;
  const serverConfig = useServerStore(state => state.servers.find(s => s.id === sessionObj?.serverId));
  
  const { sessions, setSessionData, updateHistory } = useMonitorStore();
  const sessionData = sessionId ? sessions[sessionId] : undefined;

  const openAdvancedMonitor = async () => {
    if (!sessionId || !serverConfig) return;
    const label = "advanced_monitor";
    const existingWindow = await WebviewWindow.getByLabel(label);
    if (existingWindow) {
        await emitTo(label, "monitor:open-session", { sessionId, title: serverConfig.name });
        await existingWindow.setFocus();
    } else {
        const url = `/advanced-monitor?sessionId=${sessionId}&name=${encodeURIComponent(serverConfig.name)}`;
        new WebviewWindow(label, {
            url, title: "Advanced Resource Monitor",
            width: 1000, height: 800, decorations: false, transparent: true, center: true
        });
    }
  };

  const CARD_DESCRIPTORS = useMemo<MonitorDescriptor[]>(() => [
    { id: 'os',   Component: InfoCard,    icon: <Server className="w-5 h-5" />,   color: "green" },
    { id: 'cpu',  Component: CpuCard,     icon: <Cpu className="w-5 h-5" />,      color: "blue" },
    { id: 'mem',  Component: MemoryCard,  icon: <Zap className="w-5 h-5" />,      color: "purple" },
    { id: 'disk', Component: DiskCard,    icon: <Database className="w-5 h-5" />, color: "blue" },
    { id: 'net',  Component: NetworkCard, icon: <Wifi className="w-5 h-5" />,     color: "orange" },
  ], []);

  useEffect(() => {
    if (!sessionId) return;
    const fetchData = async () => {
      try {
        const [cpu, mem, disk, os, net] = await Promise.allSettled([
          invoke<RemoteCpuInfo>("get_ssh_cpu_info", { id: sessionId }),
          invoke<RemoteMemInfo>("get_ssh_mem_info", { id: sessionId }),
          invoke<RemoteDiskInfo>("get_ssh_disk_info", { id: sessionId }),
          invoke<RemoteOsInfo>("get_ssh_os_info", { id: sessionId }),
          invoke<RemoteNetworkInfo>("get_ssh_network_info", { id: sessionId }),
        ]);
        const updates: any = {};
        if (cpu.status === "fulfilled") { updates.cpu = cpu.value; updateHistory(sessionId, cpu.value.usage); }
        if (mem.status === "fulfilled") updates.mem = mem.value;
        if (disk.status === "fulfilled") updates.disk = disk.value;
        if (os.status === "fulfilled") updates.os = os.value;
        if (net.status === "fulfilled") updates.network = net.value;
        setSessionData(sessionId, updates);
      } catch (err) {}
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [sessionId, setSessionData, updateHistory]);

  if (collapsed) {
      return (
          <div className="h-full w-full flex flex-col items-center py-4 gap-4 bg-slate-50/50 dark:bg-black/20 border-x border-slate-200 dark:border-white/5">
              <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8 text-slate-500 hover:text-blue-600">
                  {monitorPosition === 'left' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
              <div className="flex-1" />
              <Button variant="ghost" size="icon" onClick={() => setMonitorPosition(monitorPosition === 'left' ? 'right' : 'left')} className="h-8 w-8 text-slate-400">
                  {monitorPosition === 'left' ? <PanelRight className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
              </Button>
          </div>
      );
  }

  if (!sessionId || !sessionData) return null;

  return (
    <div className="h-full w-full flex flex-col bg-slate-50/30 dark:bg-transparent overflow-hidden relative">
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; scrollbar-gutter: stable;}
      `}</style>

      {/* 🟢 修改点 1: Header Area 移出滚动容器，并设置 shrink-0 确保不被压缩 */}
      <div className="flex items-center justify-between p-3 pb-2 shrink-0 z-10 bg-slate-50/30 dark:bg-transparent">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">
          {serverConfig?.name || 'Resource Monitor'}
        </h2>
        <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onToggle} className="h-6 w-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                {monitorPosition === 'left' ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMonitorPosition(monitorPosition === 'left' ? 'right' : 'left')} className="h-6 w-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                {monitorPosition === 'left' ? <PanelRight className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
            </Button>
        </div>
      </div>

      {/* 🟢 修改点 2: 滚动容器仅包含卡片列表，添加 flex-1 占据剩余空间 */}
      <div className="flex-1 w-full overflow-y-auto no-scrollbar px-3 pb-20">
        
        {/* 卡片列表：使用 LayoutGroup 保持位移动画同步 */}
        <LayoutGroup id="monitor-group">
          <div className="flex flex-col gap-3 pt-1"> 
            {CARD_DESCRIPTORS.map(({ id, Component, icon, color }) => (
              <Component
                key={id} id={id} icon={icon} color={color} data={sessionData} 
                isExpanded={expandedId === id}
                onToggle={(id: string) => setExpandedId(prev => prev === id ? null : id)}
              />
            ))}
          </div>
        </LayoutGroup>

      </div>

      {/* 底部按钮区域：采用毛玻璃质感置底，不占位遮罩 */}
      <div className="absolute bottom-0 left-0 right-0 p-3 pt-2 bg-slate-50/80 dark:bg-[#1a1b26]/80 backdrop-blur-md z-30 border-t border-slate-200/50 dark:border-white/5">
        <Button 
            variant="outline" size="sm" 
            className="w-full border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-blue-600 gap-2 shadow-sm transition-all active:scale-[0.98]"
            onClick={openAdvancedMonitor}
        >
            <ExternalLink className="w-3.5 h-3.5" />
            {t('monitor.openAdvanced', 'Open Advanced Monitor')}
        </Button>
      </div>

    </div>
  );
};
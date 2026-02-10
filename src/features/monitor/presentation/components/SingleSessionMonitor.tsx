// src/features/monitor/presentation/components/SingleSessionMonitor.tsx
import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Server, Cpu, Zap, Database, Wifi } from "lucide-react"; 
import { useTranslation } from "react-i18next";
import { LayoutGroup } from "framer-motion";
import { clsx } from "clsx";

import { useMonitorStore, RemoteCpuInfo, RemoteMemInfo, RemoteDiskInfo, RemoteOsInfo, RemoteNetworkInfo } from "@/store/useMonitorStore";
import { MonitorDescriptor } from "@/features/terminal/components/monitor/types";

import { InfoCard } from "@/features/terminal/components/monitor/card/InfoCard";
import { CpuCard } from "@/features/terminal/components/monitor/card/CpuCard";
import { MemoryCard } from "@/features/terminal/components/monitor/card/MemoryCard";
import { DiskCard } from "@/features/terminal/components/monitor/card/DiskCard";
import { NetworkCard } from "@/features/terminal/components/monitor/card/NetworkCard";

interface Props {
    sessionId: string;
    isDashboard?: boolean; 
}

export const SingleSessionMonitor = ({ sessionId, isDashboard = false }: Props) => {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { sessions, setSessionData, updateHistory } = useMonitorStore();
  const sessionData = sessions[sessionId];

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
        if (cpu.status === "fulfilled") { 
          updates.cpu = cpu.value; 
          updateHistory(sessionId, cpu.value.usage); 
        }
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

  if (!sessionData) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 animate-pulse">
              <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
              <span className="text-xs">{t('monitor.connecting', 'Connecting...')}</span>
          </div>
      );
  }

  return (
    // 🟢 [布局容器]
    <div className="h-full w-full flex flex-col relative overflow-hidden">
      
      {/* 🟢 [关键修复] 注入自定义滚动条样式，防止挤压 */}
      <style>{`
        .custom-scrollbar {
            scrollbar-gutter: stable; /* 预留滚动条空间，防止布局跳动 */
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px; /* 极细滚动条 */
            height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.2); /* 浅色透明滑块 */
            border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(156, 163, 175, 0.4);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.1);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
      `}</style>

      <div className={clsx(
          "h-full w-full overflow-y-auto custom-scrollbar", // 🟢 应用自定义滚动条
          isDashboard ? "p-2" : "p-4"
      )}>
        <LayoutGroup id={`monitor-group-${sessionId}`}>
          <div className={clsx(
              "gap-3",
              isDashboard 
                ? "flex flex-col pb-2" 
                : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-4"
          )}>
            {CARD_DESCRIPTORS.map(({ id, Component, icon, color }) => (
              <Component
                key={id}
                id={id}
                icon={icon}
                color={color}
                data={sessionData}
                isExpanded={expandedId === id}
                onToggle={(id: string) => setExpandedId(prev => prev === id ? null : id)}
              />
            ))}
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
};
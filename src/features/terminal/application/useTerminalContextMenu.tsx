import { useState, useEffect, RefObject } from "react";
import { Terminal } from "@xterm/xterm";
import { invoke } from '@tauri-apps/api/core';
import { toast } from "sonner";
import { Copy, Clipboard, Trash2 } from "lucide-react";
import { ContextMenuItem } from "@/components/common/ContextMenu";

export const useTerminalContextMenu = (
  // 🟢 [修复] 将类型修改为 RefObject<HTMLDivElement | null> 以兼容 useRef(null)
  containerRef: RefObject<HTMLDivElement | null>,
  termRef: RefObject<Terminal | null>,
  sessionId: string
) => {
  const [menuConfig, setMenuConfig] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0, y: 0, visible: false
  });

  // 1. Native Event Capture
  useEffect(() => {
    const handleNativeContextMenu = (e: MouseEvent) => {
      e.preventDefault(); 
      e.stopPropagation(); 
      
      setMenuConfig({
        x: e.clientX,
        y: e.clientY,
        visible: true
      });
      
      return false;
    };

    const el = containerRef.current;
    if (el) {
      el.addEventListener('contextmenu', handleNativeContextMenu, true);
    }

    return () => {
      if (el) {
        el.removeEventListener('contextmenu', handleNativeContextMenu, true);
      }
    };
  }, []); 

  // 2. Actions
  const handleClose = () => setMenuConfig(p => ({ ...p, visible: false }));

  const menuItems: ContextMenuItem[] = [
    {
      label: "复制",
      icon: <Copy size={14} />,
      shortcut: "Ctrl+Shift+C",
      disabled: !termRef.current?.hasSelection(),
      onClick: async () => {
        const text = termRef.current?.getSelection();
        if (text) {
             await navigator.clipboard.writeText(text);
             toast.success("已复制到剪贴板");
        }
        termRef.current?.focus();
      }
    },
    {
      label: "粘贴",
      icon: <Clipboard size={14} />,
      shortcut: "Ctrl+Shift+V",
      onClick: async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) invoke('write_ssh', { id: sessionId, data: text });
        } catch (err) { 
            console.error(err);
            toast.error("无法读取剪贴板");
        }
        termRef.current?.focus();
      }
    },
    {
      label: "清屏",
      icon: <Trash2 size={14} />,
      shortcut: "Ctrl+L",
      danger: true,
      onClick: () => {
          termRef.current?.clear();
          termRef.current?.focus();
      }
    }
  ];

  return {
    menuConfig,
    menuItems,
    handleClose
  };
};
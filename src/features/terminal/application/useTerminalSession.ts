import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useTerminalStore } from "@/store/useTerminalStore";
import { useServerStore } from "@/features/server/application/useServerStore";
import { useSettingsStore } from "@/features/settings/application/useSettingsStore";
import { TERMINAL_THEMES } from "../constants";
import { useSessionCredentialStore } from "@/store/useSessionCredentialStore";

// 防抖工具
function debounce(func: Function, wait: number) {
  let timeout: any;
  return function (...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const useTerminalSession = (sessionId: string, isActive: boolean) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const rendererAddonRef = useRef<any>(null);
  
  // 连接状态锁
  const isConnectionReadyRef = useRef(false);
  
  // 记录尺寸用于去重
  const lastSentSizeRef = useRef({ cols: 0, rows: 0 });
  const cmdBuffer = useRef<string>('');

  const [isPasswordRequired, setIsPasswordRequired] = useState(false);

  const updateSessionStatus = useTerminalStore(s => s.updateSessionStatus);
  const session = useTerminalStore(s => s.sessions[sessionId]);
  const serverConfig = useServerStore(s => 
    s.servers.find(srv => srv.id === session?.serverId)
  );

  const consumeCredential = useSessionCredentialStore(s => s.consumeCredential);
  const settings = useSettingsStore(s => s.settings);
  const customThemes = useSettingsStore(s => s.customThemes);
  
  // 样式配置
  const themeId = settings['terminal.theme'] || 'default';
  const rendererType = settings['terminal.rendererType'] || 'webgl';
  const fontSize = settings['terminal.fontSize'] || 14;
  const fontFamily = settings['terminal.fontFamily'] || 'Menlo, Monaco, "Courier New", monospace';
  const fontWeight = settings['terminal.fontWeight'] || 'normal';
  const lineHeight = settings['terminal.lineHeight'] || 1.0;
  const cursorBlink = settings['terminal.cursorBlink'] ?? true;
  const cursorStyle = settings['terminal.cursorStyle'] || 'block';
  const scrollback = settings['terminal.scrollback'] || 1000;
  const padding = Number(settings['terminal.padding'] || 12);

  const allThemes = { ...TERMINAL_THEMES, ...customThemes };
  const themeObj = allThemes[themeId] || allThemes['default'];

  // 1. 安全 Resize 函数
  const performSafeResize = useCallback((force: boolean = false) => {
    if (!isConnectionReadyRef.current && !force) return;

    if (!termRef.current || !fitAddonRef.current || !mountRef.current) return;
    if (mountRef.current.clientWidth === 0 || mountRef.current.clientHeight === 0) return;

    try { 
        fitAddonRef.current.fit(); 
        const newCols = termRef.current.cols;
        const newRows = termRef.current.rows;

        if (newCols <= 0 || newRows <= 0 || isNaN(newCols) || isNaN(newRows)) return;
        if (newCols === lastSentSizeRef.current.cols && newRows === lastSentSizeRef.current.rows) return;

        lastSentSizeRef.current = { cols: newCols, rows: newRows };
        invoke('resize_ssh', { id: sessionId, rows: newRows, cols: newCols }).catch(console.error);
    } catch (e) { 
        console.warn("Fit error:", e);
    }
  }, [sessionId]);

  // 2. 连接逻辑
  const connectInternal = useCallback(async (manualPassword?: string) => {
    if (!termRef.current || !serverConfig) return;
    const term = termRef.current;
    
    setIsPasswordRequired(false);
    updateSessionStatus(sessionId, 'connecting');

    try {
        let finalPassword = manualPassword;
        if (!finalPassword && serverConfig.provider === 'QuickConnect') {
            const tempPwd = consumeCredential(serverConfig.id);
            if (tempPwd) finalPassword = tempPwd;
            else {
                term.write(`\r\n\x1b[33m[Auth]\x1b[0m Session expired.\r\n`);
                setIsPasswordRequired(true);
                updateSessionStatus(sessionId, 'disconnected');
                return;
            }
        }

        if (serverConfig.provider === 'QuickConnect') {
            await invoke('quick_connect', {
                id: sessionId,
                ip: serverConfig.ip,
                port: serverConfig.port,
                username: serverConfig.username,
                password: finalPassword || null,
                privateKey: serverConfig.privateKey || null,
                passphrase: serverConfig.passphrase || null
            });
        } else {
            await invoke('connect_ssh', { serverId: serverConfig.id, sessionId: sessionId });
        }

        updateSessionStatus(sessionId, 'connected');
        term.focus();

        setTimeout(() => {
            if (!termRef.current) return;
            isConnectionReadyRef.current = true;
            performSafeResize(true); 
        }, 300);

    } catch (err: any) {
        const msg = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
        term.write(`\r\n\x1b[31mConnection failed: ${msg}\x1b[0m\r\n`);
        updateSessionStatus(sessionId, 'error');
        if ((msg.includes("Auth Failed") || msg.includes("denied")) && serverConfig.provider === 'QuickConnect') {
             setIsPasswordRequired(true);
        }
    }
  }, [serverConfig, sessionId, consumeCredential, updateSessionStatus, performSafeResize]);

  // 3. 初始化终端与数据监听
  useEffect(() => {
    if (!mountRef.current || !session || !serverConfig) return;

    if (termRef.current) {
        termRef.current.dispose();
    }

    const term = new Terminal({
      fontSize: Number(fontSize),
      fontFamily,
      fontWeight: fontWeight as any,
      lineHeight: Number(lineHeight),
      cursorBlink,
      cursorStyle: cursorStyle as any,
      scrollback: Number(scrollback),
      theme: themeObj,
      allowProposedApi: true,
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(mountRef.current);
    if (term.element) term.element.classList.add('xterm-scroll-fix');

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    let isMounted = true; 
    let unlistenFn: UnlistenFn | null = null;
    
    const setup = async () => {
        const unlisten = await listen<string>(`term-data-${sessionId}`, (event) => {
            if (isMounted && termRef.current) {
                termRef.current.write(event.payload);
            }
        });

        if (!isMounted) {
            unlisten(); 
            return;
        }
        unlistenFn = unlisten;
        await connectInternal();
    };

    setup();

    // 输入监听
    const dataDisposable = term.onData((data) => {
        invoke('write_ssh', { id: sessionId, data }).catch(console.error);

        // 历史记录逻辑
        for (let i = 0; i < data.length; i++) {
            const char = data[i];
            const code = char.charCodeAt(0);
            if (code === 13) {
                const command = cmdBuffer.current.trim();
                if (command.length > 0 && serverConfig?.id) {
                    invoke('record_command_history', { serverId: serverConfig.id, command, source: 'user' }).catch(() => {});
                }
                cmdBuffer.current = '';
            } else if (code === 127) {
                cmdBuffer.current = cmdBuffer.current.slice(0, -1);
            } else if (code >= 32) {
                cmdBuffer.current += char;
            }
        }
    });

    // 尺寸监听
    const debouncedResize = debounce(() => {
        if (!mountRef.current || mountRef.current.clientWidth === 0) return;
        performSafeResize();
    }, 100);

    const resizeObserver = new ResizeObserver(() => debouncedResize());
    resizeObserver.observe(mountRef.current);

    return () => {
        isMounted = false;
        isConnectionReadyRef.current = false;
        if (unlistenFn) unlistenFn();
        dataDisposable.dispose();
        resizeObserver.disconnect();
        term.dispose();
        termRef.current = null;

        const currentTabs = useTerminalStore.getState().tabs;
        const isSessionAlive = currentTabs.some(tab => tab.sessions.includes(sessionId));
        if (!isSessionAlive) {
            updateSessionStatus(sessionId, 'disconnected');
            invoke('disconnect_ssh', { id: sessionId }).catch(console.error);
        }
    };
  }, [sessionId, serverConfig?.id, session?.connectTimestamp]);

  // 4. WebGL Addon 切换
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    if (rendererAddonRef.current) {
        try { rendererAddonRef.current.dispose(); } catch (e) {}
        rendererAddonRef.current = null;
    }
    if (rendererType === 'webgl') {
        try {
            const addon = new WebglAddon();
            addon.onContextLoss(() => addon.dispose());
            term.loadAddon(addon);
            rendererAddonRef.current = addon;
        } catch (e) { console.warn("WebGL Error:", e); }
    }
  }, [rendererType]);

  // 5. 🟢 [修复] 外观配置实时同步 (Hot Reload)
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;

    // 更新 xterm 内部配置
    term.options.fontSize = Number(fontSize);
    term.options.fontFamily = fontFamily;
    term.options.fontWeight = fontWeight as any;
    term.options.lineHeight = Number(lineHeight);
    term.options.cursorBlink = cursorBlink;
    term.options.cursorStyle = cursorStyle as any;
    term.options.scrollback = Number(scrollback);
    term.options.theme = themeObj;

    // 当 Padding 或字体变化时，容器内容积改变，必须重新计算布局
    requestAnimationFrame(() => {
        performSafeResize(true);
    });
  }, [
    fontSize, fontFamily, fontWeight, lineHeight, 
    cursorBlink, cursorStyle, scrollback, themeObj, 
    padding // 👈 监听 padding 变化触发重绘
  ]);

  // 6. Tab 激活自动聚焦
  useEffect(() => {
    if (isActive && termRef.current) {
        const timer = setTimeout(() => {
            performSafeResize();
            termRef.current?.focus();
        }, 50);
        return () => clearTimeout(timer);
    }
  }, [isActive, performSafeResize]);

  return {
    mountRef,
    termRef,
    style: { padding, themeObj },
    isPasswordRequired,
    closePasswordModal: () => setIsPasswordRequired(false),
    reconnectWithPassword: (pwd: string) => connectInternal(pwd),
    status: session?.status || 'disconnected'
  };
};
import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import "@xterm/xterm/css/xterm.css";
import { useSettingsStore } from "@/features/settings/application/useSettingsStore";
import { TERMINAL_THEMES } from "@/features/terminal/constants";
import { cn } from "@/lib/utils";

// 🟢 精简内容，避免由内容过长导致的物理换行（Wrap），减少计算复杂度
const DEMO_CONTENT = [
  '\x1b[32muser@demo\x1b[0m:\x1b[34m~\x1b[0m$ ls -la',
  '-rw-r--r--  1 user  staff  1024 Jan 24 \x1b[33mREADME.md\x1b[0m',
  '-rwxr-xr-x  1 user  staff   512 Jan 24 \x1b[31mscript.sh\x1b[0m',
  'drwxr-xr-x  3 user  staff    96 Jan 24 src',
  '\x1b[32muser@demo\x1b[0m:\x1b[34m~\x1b[0m$ echo "Hello World!你好中国！"',
  '\x1b[32muser@demo\x1b[0m:\x1b[34m~\x1b[0m$ sudo',
  ''
].join('\r\n');

const ROWS_TO_SHOW = 8;

export const TerminalPreview = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  
  // 🟢 核心状态：控制“揭幕”时机
  const [isReady, setIsReady] = useState(false);

  const settings = useSettingsStore(s => s.settings);
  const customThemes = useSettingsStore(s => s.customThemes);

  const themeId = settings['terminal.theme'] || 'default';
  const fontSize = Number(settings['terminal.fontSize'] || 14);
  const fontFamily = settings['terminal.fontFamily'] || 'Menlo, Monaco, "Courier New", monospace';
  const fontWeight = settings['terminal.fontWeight'] || 'normal';
  const lineHeight = Number(settings['terminal.lineHeight'] || 1.0);
  const cursorBlink = settings['terminal.cursorBlink'] ?? true;
  const cursorStyle = settings['terminal.cursorStyle'] || 'block';
  const padding = Number(settings['terminal.padding'] || 12);
  const paddingBottom = Number(settings['terminal.paddingBottom'] || 0);

  const allThemes = { ...TERMINAL_THEMES, ...customThemes };
  const themeObj = allThemes[themeId] || allThemes['default'];

  // 🟢 动态计算高度：8行文字 + 上下内边距 + 缓冲
  // 增加到 12px 缓冲，确保 WebGL 渲染的光标阴影不会被 overflow:hidden 切掉
  const contentHeight = Math.ceil(ROWS_TO_SHOW * fontSize * lineHeight) + 12;

  useEffect(() => {
    if (!mountRef.current) return;

    // 每次挂载先隐藏，避免让用户看到初始化过程
    setIsReady(false);

    const term = new Terminal({
      cursorBlink,
      fontSize,
      fontFamily,
      fontWeight: fontWeight as any,
      lineHeight,
      cursorStyle: cursorStyle as any,
      theme: themeObj,
      allowProposedApi: true,
      disableStdin: true,
      allowTransparency: true, 
      // 🟢 静态预览不需要回滚缓冲区，设为 0 可以提升性能并避免滚动条跳动
      // 但为了防止容器动画期间内容被挤掉，我们给一点点冗余
      scrollback: 20, 
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    try {
        const webglAddon = new WebglAddon();
        webglAddon.onContextLoss(() => webglAddon.dispose());
        term.loadAddon(webglAddon);
    } catch (e) { }

    term.open(mountRef.current);
    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // 🟢 核心修复逻辑：基于你对 WebGL Buffer/Cursor 分层的理解
    requestAnimationFrame(() => {
        try {
            fitAddon.fit(); // 1. 先定尺寸 (Cols/Rows)
            
            // 2. 写入内容
            term.write(DEMO_CONTENT, () => {
                // 回调触发时，xterm 内部解析完成，但 WebGL 可能还在画 buffer 层
                
                // 3. 强制延迟两帧：
                // 第一帧：Buffer Layer 渲染完成
                // 第二帧：Cursor Layer 渲染合并完成
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        setIsReady(true); // 4. 一切就绪，揭幕！
                    }, 50); // 50ms 足够覆盖大多数屏幕刷新率下的 2-3 帧
                });
            });
        } catch (e) {
            setIsReady(true);
        }
    });

    const resizeObserver = new ResizeObserver(() => {
        if (!termRef.current) return;
        try { fitAddon.fit(); } catch (e) {}
    });
    
    resizeObserver.observe(mountRef.current);

    return () => {
      resizeObserver.disconnect();
      term.dispose();
    };
  }, []); 

  // 响应配置变化 (字体/颜色等)
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;

    term.options.fontSize = fontSize;
    term.options.fontFamily = fontFamily;
    term.options.fontWeight = fontWeight as any;
    term.options.lineHeight = lineHeight;
    term.options.cursorBlink = cursorBlink;
    term.options.cursorStyle = cursorStyle as any;
    term.options.theme = themeObj;

    requestAnimationFrame(() => {
        if (fitAddonRef.current) {
            fitAddonRef.current.fit();
        }
    });
  }, [fontSize, fontFamily, fontWeight, lineHeight, cursorBlink, cursorStyle, themeId, themeObj]);

  const wrapperStyle = {
      paddingTop: `${padding}px`,
      paddingLeft: `${padding}px`,
      paddingRight: `${padding}px`,
      paddingBottom: `${padding + paddingBottom}px`,
      backgroundColor: themeObj.background || undefined,
      height: 'auto' 
  };

  return (
    <div 
      className={cn(
        "w-full max-w-2xl mx-auto rounded-lg overflow-hidden border shadow-sm",
        "transition-colors duration-200",
        "bg-slate-50/50 dark:bg-slate-900/20",
        "border-slate-200 dark:border-slate-800",
        "hover:border-slate-300 dark:hover:border-slate-700"
      )}
      style={wrapperStyle}
    >
      <div 
        ref={mountRef} 
        className={cn(
            "transition-opacity duration-200 ease-out",
            // 只有当 Buffer 和 Cursor 都渲染完后，才设为 opacity-100
            isReady ? "opacity-100" : "opacity-0"
        )}
        // 动态高度，确保不发生 overflow 裁剪
        style={{ height: `${contentHeight}px` }}
      />
    </div>
  );
};
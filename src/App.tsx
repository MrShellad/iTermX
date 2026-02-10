import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ServerListPage } from "@/features/server/list";
import { KeyManagerPanel } from '@/features/keys/KeyManagerPanel';
import { SnippetPage } from '@/features/snippet/SnippetPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import './locales/i18n';
import { GlobalVaultModal } from '@/features/keys/components/GlobalVaultModal';
import { useSettingsEffects } from '@/features/settings/hooks/useSettingsEffects';
import { SettingsPage } from "@/features/settings/presentation/SettingsPage";
import { FileEditorPage } from './windows/FileEditorPage';
import { ToolsPlaceholder } from './features/tools/ToolsPlaceholder';
import { Toaster } from 'sonner';
import { getCurrentWindow } from "@tauri-apps/api/window";
import { emit } from "@tauri-apps/api/event";

import { useServerStore } from "@/features/server/application/useServerStore";
import { useSettingsStore } from "@/features/settings/application/useSettingsStore";
import { AdvancedMonitorPage } from "@/features/monitor/presentation/AdvancedMonitorPage";
import { useSecurityEffects } from '@/features/settings/hooks/useSecurityEffects';

// 引入 KeyStore 和 解锁表单
import { useKeyStore } from "@/store/useKeyStore";
import { VaultAuthForm } from "@/features/keys/components/VaultAuthForm";

function App() {
  useSettingsEffects();
  useSecurityEffects();
  
  const settings = useSettingsStore(s => s.settings);
  // 🟢 [新增] 获取设备身份初始化方法 (用于备份识别)
  const initDeviceIdentity = useSettingsStore(s => s.initDeviceIdentity);

  // 获取保险库状态
  const vaultStatus = useKeyStore(s => s.status);

  const appTheme = settings?.['appearance.appTheme']; 

  // 🟢 [新增] 应用启动时初始化设备身份 ID
  useEffect(() => {
    // 这里的 initDeviceIdentity 是在 useSettingsStore 中定义的
    // 务必确保你已经在 store 中添加了这个 action
    if (initDeviceIdentity) {
      initDeviceIdentity();
    }
  }, [initDeviceIdentity]);

  useEffect(() => {
    if (appTheme) {
      emit('app:theme-change', appTheme).catch(console.error); 
    }
  }, [appTheme]);

  const customFont = settings?.['appearance.fontFamily'];
  useEffect(() => {
    let styleTag = document.getElementById('dynamic-font-override') as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'dynamic-font-override';
      document.head.appendChild(styleTag);
    }
    if (customFont && typeof customFont === 'string' && customFont.trim() !== '') {
       let safeFont = customFont;
       if (!safeFont.includes('"') && !safeFont.includes("'")) {
           safeFont = `"${safeFont}"`;
       }
       styleTag.innerHTML = `
         :root { --font-ui: ${safeFont}; }
         body, button, input, textarea, select, .font-sans {
           font-family: var(--font-ui), "Microsoft YaHei", "微软雅黑", "PingFang SC", "Hiragino Sans GB", "Heiti SC", "WenQuanYi Micro Hei", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
         }
       `;
    } else {
       styleTag.innerHTML = '';
    }
  }, [customFont]);

  const fetchServers = useServerStore(s => s.fetchServers);
  useEffect(() => {
    fetchServers(true);
  }, [fetchServers]);

  useEffect(() => {
    const splash = document.getElementById('splash');
    if (splash) {
      splash.style.opacity = '0';
      splash.style.transition = 'opacity 0.3s ease';
      setTimeout(() => { splash.remove(); }, 300);
    }
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      try { getCurrentWindow().show(); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD) return;
    const handleCM = (e: MouseEvent) => e.preventDefault();
    const handleKD = (e: KeyboardEvent) => {
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
      }
    };
    window.addEventListener('contextmenu', handleCM);
    window.addEventListener('keydown', handleKD);
    return () => {
      window.removeEventListener('contextmenu', handleCM);
      window.removeEventListener('keydown', handleKD);
    };
  }, []);

  return (
    <BrowserRouter>
      {/* 全局锁屏遮罩 */}
      {vaultStatus === 'locked' && (
        <div className="fixed inset-0 z-[9999] bg-white dark:bg-slate-950 flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div className="w-full max-w-md px-4">
              <VaultAuthForm />
           </div>
        </div>
      )}

      <GlobalVaultModal />
      <Toaster richColors closeButton position="top-center" style={{ zIndex: 999999 }} />
      
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="servers" element={<ServerListPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="keys" element={<KeyManagerPanel />} />
          <Route path="snippets" element={<SnippetPage />} />
          <Route path="tools" element={<ToolsPlaceholder />} />
          <Route path="terminal" element={null} />
        </Route>
        <Route path="/editor_window" element={<FileEditorPage />} />
        <Route path="/advanced-monitor" element={<AdvancedMonitorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
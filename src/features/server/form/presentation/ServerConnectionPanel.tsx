import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// 🔴 [移除] 移除了 Server 图标，因为 Advanced Tab 不再是空的了
// import { Server } from "lucide-react"; 
import { KeySelectorModal } from "./components/KeySelectorModal";
import { NetworkSettings } from "./components/NetworkSettings";
import { AuthCredentials } from "./components/AuthCredentials";
import { ProxyConfiguration } from "./components/ProxyConfiguration"; 
// 🟢 [新增] 引入高级设置组件
import { AdvancedSettings } from "./components/AdvancedSettings";
import { useConnectionViewModel } from "./hooks/useConnectionViewModel";

export const ServerConnectionPanel = () => {
  const { t } = useTranslation();
  // 1. 获取所有逻辑和状态
  const { form, logic, ui, actions } = useConnectionViewModel();

  return (
    <div className="h-full flex flex-col pr-1">
      {/* 隐藏域：确保 proxyId 被注册 */}
      <input type="hidden" {...form.register("proxyId")} />

      <Tabs defaultValue="basic" className="flex-1 flex flex-col">
        {/* Tab Navigation */}
        <TabsList className="grid w-full grid-cols-2 h-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-slate-500 mb-6">
          <TabsTrigger value="basic" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm transition-all">
             {t('server.form.tabs.basic', 'Basic Settings')}
          </TabsTrigger>
          <TabsTrigger value="advanced" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm transition-all">
             {t('server.form.tabs.advanced', 'Advanced')}
          </TabsTrigger>
        </TabsList>

        {/* Tab Content: Basic */}
        <TabsContent value="basic" className="flex-1 space-y-6 mt-0 outline-none">
          <NetworkSettings 
            register={form.register}
            errors={form.errors}
            t={t}
          />

          <ProxyConfiguration 
             t={t}
             mode={logic.connectionType}
             onModeChange={actions.handleConnectionTypeChange}
             availableProxies={ui.filteredProxies}
             proxyId={logic.proxyId || undefined} 
             onProxySelect={actions.handleProxySelected}
          />

          <AuthCredentials 
            t={t}
            register={form.register}
            errors={form.errors}
            setValue={form.setValue}
            authType={logic.authType}
            onAuthTypeChange={logic.handleAuthTypeChange}
            passwordSource={logic.passwordSource}
            passwordId={logic.passwordId}
            showPassword={logic.showPassword}
            onToggleShowPassword={() => logic.setShowPassword(!logic.showPassword)}
            onResetPassword={() => logic.resetToManual('password')}
            keySource={logic.keySource}
            keyId={logic.keyId}
            keyName={ui.selectedKeyName}
            onResetKey={() => logic.resetToManual('key')}
            onSelectFromVault={actions.handleOpenVault}
          />
        </TabsContent>

        {/* 🟢 [替换] Tab Content: Advanced */}
        <TabsContent value="advanced" className="flex-1 space-y-6 mt-0 outline-none">
           <AdvancedSettings 
              t={t}
              register={form.register}
              errors={form.errors}
              // ⚠️ 确保你在 useConnectionViewModel 中已经把 watch 暴露出来了
              watch={form.watch} 
              setValue={form.setValue}
           />
        </TabsContent>
      </Tabs>

      {/* Global Modals */}
      <KeySelectorModal 
        open={ui.isKeyModalOpen} 
        onOpenChange={ui.setIsKeyModalOpen}
        onSelect={actions.handleKeySelected}
      />
    </div>
  );
};
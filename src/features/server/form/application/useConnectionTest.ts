import { useState } from "react";
import { UseFormTrigger, UseFormGetValues } from "react-hook-form";
import { ServerFormValues } from "../domain/schema";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { useTranslation } from "react-i18next"; // 🟢 [新增] 引入翻译 Hook

export const useConnectionTest = (
  trigger: UseFormTrigger<ServerFormValues>,
  getValues: UseFormGetValues<ServerFormValues>
) => {
  const { t } = useTranslation(); // 🟢 [新增] 获取 t 函数
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const testConnection = async () => {
    // 1. 核心需求：在测试前检测必填区域
    const isValid = await trigger();
    if (!isValid) {
      // 🟢 [修改] 本地化提示
      toast.warning(t('server.form.checkRequired', "Please check required fields."));
      return;
    }

    setStatus('loading');
    const data = getValues();

    try {
      const payload = {
        // 基础连接信息
        ip: data.host,
        port: data.port,
        username: data.username,
        authType: data.authType,

        // 密码/密钥逻辑
        passwordSource: data.passwordSource,
        passwordId: data.passwordId,
        password: data.password, 

        keySource: data.keySource,
        keyId: data.keyId,
        privateKey: data.privateKey, 
        passphrase: data.passphrase,

        // 代理与高级设置
        connectionType: data.connectionType,
        proxyId: data.proxyId, 
        connectTimeout: data.connectTimeout,
      };

      console.log("🔌 Testing Connection with:", payload);

      await invoke("test_connection", { payload });
      
      setStatus('success');
      // 🟢 [修改] 本地化成功提示
      toast.success(t('server.form.testSuccess', "Connection successful!"));
      
      setTimeout(() => setStatus('idle'), 3000);

    } catch (error: any) {
      console.error("Connection Test Failed:", error);
      setStatus('error');
      
      const errorMessage = typeof error === 'string' 
        ? error 
        : (error.message || JSON.stringify(error));
        
      // 🟢 [修改] 本地化失败提示
      toast.error(t('server.form.testFailed', "Connection failed: {{error}}", { error: errorMessage }));
    }
  };

  return { 
    status, 
    testConnection 
  };
};
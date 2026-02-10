import { useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serverFormSchema, ServerFormValues } from "../domain/schema";
import { DEFAULT_SERVER_FORM_VALUES } from "../domain/defaults";
import { useConnectionTest } from "./useConnectionTest";
import { useFormSubmit } from "./useFormSubmit";

interface UseServerFormLogicProps {
  initialData?: Partial<ServerFormValues> & {
    authType?: string;
    passwordId?: string | null;
    keyId?: string | null;
    provider?: string;
    // 兼容后端字段
    auth_type?: string;
    password_id?: string;
    key_id?: string;
    proxyId?: string | null;
    proxy_id?: string | null;
    // 🟢 [新增] 兼容后端 is_pinned 字段
    is_pinned?: number | boolean;
  };
  onClose?: () => void;
}

export const useServerFormLogic = ({ initialData, onClose }: UseServerFormLogicProps) => {
  
  // 1. 构造默认值
  const defaultValues = useMemo((): ServerFormValues => {
    const d = initialData as any || {};

    // 🔍 [Debug] 看看传入的原始数据到底有没有 proxyId
    console.log("📝 [FormInit] Raw InitialData:", d);

    // 提取字段 (兼容驼峰和下划线)
    const rawAuthType = d.authType || d.auth_type || 'password';
    const rawPasswordId = d.passwordId || d.password_id;
    const rawKeyId = d.keyId || d.key_id;
    
    // 🟢 [关键修复] 强力提取 proxyId
    const rawProxyId = d.proxyId || d.proxy_id;

    const merged: any = { 
      ...DEFAULT_SERVER_FORM_VALUES, 
      ...d,
      name: d.name ?? "",
      host: d.host ?? "",
      username: d.username ?? "",
      
      authType: rawAuthType === 'privateKey' ? 'key' : rawAuthType,
      passwordId: rawPasswordId,
      keyId: rawKeyId,
      
      // 🟢 [关键赋值]
      proxyId: rawProxyId, 
      
      connectionType: d.connectionType || 'direct', 

      // 🟢 [新增] 手动处理 is_pinned 默认值
      is_pinned: d.is_pinned ?? d.isPinned ?? 0,
    };

    // 计算 Source
    merged.passwordSource = rawPasswordId ? 'store' : 'manual';
    merged.keySource = rawKeyId ? 'store' : 'manual';
    if (!merged.provider) merged.provider = "Custom";

    return merged as ServerFormValues;
  }, [initialData]);

  // 2. 初始化表单
  const methods = useForm<ServerFormValues>({
    resolver: zodResolver(serverFormSchema) as any,
    defaultValues,
    mode: "onChange"
  });

  // 🟢 [关键修复] 当 defaultValues 变化时，强制重置表单
  useEffect(() => {
    if (initialData) {
      console.log("🔄 [FormReset] Resetting form with:", defaultValues);
      methods.reset(defaultValues);
    }
  }, [defaultValues, methods]);

  const { handleSubmit } = methods;

  const { status: testStatus, testConnection } = useConnectionTest(
    methods.trigger, 
    methods.getValues
  );
  
  const { submit } = useFormSubmit(onClose);

  // 🟢 [Debug 1] 成功回调：增加日志 + async/await (防止双重提交)
  const handleFormSubmit = async (data: ServerFormValues) => {
    console.log("✅ [FormSubmit] Validation Passed! Submitting data:", data);
    await submit(data);
  };

  // 🟢 [Debug 2] 失败回调：打印验证错误
  // 如果点击保存没反应，请按 F12 看控制台，这里会告诉你哪个字段没填对
  const handleFormError = (errors: any) => {
    console.group("❌ [FormError] Validation Failed");
    console.error("Field Errors:", errors);
    console.log("Current Form Values:", methods.getValues());
    console.groupEnd();
  };

  return {
    methods,
    testStatus,
    handleTest: testConnection,
    // 🟢 [修改] 传入第二个参数 handleFormError
    handleSubmit: handleSubmit(handleFormSubmit, handleFormError)
  };
};
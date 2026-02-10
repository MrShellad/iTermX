import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { ServerFormValues } from "../domain/schema";

export const useServerConnectionPanel = () => {
  const { register, watch, setValue, formState: { errors } } = useFormContext<ServerFormValues>();
  const [showPassword, setShowPassword] = useState(false);

  // 监听所有需要的字段
  // [修改] 添加了 "proxyId"
  const [connectionType, authType, passwordSource, passwordId, keySource, keyId, proxyId] = watch([
    "connectionType", 
    "authType", 
    "passwordSource", 
    "passwordId", 
    "keySource", 
    "keyId",
    "proxyId" // <--- 新增监听
  ]);

  // 重置为手动输入模式的逻辑
  const resetToManual = (type: 'password' | 'key') => {
    if (type === 'password') {
        setValue("passwordSource", "manual", { shouldDirty: true });
        setValue("passwordId", "", { shouldDirty: true }); // 清除关联ID
        setValue("password", "", { shouldDirty: true });   // 清空当前输入
    } else {
        setValue("keySource", "manual", { shouldDirty: true });
        setValue("keyId", "", { shouldDirty: true });
        setValue("privateKey", "", { shouldDirty: true });
    }
  };

  const handleAuthTypeChange = (type: string) => {
    setValue("authType", type as any, { shouldDirty: true });
  };

  const handleConnectionTypeChange = (type: string) => {
    setValue("connectionType", type as any, { shouldDirty: true });
  };

  return {
    // 表单工具
    register,
    errors,
    setValue,
    watch, // <--- [关键修复] 必须把 watch 导出去！
    
    // 状态值
    connectionType,
    authType,
    passwordSource,
    passwordId,
    keySource,
    keyId,
    proxyId, // <--- [新增] 导出 proxyId
    showPassword,

    // 动作
    setShowPassword,
    resetToManual,
    handleAuthTypeChange,
    handleConnectionTypeChange
  };
};
import { useState, useMemo, useEffect } from "react";
import { useKeyStore } from "@/store/useKeyStore";
import { useSettingsStore } from "@/features/settings/application/useSettingsStore";
import { useServerConnectionPanel } from "../../application/useServerConnectionPanel";
import { ConnectionType } from "@/features/server/domain/types";
import { ProxyItem } from "@/features/settings/domain/types";

export const useConnectionViewModel = () => {
  // =========================================================
  // 1. 底层表单逻辑（唯一真源）
  // =========================================================
  const formLogic = useServerConnectionPanel();
  const { register, errors, setValue, watch } = formLogic;

  // 监听表单关键字段
  const connectionType = watch("connectionType") as ConnectionType | undefined;
  const currentMode: ConnectionType = connectionType || "direct";

  const currentKeyId = watch("keyId");
  const currentProxyId = watch("proxyId");

  // =========================================================
  // 2. UI 状态
  // =========================================================
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // =========================================================
  // 3. 数据源
  // =========================================================
  const { keys } = useKeyStore();
  const { proxies, loadProxies, setActiveCategory } = useSettingsStore();

  // 首次挂载时加载代理列表
  useEffect(() => {
    loadProxies();
  }, [loadProxies]);

  // =========================================================
  // 4. 代理过滤（健壮 & 向后兼容）
  // =========================================================
  const filteredProxies = useMemo(() => {
    if (!proxies || currentMode === "direct") return [];

    return proxies.filter((p: ProxyItem) => {
      const rawType =
        (p.type || (p as any).proxyType || "http").toLowerCase();

      if (currentMode === "http") {
        return rawType === "http" || rawType === "https";
      }

      if (currentMode === "socks5") {
        return rawType === "socks4" || rawType === "socks5";
      }

      return false;
    });
  }, [proxies, currentMode]);

  // =========================================================
  // 5. 密钥显示名
  // =========================================================
  const selectedKeyName = useMemo(() => {
    if (!currentKeyId || !keys) return undefined;
    return keys.find((k: any) => k.id === currentKeyId)?.name;
  }, [keys, currentKeyId]);

  // =========================================================
  // 6. [已移除] 自动清理逻辑
  // =========================================================
  // 🔴 [修改] 移除了 useEffect 自动清理逻辑
  // 这允许用户在 Direct 和 Proxy 模式间切换时，保留 proxyId 的值
  // 即使当前 filteredProxies 为空，表单数据依然保留，直到用户手动修改或保存

  // =========================================================
  // 7. 交互处理
  // =========================================================
  const handleOpenVault = () => setIsKeyModalOpen(true);

  const handleKeySelected = (keyId: string) => {
    setValue("keyId", keyId, { shouldDirty: true });
    setValue("authType", "key", { shouldDirty: true });
    setIsKeyModalOpen(false);
  };

  const handleConnectionTypeChange = (mode: string) => {
    setValue("connectionType", mode as ConnectionType, { shouldDirty: true });

    // 🔴 [修改] 移除了强制清空代理的逻辑
    // setValue("proxyId", undefined, { shouldDirty: true });
  };

  const handleProxySelected = (proxyId: string) => {
    setValue("proxyId", proxyId, { shouldDirty: true });
  };

  const handleManageProxies = () => {
    if (setActiveCategory) {
      setActiveCategory("connection");
    }
  };

  // =========================================================
  // 8. 🔍 调试日志（可随时删除）
  // =========================================================
  console.groupCollapsed("🐛 useConnectionViewModel Debug");
  console.log("① All Form Values:", watch());
  console.log("② mode (currentMode):", currentMode);
  console.log("③ proxyId (currentProxyId):", currentProxyId);
  console.log(
    "④ filteredProxies IDs:",
    filteredProxies.map((p) => p.id)
  );
  console.log("⑤ Raw Proxies from Store:", proxies);
  console.groupEnd();

  // =========================================================
  // 9. 暴露给 UI 的接口
  // =========================================================
  return {
    form: {
      register,
      errors,
      setValue,
      watch,
    },
    logic: {
      ...formLogic,
      connectionType: currentMode,
      proxyId: currentProxyId,
    },
    ui: {
      isKeyModalOpen,
      setIsKeyModalOpen,
      selectedKeyName,
      filteredProxies,
    },
    actions: {
      handleOpenVault,
      handleKeySelected,
      handleConnectionTypeChange,
      handleProxySelected,
      handleManageProxies,
    },
  };
};
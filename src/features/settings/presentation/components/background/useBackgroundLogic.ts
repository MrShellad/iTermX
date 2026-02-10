import { useCallback, useState, useEffect, useTransition } from "react";
import { useShallow } from 'zustand/react/shallow'; 
import { useSettingsStore } from "../../../application/useSettingsStore";

export const useBackgroundLogic = () => {
  const [isPending, startTransition] = useTransition();

  const settings = useSettingsStore(useShallow(s => ({
    sync: s.settings['appearance.syncBackgroundTheme'] ?? false,
    
    // Light Params
    lightImg: s.settings['appearance.lightBackgroundImage'],
    lightBlur: s.settings['appearance.lightBackgroundBlur'] ?? 0,
    lightBright: s.settings['appearance.lightBackgroundBrightness'] ?? 1,
    lightOverlayColor: s.settings['appearance.lightOverlayColor'] ?? '#ffffff',
    lightOverlayOpacity: s.settings['appearance.lightOverlayOpacity'] ?? 0,

    // Dark Params
    darkImg: s.settings['appearance.darkBackgroundImage'],
    darkBlur: s.settings['appearance.darkBackgroundBlur'] ?? 0,
    darkBright: s.settings['appearance.darkBackgroundBrightness'] ?? 1,
    darkOverlayColor: s.settings['appearance.darkOverlayColor'] ?? '#000000',
    darkOverlayOpacity: s.settings['appearance.darkOverlayOpacity'] ?? 0.4,
    
    updateSettings: s.updateSettings
  })));

  // Local sync state for optimistic UI
  const [localSync, setLocalSync] = useState(settings.sync);

  useEffect(() => {
    if (settings.sync !== localSync && !isPending) {
      setLocalSync(settings.sync);
    }
  }, [settings.sync, localSync, isPending]);

  const toggleSync = (checked: boolean) => {
    setLocalSync(checked);
    startTransition(() => {
        if (checked) {
             // 开启同步时，将 Dark 的配置复制到 Universal 和 Light (覆盖)
             const { updateSettings, darkImg, darkBlur, darkBright, darkOverlayColor, darkOverlayOpacity } = settings;
             updateSettings({
                'appearance.syncBackgroundTheme': true,
                // Universal / Light / Dark 全部统一为当前的 Dark 配置
                'appearance.universalImage': darkImg, 'appearance.universalBlur': darkBlur, 'appearance.universalBrightness': darkBright, 'appearance.universalOverlayColor': darkOverlayColor, 'appearance.universalOverlayOpacity': darkOverlayOpacity,
                'appearance.lightBackgroundImage': darkImg, 'appearance.lightBackgroundBlur': darkBlur, 'appearance.lightBackgroundBrightness': darkBright, 'appearance.lightOverlayColor': darkOverlayColor, 'appearance.lightOverlayOpacity': darkOverlayOpacity,
                'appearance.darkBackgroundImage': darkImg, 'appearance.darkBackgroundBlur': darkBlur, 'appearance.darkBackgroundBrightness': darkBright, 'appearance.darkOverlayColor': darkOverlayColor, 'appearance.darkOverlayOpacity': darkOverlayOpacity,
             });
        } else {
             settings.updateSettings({ 'appearance.syncBackgroundTheme': false });
        }
    });
  };

  // Helper for Universal updates (simultaneously update light and dark keys)
  const updateUniversal = useCallback((keySuffix: string, value: any) => {
      settings.updateSettings({
          [`appearance.dark${keySuffix}`]: value,
          [`appearance.light${keySuffix}`]: value,
      });
  }, [settings.updateSettings]);

  return {
    settings,
    isSyncOn: localSync,
    isPending,
    toggleSync,
    updateUniversal
  };
};
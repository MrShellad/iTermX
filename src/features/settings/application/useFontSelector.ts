import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { useTranslation } from "react-i18next"; // 🟢 [新增] 引入翻译钩子

export const useFontSelector = (appliedFont: string, onChange: (val: string) => void) => {
  const { t } = useTranslation(); // 🟢 [新增] 初始化翻译

  // 1. Data State
  const [systemFonts, setSystemFonts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 2. Local UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFont, setSelectedFont] = useState<string>(appliedFont || ""); 
  const [isOpen, setIsOpen] = useState(false);

  // Load Fonts
  useEffect(() => {
    const loadFonts = async () => {
      setLoading(true);
      try {
        const fonts = await invoke<string[]>("get_system_fonts");
        setSystemFonts(fonts);
      } catch (e) {
        console.error("Failed to load fonts", e);
      } finally {
        setLoading(false);
      }
    };
    loadFonts();
  }, []);

  // Sync with prop
  useEffect(() => {
    setSelectedFont(appliedFont || "");
    setSearchTerm(appliedFont || ""); 
  }, [appliedFont]);

  // Filter
  const filteredFonts = useMemo(() => {
    if (!searchTerm) return systemFonts;
    return systemFonts.filter(f => f.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [systemFonts, searchTerm]);

  // Actions
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setIsOpen(true);
    setSelectedFont(val);
  };

  const handleSelectFont = (font: string) => {
    setSelectedFont(font);
    setSearchTerm(font);
    setIsOpen(false);
  };

  const handleReset = () => {
    setSelectedFont("");
    setSearchTerm("");
    onChange("");
    // 🟢 [修改] 本地化提示信息
    toast.info(t('settings.appearance.fontRestored', "Restored system default font"));
  };

  const handleSave = () => {
    onChange(selectedFont);
    
    // 🟢 [修改] 本地化提示信息 (处理动态参数)
    const displayFont = selectedFont || t('settings.appearance.systemDefault', 'System Default');
    toast.success(t('settings.appearance.fontApplied', { 
        font: displayFont, 
        defaultValue: `Font applied: ${displayFont}` 
    }));
    
    setIsOpen(false);
  };

  const hasUnsavedChanges = selectedFont !== (appliedFont || "");

  return {
    loading,
    isOpen,
    setIsOpen,
    searchTerm,
    selectedFont,
    filteredFonts,
    hasUnsavedChanges,
    handleSearchChange,
    handleSelectFont,
    handleReset,
    handleSave
  };
};
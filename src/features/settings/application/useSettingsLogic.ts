import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from './useSettingsStore';
import { SETTING_ITEMS, CATEGORIES } from '../domain/constants';

export const useSettingsLogic = () => {
  const { t } = useTranslation();
  const activeCategory = useSettingsStore((s) => s.activeCategory);
  const searchQuery = useSettingsStore((s) => s.searchQuery);
  const settings = useSettingsStore((s) => s.settings);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  // 核心逻辑：计算当前应该显示的列表
  const displayItems = useMemo(() => {
    // 1. 如果没有搜索，只返回当前分类的项
    if (!searchQuery.trim()) {
      return SETTING_ITEMS.filter(item => item.categoryId === activeCategory);
    }

    // 2. 如果有搜索，全局搜索并返回（扁平化展示）
    const lowerQuery = searchQuery.toLowerCase();
    return SETTING_ITEMS.filter(item => {
      const label = t(item.labelKey).toLowerCase();
      const desc = item.descKey ? t(item.descKey).toLowerCase() : '';
      return label.includes(lowerQuery) || desc.includes(lowerQuery);
    });
  }, [activeCategory, searchQuery, t]);

  // 获取当前分类的标题（搜索模式下显示“搜索结果”）
  const currentTitle = useMemo(() => {
    if (searchQuery.trim()) return t('common.searchResults', 'Search Results');
    const category = CATEGORIES.find(c => c.id === activeCategory);
    return category ? t(category.labelKey) : '';
  }, [activeCategory, searchQuery, t]);

  return {
    displayItems,
    currentTitle,
    settings,
    updateSetting,
    isSearching: !!searchQuery.trim()
  };
};
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTerminalStore } from "@/store/useTerminalStore";

export const useTerminalTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { 
    tabs, 
    activeTabId, 
    sessions,
    setActiveTab, 
    closeTab,
    closeOtherTabs,
    closeAllTabs
  } = useTerminalStore();

  // --- 滚动逻辑 ---
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200; 
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // 监听 Tab 变化和窗口大小
  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [tabs.length]);

  // 自动滚动到激活的 Tab
  useEffect(() => {
    if (activeTabId && scrollContainerRef.current) {
       const activeNode = scrollContainerRef.current.querySelector(`[data-tab-id="${activeTabId}"]`) as HTMLElement;
       if (activeNode) {
          activeNode.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
       }
    }
  }, [activeTabId]);

  // --- 事件处理 ---
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (location.pathname !== '/terminal') {
        navigate('/terminal');
    }
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation();
      closeTab(tabId);
  };

  const handleCloseOthers = (tabId: string) => {
    closeOtherTabs(tabId);
  };

  const handleCloseAll = () => {
    closeAllTabs();
  };

  // 获取 Tab 对应的 Session 状态
  const getTabStatus = (sessionId?: string) => {
    return sessionId ? sessions[sessionId]?.status : 'disconnected';
  };

  return {
    // State
    tabs,
    activeTabId,
    scrollContainerRef,
    canScrollLeft,
    canScrollRight,
    
    // Actions
    scroll,
    checkScroll,
    handleTabClick,
    handleCloseTab,
    handleCloseOthers,
    handleCloseAll,
    getTabStatus
  };
};
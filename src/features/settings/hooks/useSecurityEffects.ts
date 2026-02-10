import { useEffect, useRef, useCallback } from 'react';
import { useSettingsStore } from '@/features/settings/application/useSettingsStore';
import { useKeyStore } from '@/store/useKeyStore';
import { toast } from 'sonner';

export const useSecurityEffects = () => {
  const settings = useSettingsStore((s) => s.settings);
  const { lockVault, status } = useKeyStore();

  // 1. 获取配置
  // 如果没有设置，默认为 0 (禁用)
  const idleTimeoutMinutes = Number(settings['security.idleTimeout'] ?? 0);
  
  // 快捷键配置，默认 Ctrl+Shift+L
  const lockShortcut = (settings['security.lockShortcut'] as string) || 'Ctrl+Shift+L';

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // --- 核心锁定动作 ---
  const doLock = useCallback(() => {
    // 只有在已解锁状态下才执行锁定
    if (status === 'unlocked') {
      console.log('🔒 Executing Vault Lock...');
      lockVault();
      toast.info('Vault locked');
    }
  }, [status, lockVault]);

  // --- A. 自动待机锁定逻辑 ---
  useEffect(() => {
    // 0 = 禁用功能
    if (idleTimeoutMinutes <= 0) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    const startTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      
      if (status === 'unlocked') {
        idleTimerRef.current = setTimeout(() => {
          console.log(`🔒 Idle timeout (${idleTimeoutMinutes}m) reached.`);
          doLock();
        }, idleTimeoutMinutes * 60 * 1000);
      }
    };

    // 交互事件处理 (带1秒节流，避免鼠标移动频繁重置性能问题)
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current > 1000) {
        lastActivityRef.current = now;
        startTimer();
      }
    };

    // 初始化计时
    startTimer();

    // 监听列表
    const events = ['mousedown', 'mousemove', 'keydown', 'wheel', 'touchstart'];
    
    // 使用 capture: true 确保在事件传递初期就捕获到，防止被其他组件阻止
    events.forEach(event => window.addEventListener(event, handleActivity, true));

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach(event => window.removeEventListener(event, handleActivity, true));
    };
  }, [idleTimeoutMinutes, status, doLock]);

  // --- B. 快捷键锁定逻辑 ---
  useEffect(() => {
    if (!lockShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. 预处理：解析快捷键配置
      const keys = lockShortcut.split('+').map(k => k.trim().toLowerCase());
      const configMainKey = keys[keys.length - 1]; 

      // 2. 检查修饰键
      const matchCtrl = keys.includes('ctrl') || keys.includes('control');
      const matchShift = keys.includes('shift');
      const matchAlt = keys.includes('alt');
      const matchMeta = keys.includes('meta') || keys.includes('cmd') || keys.includes('command');

      // 3. 检查主键 (统一转小写比对)
      const pressedMainKey = e.key.toLowerCase();

      // 4. 匹配逻辑
      if (
        pressedMainKey === configMainKey &&
        e.ctrlKey === matchCtrl &&
        e.shiftKey === matchShift &&
        e.altKey === matchAlt &&
        e.metaKey === matchMeta
      ) {
        // 阻止默认行为并锁定
        e.preventDefault();
        e.stopPropagation();
        doLock();
      }
    };

    // 使用 capture: true 确保即使焦点在 Input 组件内，快捷键也能优先触发
    window.addEventListener('keydown', handleKeyDown, true);
    
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [lockShortcut, doLock]);
};
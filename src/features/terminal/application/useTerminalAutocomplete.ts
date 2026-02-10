import { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { invoke } from '@tauri-apps/api/core';
import { SnippetService } from '@/features/snippet/application/snippetService';
import { Snippet } from '@/features/snippet/domain/types';
import { SuggestionItem } from '../components/AutocompletePopup';

const DEBOUNCE_MS = 200;

export const useTerminalAutocomplete = (
  term: Terminal | null, 
  sessionId: string
) => {
  const [visible, setVisible] = useState(false);
  const [cursorInfo, setCursorInfo] = useState({ x: 0, y: 0, lineHeight: 0 });
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputBuffer = useRef('');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // 🟢 [核心修复] 计算光标在屏幕上的绝对位置
  const updateCursorPosition = useCallback(() => {
    if (!term || !term.element) return;
    
    // 1. 稳健的字符尺寸计算 (不依赖私有 API)
    const cellWidth = term.element.clientWidth / term.cols;
    const cellHeight = term.element.clientHeight / term.rows;

    const termRect = term.element.getBoundingClientRect();
    const cursorX = term.buffer.active.cursorX;
    const cursorY = term.buffer.active.cursorY;
    
    // 2. 计算"输入起点"的 X 坐标
    // 悬浮窗应该对齐到当前单词的开头，而不是跟随光标乱跳
    // 当前光标位置 - 已输入字符长度 = 单词起始位置
    const inputLength = inputBuffer.current.length;
    // 简单防越界处理 (防止换行导致的负数，暂不处理复杂多行输入)
    const anchorCursorX = Math.max(0, cursorX - inputLength);

    const screenX = termRect.left + (anchorCursorX * cellWidth);
    const screenY = termRect.top + (cursorY * cellHeight);

    setCursorInfo({
      x: screenX,
      y: screenY,
      lineHeight: cellHeight
    });
  }, [term]);

  const search = async (query: string) => {
    if (!query || query.length < 1) {
      setVisible(false);
      return;
    }

    try {
      const historyPromise = invoke<any[]>('search_history_autocomplete', { 
        query, limit: 10 // 后端多给点，方便前端截取
      }).catch(() => []);
      
      const snippetsPromise = SnippetService.getAll().catch(() => []); //

      const [historyRes, snippetsRes] = await Promise.all([historyPromise, snippetsPromise]);

      // 1. 获取历史记录：取前 3 条 (后端已按全局次数排序)
      const historyItems: SuggestionItem[] = historyRes
        .slice(0, 3) 
        .map((h: any) => ({
          type: 'history' as const,
          value: h.displayCommand || h.display_command || h.normalized_command
        }));

      // 2. 获取代码片段：取前 3 条
      const lowerQuery = query.toLowerCase();
      const snippetItems: SuggestionItem[] = snippetsRes
        .filter((s: Snippet) => 
            (s.language === 'bash' || s.language === 'text') &&
            s.code.toLowerCase().includes(lowerQuery)
        )
        .map((s: Snippet) => ({
          type: 'snippet' as const,
          value: s.code,
          label: s.title
        }))
        .slice(0, 3);

      // 3. 合并：历史前三优先，总数限制在 6 条左右
      const merged = [...historyItems, ...snippetItems];

      if (merged.length > 0) {
        setSuggestions(merged);
        setSelectedIndex(0);
        updateCursorPosition(); 
        setVisible(true);
      } else {
        setVisible(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const applyCompletion = (item: SuggestionItem) => {
    if (!term) return;
    const currentInput = inputBuffer.current;
    const targetCommand = item.value;
    
    if (targetCommand.startsWith(currentInput)) {
        const suffix = targetCommand.slice(currentInput.length);
        if (suffix) {
            invoke('write_ssh', { id: sessionId, data: suffix });
            inputBuffer.current = targetCommand; 
        }
    } else {
        let backspaces = '';
        for(let i=0; i<currentInput.length; i++) backspaces += '\x7f';
        invoke('write_ssh', { id: sessionId, data: backspaces + targetCommand });
        inputBuffer.current = targetCommand;
    }
    setVisible(false);
  };

  useEffect(() => {
    if (!term) return;

    // 🟢 [新增] 监听光标移动
    // 当服务器回显字符导致光标移动时，更新悬浮窗位置
    // 这解决了 typing 时坐标获取滞后的问题
    const cursorDisposable = term.onCursorMove(() => {
        if (visible) updateCursorPosition();
    });

    const dataDisposable = term.onData((data) => {
      if (data === '\r' || data === '\n') {
        inputBuffer.current = '';
        setVisible(false);
      } else if (data === '\x7f') {
        inputBuffer.current = inputBuffer.current.slice(0, -1);
        if (inputBuffer.current.length < 1) setVisible(false);
        else if (visible) {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            debounceTimer.current = setTimeout(() => search(inputBuffer.current), DEBOUNCE_MS);
        }
      } else if (data.charCodeAt(0) < 32) {
        inputBuffer.current = '';
        setVisible(false);
      } else {
        inputBuffer.current += data;
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => search(inputBuffer.current), DEBOUNCE_MS);
      }
    });

    // 监听窗口 resize 以修正坐标
    const resizeHandler = () => {
        if(visible) updateCursorPosition();
    };
    window.addEventListener('resize', resizeHandler);

    const keyHandler = (e: KeyboardEvent) => {
      if (!visible) return true;
      if (e.type === 'keydown') {
        if (e.key === 'ArrowUp') {
          setSelectedIndex(prev => Math.max(0, prev - 1));
          return false;
        }
        if (e.key === 'ArrowDown') {
          setSelectedIndex(prev => Math.min(suggestions.length - 1, prev + 1));
          return false;
        }
        if (e.key === 'Tab') {
          applyCompletion(suggestions[selectedIndex]);
          e.preventDefault();
          return false;
        }
        if (e.key === 'Escape') {
          setVisible(false);
          return false;
        }
      }
      return true;
    };

    term.attachCustomKeyEventHandler(keyHandler);
    
    return () => {
      dataDisposable.dispose();
      cursorDisposable.dispose();
      window.removeEventListener('resize', resizeHandler);
    };
  }, [term, sessionId, visible, suggestions, selectedIndex, updateCursorPosition]);

  return {
    visible,
    cursorInfo,
    suggestions,
    selectedIndex,
    applyCompletion
  };
};
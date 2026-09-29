import { useEffect, useRef } from 'react';

// 按下 ESC 時呼叫 handler。只在掛載期間監聽，且不會 stopPropagation：
// 首頁的 window keydown 監聽（方向鍵換頁）需要照常收到事件。長按（repeat）不重複觸發，
// 避免一次長按把 lightbox 和它底下的 modal 一起關掉。
export function useEscapeKey(handler: () => void) {
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.repeat) latest.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
}

// 【內部機制】首頁各 section 的元素進入畫面時淡入，由 HeroSection、GroupsSection、UpcomingEvents、
// EventReview、JoinSection 使用。修改前先讀內部機制詳解 §2 與 components/internal/README.md。
//
// 這是什麼：元件把回傳的 containerRef 掛在根元素上，裡面帶 data-reveal 的元素進入視窗時加上 revealed class。
// 淡入的樣式（起始透明、位移）寫在各 section 自己的 .module.css 裡。
//
// 為什麼不能簡化：
// - 'revealed' 是字面 class，五個 section 的 .module.css 都以 :global(.revealed) 選取它。
//   改名或改成 CSS Modules 的雜湊 class，五個檔案的淡入都會失效，元素停在透明狀態。
// - data-reveal-follow 是為了 EventReview 的橫向捲動時間軸：IntersectionObserver 會把捲動容器的裁切算進去，
//   被裁在可視範圍外的項目交集永遠是 0。讓它們自己被觀察的話，捲過去時會一直是透明的。
// - 直接改 DOM 而不走 React state，所以帶 data-reveal 的元素 className 必須是固定字串。
//   className 在 render 之間變動時，React 會覆寫掉這裡加上的 revealed，元素會突然消失。
//
// 改了會壞掉什麼：首頁五個 section 的淡入效果；最常見的症狀是內容整塊看不見（一直維持透明）。

import { useEffect, useRef } from 'react';

// 帶 data-reveal 的元素進入視窗時淡入、離開時還原。行為：
// - 只在掛載時 querySelectorAll('[data-reveal]') 一次（之後新增的元素不會被觀察）
// - threshold 0.2；進入視窗時把 data-reveal-delay 寫進 inline transitionDelay 並加上字面 class 'revealed'，離開時移除
// - 卸載時 disconnect
// - 帶 data-reveal-follow 的元素不自己被觀察，而是跟著最近的帶 data-reveal 的祖先同進同出（各自套用自己的 delay）。
//   用於橫向捲動容器裡的項目：IntersectionObserver 會把捲動容器的裁切算進去，被裁在可視範圍外的項目交集永遠是 0，
//   自己觀察的話會一直維持透明，捲到之前完全看不見
//
// 這個 hook 直接改 DOM 的 class / style（React 不知道）。只要 React 沒有重寫該元素的 className / style 就不會被覆蓋，
// 所以帶 data-reveal 的元素不得有會變動的 className（現有元素的 className 都是 render 間不變的字串）。
export function useScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal-follow])');

    const setRevealed = (el: HTMLElement, revealed: boolean) => {
      if (revealed) {
        const delay = el.dataset.revealDelay || '0';
        el.style.transitionDelay = `${delay}ms`;
        el.classList.add('revealed');
      } else {
        el.classList.remove('revealed');
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          setRevealed(el, entry.isIntersecting);
          el.querySelectorAll<HTMLElement>('[data-reveal-follow]').forEach((follower) => {
            if (follower.parentElement?.closest('[data-reveal]') === el) {
              setRevealed(follower, entry.isIntersecting);
            }
          });
        });
      },
      { threshold: 0.2 }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return { containerRef };
}

import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

// 活動頁與小組頁的內容包在 `relative z-10` 的 stacking context 裡，放在裡面的 modal（z-100）
// 與 lightbox（z-200）再高也高不過固定的 Navbar（z-50），關閉按鈕會被 Navbar 蓋住。
// 掛到 body 讓它們和 Navbar 在同一層比較。modal 只在使用者操作之後才會 render，
// 所以 SSR 與 hydration 都不會碰到 document。
export default function ModalPortal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}

# internal/ — 自製機制

這個目錄放的是網站運作所需的自製機制，平常維護（改文字、改版面、加欄位）**不需要碰這裡**。要修改的元件都在 [`../content/`](../content/)。

這裡的程式碼看起來可能比需要的複雜，但每一段都有它的道理：多數是在處理 React、瀏覽器或 SSR 的邊界情況，簡化之後通常不會立刻出錯，而是在特定操作（快速連點、輸入法組字、高解析度螢幕、觸控板捲動）下才壞掉。**修改前請先讀完該檔案開頭的註解，以及下表對應的文件章節。**

## 檔案說明

| 檔案 | 用途 | 使用者 | 修改前先讀 |
|---|---|---|---|
| `SlideTransition.tsx` | 以 key 換掉子元素時的進出場轉場（仿 Vue `<Transition>`） | 小組頁成果輪播（GroupDetail） | 內部機制詳解 §4 |
| `ModalPortal.tsx` | 把 modal 掛到 `<body>`，讓它蓋過固定的 Navbar | EventModal、ShowcaseModal | 內部機制詳解 §5 |
| `CodeRain.tsx` | 背景的 0/1 數字雨動畫，純裝飾 | Background | 檔案開頭註解 |
| `Background.tsx` | 電路圖 SVG 與數字雨組成的背景 | 首頁各 section 與其他頁面 | 檔案開頭註解 |
| [`../../hooks/internal/useScrollReveal.ts`](../../hooks/internal/useScrollReveal.ts) | 首頁各 section 元素進入畫面時淡入 | 首頁五個 section | 內部機制詳解 §2 |

另外，首頁的整頁捲動（滾輪一次換一個 section）寫在 [`../../pages/index.astro`](../../pages/index.astro) 的 `<script>` 裡，也屬於這類機制，說明在該段開頭的註解，內部機制詳解 §6 也有整理。

各元件的 `.module.css` 寫法規則（`:where()`、`:global()`、CSS 變數）見內部機制詳解 §1。

## 常見的連動關係

改動以下任一處時，另一處也要一起確認：

- `SlideTransition` 的 class 序列 ↔ `content/groups/GroupDetail.module.css` 的 `slide-left-*` / `slide-right-*`
- `useScrollReveal` 加上的字面 class `revealed` ↔ 首頁五個 section 的 `.module.css` 裡的 `:global(.revealed)`
- `index.astro` 的 `closest('.modal')` ↔ `content/common/EventModal.tsx` 的字面 class `modal`
- `useEscapeKey` 不攔截事件 ↔ `index.astro` 用方向鍵換頁

## 效能

`CodeRain` 是純裝飾。首頁五個 section 各有一個 `Background`，同時有五個畫布在跑。如果在低階裝置上遇到效能問題，可以把 `Background.tsx` 裡的 `<CodeRain />` 整個拿掉，不影響任何功能，只是視覺變單調。

## 參考文件

- [內部機制詳解（HackMD）](https://hackmd.io/@HcF5PSZWQxW-PSzM1BqJYw/BJxnJPpKze)：§1 CSS Modules 規則、§2 useScrollReveal、§4 SlideTransition、§5 ModalPortal 與 modal、§6 首頁整頁捲動與彈窗
- [根目錄 README.md](../../../../README.md)：整體系統架構
- [INSTALL.md](../../../../INSTALL.md)：部署與建置流程（修改後如何在正式環境重新建置）

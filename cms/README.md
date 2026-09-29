# NCNU ACM CMS 後台介面

ACM 官網內容管理系統（CMS）的前端介面，使用 React 與 TypeScript 建置的單頁應用程式（SPA），社團幹部透過這個介面管理官網的所有動態內容。

## 文件導覽

| 文件 | 內容 |
|---|---|
| [INSTALL.md](INSTALL.md) | 伺服器安裝與部署步驟、日常維運、常見問題 |
| 維護文件 | [React 維護指南（HackMD）](https://hackmd.io/@HcF5PSZWQxW-PSzM1BqJYw/BJxnJPpKze) |
| 本文件 | 功能、認證流程、專案結構 |

## 專案架構

本專案是 ACM 官網系統的其中一部分，整體系統由四個獨立 repo 組成：

| Repo | 說明 |
|---|---|
| [acm-website](https://github.com/NCNU-ACM/acm-website) | 官網前台 |
| [acm-cms-backend](https://github.com/NCNU-ACM/acm-cms-backend) | CMS 後端 API |
| [acm-cms-frontend](https://github.com/NCNU-ACM/acm-cms-frontend)（本專案） | CMS 後台介面 |
| [acm-backup](https://github.com/NCNU-ACM/acm-backup) | 內容資料獨立備份 |

本專案透過 HTTP 呼叫 `acm-cms-backend` 提供的 API，不直接存取檔案系統。

```
幹部登入 → CMS 後台介面（本專案） → CMS 後端 API → 寫入官網 content/
```

正式環境中，本專案 build 出的靜態檔由 CMS 後端一併提供，掛載在 `/admin/` 路徑下，不需要獨立部署。

## 功能

提供五個管理頁面，皆支援新增、編輯、刪除與分頁（每頁 10 筆）：

| 頁面 | 說明 |
|---|---|
| 小組管理 | 編輯小組名稱、介紹、主題色、排序 |
| 活動管理 | 編輯活動公告（標題、日期、地點、內容、連結、報名連結） |
| 幹部管理 | 依學期管理各小組幹部（姓名、職稱、自介、聯絡方式） |
| 成果展示管理 | 編輯成果展示項目，可關聯活動、加入圖集 |
| 全體通知管理 | 編輯全體通知，可控制是否顯示在官網 |

圖片一律填寫外部連結網址，不上傳檔案到伺服器。

## 認證

登入頁面輸入帳密後，向後端 `/api/auth/login` 取得 token，儲存在瀏覽器 `localStorage`。之後每個請求會自動帶上 `Authorization: Bearer {token}` header。

帳密由後端的 `.env` 設定，見 [INSTALL.md](INSTALL.md)。

token 有效期為 24 小時，後端重啟後也會全部失效。為了讓過期的登入盡早被發現，介面會：

- 進入頁面時，若 `localStorage` 有 token，立即向 `/api/auth/verify` 確認：有效就維持登入，無效則清除 token 並停在登入畫面
- 之後每 5 分鐘背景自動檢查一次
- 定時檢查發現 token 失效，或任何請求收到 401 時，自動清除 token 並重新整理頁面，導回登入畫面

> 重新整理頁面會讓還沒儲存的表單內容消失，定時驗證並不保護未儲存的資料，它只影響「何時被導回登入畫面」。填寫較長的內容時，建議先在別處寫好再貼進表單。

## API 位址設定

`src/api/client.ts` 的 `API_BASE` 設為 `/api`，是相對路徑，因此不論部署在哪個網域或 port 都能運作，**更換網域時不需要修改**。

本機開發時由 `vite.config.ts` 的 proxy 把 `/api` 轉發到 `http://127.0.0.1:8000`，開發與正式環境走的路徑完全一致。

`vite.config.ts` 的 `base` 設為 `/admin/`，對應正式環境的掛載路徑。修改這個值會導致 build 出的資源路徑錯誤。

## 本機開發

### 環境需求
- Node.js 22 以上
- 需要 `acm-cms-backend` 在本機 `http://127.0.0.1:8000` 運行中

### 安裝與啟動

```bash
npm install
npm run dev
```

開發伺服器預設啟動在 `http://localhost:5173`。

### 建置

```bash
npm run build
```

建置結果輸出在 `dist/`。正式環境中這個步驟由容器啟動時自動執行，見 [INSTALL.md](INSTALL.md)。

### 型別檢查

```bash
npm run typecheck
```

型別檢查不包含在 `npm run build` 內，型別錯誤不會讓建置失敗，開發時請自行執行。

## 專案結構

```
src/
├── api/
│   └── client.ts          # API 請求封裝，統一處理 token 與錯誤
├── types/
│   └── api.ts             # API 資料型別（依後端 models.py）
├── utils/
│   └── errorMessage.ts    # 把 catch 到的錯誤轉成畫面上的訊息
├── components/            # 每個元件一個 .tsx 與同名的 .module.css
│   ├── Login.tsx
│   ├── GroupsManager.tsx
│   ├── EventsManager.tsx
│   ├── MembersManager.tsx
│   ├── ShowcaseManager.tsx
│   ├── AnnouncementsManager.tsx
│   └── Pagination.tsx     # 共用分頁元件
├── assets/
│   └── main.css           # 全域基礎樣式
├── App.tsx                # 登入判斷 + 側邊導覽 + 頁面切換 + token 定時驗證
├── App.css                # 側邊欄與版面（全域樣式）
└── main.tsx               # 進入點
```

五個 Manager 元件結構相同（載入資料、表格顯示、彈窗表單、新增/編輯/刪除），看懂其中一個即可理解全部。頁面切換以 `App.tsx` 的 `currentView` 狀態搭配條件渲染實作，未使用路由套件。

元件樣式使用 CSS Modules，樣式只作用在該元件內；`App.css` 與 `assets/main.css` 是全域樣式。

維護文件見 [HackMD](https://hackmd.io/@HcF5PSZWQxW-PSzM1BqJYw/BJxnJPpKze)。

## 技術棧

- [React 19](https://react.dev/) 與 [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)

## 相關專案

- [acm-website](https://github.com/NCNU-ACM/acm-website) — 官網前台
- [acm-cms-backend](https://github.com/NCNU-ACM/acm-cms-backend) — CMS 後端 API
- [acm-backup](https://github.com/NCNU-ACM/acm-backup) — 內容資料獨立備份

# NCNU ACM 官方網站

國立暨南國際大學 ACM 學生分會官方網站前台，使用 Astro 搭配 React 建置的靜態網站。

## 文件導覽

| 文件 | 內容 |
|---|---|
| [INSTALL.md](INSTALL.md) | 伺服器安裝與部署步驟、日常維運、常見問題 |
| 維護文件 | [React 維護指南（HackMD）](https://hackmd.io/@HcF5PSZWQxW-PSzM1BqJYw/BJxnJPpKze) |
| 本文件 | 專案架構、資料 schema、頁面結構 |

## 專案架構

本網站是 ACM 官網系統的其中一個部分，整體系統由四個獨立 repo 組成：

| Repo | 說明 | 技術 |
|---|---|---|
| [acm-website](https://github.com/NCNU-ACM/acm-website)（本專案） | 官網前台 | Astro + React |
| [acm-cms-backend](https://github.com/NCNU-ACM/acm-cms-backend) | CMS 後端 API | FastAPI |
| [acm-cms-frontend](https://github.com/NCNU-ACM/acm-cms-frontend) | CMS 後台介面 | React + TypeScript |
| [acm-backup](https://github.com/NCNU-ACM/acm-backup) | 內容資料獨立備份 | - |

社團幹部透過 CMS 後台新增或編輯內容（活動、小組、幹部、成果展示、全體通知），CMS 後端會把資料寫成 Markdown 檔案存放在本專案的 `content/` 資料夾，並自動同步備份一份到 `acm-backup` repo。官網前台讀取 `content/` 底下的 Markdown 檔案，在 build 時靜態生成所有頁面。

```
CMS 後台 → CMS 後端 API → 寫入 content/*.md → 觸發官網 rebuild
                            ↓
                      同步備份到 acm-backup
```

正式環境四個 repo 以單一 Docker 容器運行，官網、CMS 後台與 API 由同一個服務提供，詳見 [INSTALL.md](INSTALL.md)。

## 資料架構

所有內容資料以 Markdown + YAML frontmatter 的格式儲存在 `content/` 資料夾下，依照類型分成五個 collection：

```
content/
├── groups/           # 小組（無學期區分，slug 命名，例如 system.md）
├── events/           # 活動公告（時間戳命名，例如 20260619135815.md）
├── members/          # 幹部（依學期分資料夾，例如 1141/、1152/）
├── showcase/         # 成果展示（依小組分資料夾，例如 system/）
└── announcements/    # 全體通知（時間戳命名）
```

各 collection 的欄位定義在 `src/content.config.ts` 裡用 Zod 驗證，詳細欄位如下：

### groups
| 欄位 | 型別 | 說明 |
|---|---|---|
| `name` | string | 小組名稱 |
| `slug` | string | 網址代稱，同時是檔名 |
| `order` | number | 顯示順序 |
| `tagline` | string | 一句話介紹 |
| `description` | string | 詳細說明 |
| `color` | string | 主題色（hex） |

### events
| 欄位 | 型別 | 說明 |
|---|---|---|
| `title` | string | 活動標題 |
| `event_date` | date | 活動舉辦日期 |
| `created_at` | string | 建立時間戳（同時是檔名） |
| `group` | string | 所屬小組 slug |
| `type` | string | 活動類型 |
| `location` | string（選填） | 地點 |
| `description` | string | 簡介 |
| `content` | string（選填） | 詳細內容 |
| `links` | array（選填） | 相關連結 |
| `registration` | string（選填） | 報名連結 |

### members
| 欄位 | 型別 | 說明 |
|---|---|---|
| `name` | string | 姓名 |
| `group` | string（選填） | 所屬小組 slug，無則為社團整體幹部 |
| `role` | string | 職稱 |
| `bio` | string（選填） | 自我介紹 |
| `avatar` | string（選填） | 頭像圖片網址 |
| `contact` | array（選填） | 聯絡方式 |

### showcase
| 欄位 | 型別 | 說明 |
|---|---|---|
| `title` | string | 項目標題 |
| `group` | string | 所屬小組 slug |
| `date` | date | 日期 |
| `description` | string | 簡介 |
| `related_event` | string（選填） | 關聯活動的 id（用於 modal 切換） |
| `cover_image` | string（選填） | 封面圖網址 |
| `gallery` | array（選填） | 圖集網址 |
| `tags` | array（選填） | 標籤 |
| `links` | array（選填） | 相關連結 |

### announcements
| 欄位 | 型別 | 說明 |
|---|---|---|
| `title` | string | 標題 |
| `created_at` | string | 建立時間戳（同時是檔名） |
| `content` | string | 通知內容 |
| `active` | boolean | 是否顯示在官網上 |

> 圖片一律以外部連結（URL）方式嵌入，不會上傳到伺服器，避免佔用儲存空間。

新增欄位時，同一個欄位要依序改到下面幾個地方，**漏掉任何一處都不會有錯誤訊息，只是欄位默默消失**（以「活動」為例）：

| 位置 | 檔案 | 說明 |
|---|---|---|
| 後端模型 | `acm-cms-backend/models.py` | 模型沒有的欄位會被丟掉，不會寫進 `.md` |
| Content schema | `src/content.config.ts` | 新欄位要加 `.optional()`，否則舊檔案會讓 build 失敗 |
| CMS 型別 | `acm-cms-frontend/src/types/api.ts` | `Input` 與 `Row` 兩個型別 |
| CMS 表單 | `acm-cms-frontend/src/components/` 對應的 Manager | 表單型別、預設值、編輯帶入、送出處理與輸入框 |
| 官網元件型別 | `src/types/content.ts` | 例如 `EventItem` |
| 官網頁面資料 | `src/pages/` 內所有把 collection 整理成元件 props 的 `.map`（見下） | 欄位是手動列出的，不會自動帶過去 |
| 顯示 | `src/components/` 中要顯示該欄位的元件 | 例如 `EventModal.tsx` |

活動資料在 `.astro` 頁面裡共有四處 `.map` 需要補上新欄位：

- `src/pages/index.astro`：`upcoming`
- `src/pages/index.astro`：`past`
- `src/pages/events.astro`：`events`
- `src/pages/groups/[slug].astro`：`groupEvents`

其他 collection 也有各自的 `.map`（例如成果展示在 `index.astro`、`events.astro`、`groups/[slug].astro`，幹部在 `about/members.astro`、`groups/[slug].astro`），改欄位前先在 `src/pages/` 搜尋該欄位所屬 collection 的既有欄位名稱，確認每一處都補上。詳細步驟與範例見維護文件。

## 頁面結構

| 路徑 | 說明 |
|---|---|
| `/` | 首頁（Hero、小組介紹、近期活動、活動回顧、加入我們） |
| `/events` | 活動公告列表（含全體通知） |
| `/about/introduction` | 社團介紹 |
| `/about/members` | 幹部介紹（輪播） |
| `/groups/[slug]` | 小組詳情頁（介紹、幹部、公告、成果展示） |
| `/join` | 加入我們 |

頁面由 `src/pages/` 底下的檔案路徑決定，共用外框在 `src/layouts/BaseLayout.astro`，React 互動元件放在 `src/components/`。維護文件見 [HackMD](https://hackmd.io/@HcF5PSZWQxW-PSzM1BqJYw/BJxnJPpKze)。

## SEO 設定

以下設定與正式網域綁定，**更換網域時三處都要修改**：

| 位置 | 內容 |
|---|---|
| `astro.config.ts` 的 `site` | canonical 連結與 sitemap 的網址來源 |
| `public/robots.txt` | Sitemap 位址 |
| `public/og-image.png` | 社群分享預覽圖，圖片中印有網址文字，需重新製作 |

`BaseLayout.astro` 會自動為每頁產生 canonical、Open Graph 與 Twitter Card 標籤。各頁面應透過 `title` 與 `description` props 傳入自己的標題與描述，首頁不傳 `title` 以使用預設的完整站名。

## 本機開發

### 環境需求
- Node.js 22.12 以上（版本要求定義在 `package.json` 的 `engines`）

### 安裝與啟動

```bash
npm install
npm run dev
```

開發伺服器預設啟動在 `http://localhost:4321`。

### 建置

```bash
npm run build
```

建置結果輸出在 `dist/` 資料夾。

> 正式環境中，`dist/` 由 CMS 後端在資料異動後自動重新建置，並直接由 FastAPI 提供靜態檔，不需要另外部署。

## 技術棧

| 套件 | 用途 |
|---|---|
| [Astro](https://astro.build/) | 靜態網站框架、檔案路由、Content Collections |
| [React](https://react.dev/) | 互動元件（需搭配 `client:load` 才會在瀏覽器執行） |
| Zod | Content Collections 的資料驗證（Astro 內建） |
| [Tailwind CSS](https://tailwindcss.com/) | 工具類樣式 |
| lucide-react | 圖示 |
| figlet | ASCII 文字效果 |
| @astrojs/sitemap | 自動產生 sitemap |

## 相關專案

- [acm-cms-backend](https://github.com/NCNU-ACM/acm-cms-backend) — CMS 後端 API
- [acm-cms-frontend](https://github.com/NCNU-ACM/acm-cms-frontend) — CMS 後台介面
- [acm-backup](https://github.com/NCNU-ACM/acm-backup) — 內容資料獨立備份

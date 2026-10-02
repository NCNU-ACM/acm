# NCNU ACM 官網系統

國立暨南國際大學 ACM 學生分會的官方網站與內容管理系統（CMS）。本 repo 包含官網前台、CMS 後台介面與後端 API，內容備份則放在獨立的 [acm-backup](https://github.com/NCNU-ACM/acm-backup) repo。

## 文件導覽

| 文件 | 內容 |
|---|---|
| [INSTALL.md](INSTALL.md) | 伺服器安裝與部署步驟、從舊版搬遷、日常維運、常見問題 |
| 本文件 | 整體架構、目錄結構、資料流向 |
| [website/README.md](website/README.md) | 官網架構、資料 schema、頁面結構 |
| [cms/README.md](cms/README.md) | CMS 後台功能、認證流程、專案結構 |
| [backend/README.md](backend/README.md) | API 端點、認證機制、資料儲存與備份邏輯 |
| [內部機制詳解（HackMD）](https://hackmd.io/@HcF5PSZWQxW-PSzM1BqJYw/BJxnJPpKze) | 內部機制：轉場、彈窗、淡入、整頁捲動，以及 CMS 的登入驗證與表單慣例。只有要修改這些地方時才需要讀 |

## 系統組成

| 位置 | 說明 | 技術 |
|---|---|---|
| [website/](website/) | 官網前台，讀取 `content/` 的 Markdown 靜態生成所有頁面 | Astro + React |
| [cms/](cms/) | CMS 後台介面，幹部登入後編輯官網內容 | React + TypeScript |
| [backend/](backend/) | CMS 後端 API，讀寫官網內容、同步備份、觸發官網重建，同時提供官網與 CMS 後台的靜態檔 | FastAPI |
| [acm-backup](https://github.com/NCNU-ACM/acm-backup)（獨立 repo） | 官網內容的獨立備份 | - |

本 repo 原本是三個獨立 repo（`acm-website`、`acm-cms-frontend`、`acm-cms-backend`），以 git subtree 合併為 `website/`、`cms/`、`backend/` 三個子目錄，各自的 git 歷史都有保留。

## 目錄結構

部署時本 repo 與 `acm-backup` 必須放在同一層目錄下：

```
ACM/
├── acm/                    本 repo
│   ├── website/
│   │   ├── content/        官網內容（Markdown，不進 git，由 CMS 寫入）
│   │   └── dist/           官網建置結果
│   ├── cms/
│   │   └── dist/           CMS 後台建置結果
│   └── backend/            後端 API，Docker 相關檔案也在這裡
└── acm-backup/             內容備份 repo，後端會自動 commit + push
```

後端以相對路徑存取這些位置，因此 `website/`、`cms/`、`backend/` 與 `acm-backup` 的資料夾名稱都不可更改。`acm-backup` 的位置可用環境變數 `BACKUP_REPO_PATH` 覆寫，一般不需要設定。

## 資料流向

```
CMS 後台 (/admin/) → API (/api/) → 寫入 website/content/*.md
                                    ├→ 同步備份至 acm-backup 並 push
                                    └→ 背景觸發官網重新建置
```

官網內容以 Markdown + YAML frontmatter 存放在 `website/content/`，這個資料夾的 `.md` 檔案不進 git，唯一的備份是 `acm-backup`。每次寫入時，備份會以 `website/content/` 為準整個覆蓋，因此 **content 是空的時候不可以透過 CMS 寫入資料**，否則備份會被清空。新主機安裝或從舊版搬遷時，務必依 [INSTALL.md](INSTALL.md) 先還原內容再啟動服務。

## 執行方式

正式環境以單一 Docker 容器運行：容器啟動時建置 CMS 後台與官網，再由 FastAPI 在同一個 port（8000）提供官網（`/`）、CMS 後台（`/admin/`）與 API（`/api/`）。部署指令都在 `backend/` 目錄下執行，完整步驟見 [INSTALL.md](INSTALL.md)。

本機開發時三個部分各自啟動，方式見各目錄的 README：

| 部分 | 目錄 | 指令 | 預設位址 |
|---|---|---|---|
| 後端 API | `backend/` | `uvicorn main:app --reload` | `http://127.0.0.1:8000` |
| CMS 後台 | `cms/` | `npm run dev` | `http://localhost:5173` |
| 官網 | `website/` | `npm run dev` | `http://localhost:4321` |

CMS 後台的開發伺服器會把 `/api` 轉發到後端，因此開發 CMS 時後端需要同時運行。

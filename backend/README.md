# NCNU ACM CMS 後端

ACM 官網內容管理系統（CMS）的後端 API，使用 FastAPI 建置，負責讀寫官網內容資料（[acm-website](https://github.com/NCNU-ACM/acm-website) 的 `content/` 資料夾）。

正式環境中，本專案同時擔任整個系統的入口：官網與 CMS 後台的靜態檔都由這個服務提供，對外只需要開一個 port。

## 文件導覽

| 文件 | 內容 |
|---|---|
| [INSTALL.md](INSTALL.md) | 伺服器安裝與部署步驟、日常維運、常見問題 |
| 本文件 | API 端點、認證機制、資料儲存與備份邏輯 |
| [React 維護指南（HackMD）](https://hackmd.io/@HcF5PSZWQxW-PSzM1BqJYw/BJxnJPpKze) | 前端 React 教學、專案架構與常見維護任務 |

## 專案架構

本專案是 ACM 官網系統的其中一部分，整體系統由四個獨立 repo 組成：

| Repo | 說明 |
|---|---|
| [acm-website](https://github.com/NCNU-ACM/acm-website) | 官網前台 |
| [acm-cms-backend](https://github.com/NCNU-ACM/acm-cms-backend)（本專案） | CMS 後端 API |
| [acm-cms-frontend](https://github.com/NCNU-ACM/acm-cms-frontend) | CMS 後台介面 |
| [acm-backup](https://github.com/NCNU-ACM/acm-backup) | 內容資料獨立備份 |

本專案預期跟其他三個 repo 放在同一層目錄下，因為會直接讀寫它們的資料夾：

```
ACM/
├── acm-website/
│   ├── content/        ← 本專案讀寫的目標
│   └── dist/           ← 本專案觸發建置並提供的靜態檔
├── acm-cms-backend/    ← 本專案
├── acm-cms-frontend/
│   └── dist/           ← 本專案提供的 CMS 後台靜態檔
└── acm-backup/         ← 本專案會自動同步備份到這裡
```

資料夾名稱不可更改，程式使用相對路徑存取。

## 功能

提供五個 collection 的 CRUD API：`groups`（小組）、`events`（活動）、`members`（幹部）、`showcase`（成果展示）、`announcements`（全體通知）。每次新增/編輯/刪除資料後，會自動：

1. 把變更寫入對應的 Markdown 檔案（`acm-website/content/`）
2. 同步複製一份到獨立備份 repo（`acm-backup`）並 commit + push
3. 於背景觸發官網重新 build

## 路由結構

| 路徑 | 內容 |
|---|---|
| `/` | 官網靜態檔（`acm-website/dist/`） |
| `/admin/` | CMS 後台靜態檔（`acm-cms-frontend/dist/`） |
| `/api/...` | API 端點 |
| `/api/docs` | FastAPI 自動產生的 Swagger UI |

靜態檔在服務啟動時掛載，若 `dist/` 尚未建置則該路徑不會註冊，建置完成後需重啟服務。

## API 端點

所有 API 皆以 `/api` 開頭，後接 collection 名稱：

| Method | 路徑 | 說明 | 需要驗證 |
|---|---|---|---|
| GET | `/api/{collection}` | 列出所有資料 | 否 |
| GET | `/api/groups/{slug}` | 讀取單一小組 | 否 |
| POST | `/api/{collection}` | 新增資料 | 是 |
| PUT | `/api/{collection}/{id}` | 更新資料 | 是 |
| DELETE | `/api/{collection}/{id}` | 刪除資料 | 是 |

`{collection}` 為 `groups`、`events`、`members`、`showcase`、`announcements` 其中之一。`members` 與 `showcase` 因為有子資料夾結構，更新與刪除的路徑為 `/api/members/{semester}/{id}` 與 `/api/showcase/{group}/{id}`。

另外提供：

| Method | 路徑 | 說明 |
|---|---|---|
| POST | `/api/auth/login` | 登入，回傳 token |
| GET | `/api/auth/verify` | 驗證 token 是否有效 |
| GET | `/api/health` | 服務狀態與靜態檔建置狀況 |

## 認證機制

採用簡單的帳號密碼登入，登入成功後取得一組 token（有效期 24 小時），需要驗證的端點透過 `Authorization: Bearer {token}` header 帶入 token。

帳密與其他設定透過環境變數提供，正式環境寫在 `.env`（範本見 `.env.example`）：

```
CMS_USERNAME=admin
CMS_PASSWORD=your_password
GITHUB_TOKEN=github_pat_xxxxxxxx
```

> Token 儲存在記憶體中（`active_tokens` 字典），服務重啟後所有 token 會失效，需要重新登入。

`.env` 不可 commit 進 git，其中的 GitHub token 等同密碼。

## 本機開發

### 環境需求
- Python 3.10 以上

### 安裝與啟動

```bash
python -m venv venv
.\venv\Scripts\Activate.ps1   # Windows
# source venv/bin/activate    # macOS/Linux

pip install -r requirements.txt

uvicorn main:app --reload
```

服務預設啟動在 `http://127.0.0.1:8000`。

本機開發時通常不會有建置好的 `dist/`，此時 `/` 與 `/admin/` 會回 404，只有 `/api/...` 可用，CMS 後台請用 `acm-cms-frontend` 的 `npm run dev` 另外啟動。

### 部署

正式環境以 Docker 容器運行，完整步驟見 [INSTALL.md](INSTALL.md)。

## 資料儲存邏輯

`utils/file_io.py` 負責讀寫 Markdown 檔案，採用 YAML frontmatter 格式：

```markdown
---
title: 範例標題
event_date: 2026-07-01
group: system
---
```

> 不使用 `python-frontmatter` 套件的 `Post` 物件解析/寫入，改用手動的 `yaml.safe_load` 解析與字串拼接寫入，原因是欄位名稱 `content` 會與 `frontmatter.Post` 建構子的 `content` 參數（代表文章本文）衝突。

`generate_timestamp_id()` 產生格式為 `YYYYMMDDHHmmss` 的字串，同時作為檔名與 `created_at` 欄位的值。

新增欄位時要同步修改四個地方：本專案的 `models.py`、`acm-website/src/content.config.ts`、CMS 後台對應的 Manager 元件，以及官網要顯示該欄位的元件。

## Git 備份機制

`utils/git_backup.py` 的 `commit_change()` 會在每次資料異動後，把 `acm-website/content/` 整個同步複製到 `acm-backup` 並執行 commit + push。

推送使用 GitHub fine-grained personal access token，透過 `GITHUB_TOKEN` 環境變數提供，程式會在第一次備份時把 token 寫進 remote URL。未設定 token 時仍會正常寫檔與 commit，僅略過 push。

錯誤訊息不會輸出 git 的完整 stderr，因為 remote URL 含有 token。需要診斷推送問題時請手動執行 git 指令，方式見 [INSTALL.md](INSTALL.md) 的常見問題。

## 官網重新建置

`utils/build_trigger.py` 的 `trigger_rebuild()` 會在背景執行緒中執行 `npm run build`，立即回傳不阻塞 API 回應。

建置期間若再次收到請求，只會標記「待重建」而不會另外啟動程序，避免連續存檔時堆積多個 npm 程序。當前建置結束後若有標記，會再跑一輪。

## 技術棧

- [FastAPI](https://fastapi.tiangolo.com/) — API 框架與靜態檔服務
- [Uvicorn](https://www.uvicorn.org/) — ASGI 伺服器
- [Pydantic](https://docs.pydantic.dev/) — 資料驗證
- PyYAML — frontmatter 解析

## 相關專案

- [acm-website](https://github.com/NCNU-ACM/acm-website) — 官網前台
- [acm-cms-frontend](https://github.com/NCNU-ACM/acm-cms-frontend) — CMS 後台介面
- [acm-backup](https://github.com/NCNU-ACM/acm-backup) — 內容資料獨立備份

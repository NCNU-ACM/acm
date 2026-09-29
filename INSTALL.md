# INSTALL.md — 安裝與部署指南

本文件說明如何從零把 NCNU ACM 官網系統架設起來。照著步驟操作即可完成部署，不需要理解程式碼內容。

整套系統以**單一 Docker 容器**運行，容器內同時提供官網、CMS 後台與 API，對外只開一個 port（8000）。

> 目前的伺服器若還是舊版「四個獨立 repo」的結構（`acm-website`、`acm-cms-backend`、`acm-cms-frontend`、`acm-backup` 並列），**不要照第二節重新安裝**，請改依第十節「從舊版搬遷」操作。

---

## 一、系統需求

| 項目 | 需求 |
|---|---|
| 作業系統 | Linux（Ubuntu 22.04 以上）或 Windows 10/11 |
| Docker | Docker Engine 24 以上，含 Docker Compose v2 |
| 磁碟空間 | 至少 10 GB |
| 記憶體 | 至少 2 GB |
| 對外連線 | 需能連到 github.com 與 registry.npmjs.org |

主機**不需要**另外安裝 Node.js、Python 或 git，這些都在容器內處理。主機只需要 Docker 與 git（用來 clone 專案）。

確認 Docker 可用：

```bash
docker --version
docker compose version
docker run --rm hello-world
```

---

## 二、取得專案

系統由兩個 repo 組成：本 repo（官網、CMS 後台、後端 API 都在裡面）與獨立的內容備份 repo `acm-backup`。兩者必須放在**同一層目錄底下**，且 `acm-backup` 的資料夾名稱不可更改。程式會用相對路徑找到備份 repo，改名或改變層級會導致備份無法運作。

```bash
mkdir ACM
cd ACM

git clone https://github.com/NCNU-ACM/acm.git
git clone https://github.com/NCNU-ACM/acm-backup.git
```

完成後目錄結構應為：

```
ACM/
├── acm/                本 repo
│   ├── website/        官網前台
│   ├── cms/            CMS 後台介面
│   └── backend/        CMS 後端 API（部署指令都在這個目錄下執行）
└── acm-backup/         內容資料備份（獨立 repo）
```

`acm/` 這一層的資料夾名稱可以自訂，本文件一律以 `acm` 為例；底下的 `website/`、`cms/`、`backend/` 不可改名。

> [!CAUTION]
> **`acm-backup` 裡已經有資料時（例如換新主機重新安裝），啟動服務前必須先把內容還原到 `acm/website/content/`，否則 `acm-backup` 會被清空。**
>
> 官網內容（`website/content/` 底下的 `.md`）不在 git 裡，剛 clone 下來的 `acm/website/content/` 是空的。CMS 每次寫入時，會以 `website/content/` 為準**整個覆蓋** `acm-backup`：各資料夾先刪除再複製。content 是空的時候，第一次寫入就會把備份裡的資料全部刪掉並 commit，有設定 token 時還會直接 push 到 GitHub。
>
> 還原方式見第九節「從備份還原內容」，完成後再繼續第三節。

---

## 三、申請 GitHub Token

CMS 每次異動資料後會自動把內容備份推送到 `acm-backup`，這需要一組具備寫入權限的 token。

1. 登入 GitHub，右上角頭像 → **Settings**
2. 左側選單最下方 → **Developer settings**
3. **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
4. 依下表填寫：

| 欄位 | 設定值 |
|---|---|
| Token name | 自訂，例如 `acm-cms-backup` |
| Expiration | 建議一年，到期前需重新申請並更新 `.env` |
| Resource owner | **NCNU-ACM**（不是個人帳號，選錯會導致推送失敗） |
| Repository access | **Only select repositories** → 勾選 `acm-backup` |

5. 捲到 **Permissions** 區塊，點 **Add permissions**，找到 **Contents**，設為 **Read and write**
   - 設定完成後 Repositories 標籤旁的數字應顯示 `1`
   - 只需要這一項權限，其他不要加
   - 這一步很容易漏掉，漏掉會導致推送時出現 403 錯誤
6. 按 **Generate token**，複製產生的字串

> Token 只會顯示一次，離開頁面後無法再查看。請立即複製並保存。
> Token 等同密碼，不可以寫進程式碼或 commit 進 git。

---

## 四、設定環境變數

在 `acm/backend/` 目錄下，複製範本並填寫：

```bash
cd acm/backend
cp .env.example .env
```

編輯 `.env`：

```
# CMS 後台登入帳密，自行設定，這組就是幹部登入時使用的帳密
CMS_USERNAME=admin
CMS_PASSWORD=請改成自訂的密碼

# 第三步取得的 token，整串貼上
GITHUB_TOKEN=github_pat_xxxxxxxxxxxxxxxx

# 以下維持預設即可
BACKUP_REPO_URL=github.com/NCNU-ACM/acm-backup.git
GIT_BRANCH=main
GIT_USER_NAME=ACM CMS Bot
GIT_USER_EMAIL=cms-bot@ncnu-acm.local
```

`CMS_PASSWORD` 請務必修改，不要沿用範本值。

若暫時沒有 token，可將 `GITHUB_TOKEN` 留空。系統仍可正常運作，只是不會推送備份到 GitHub。

`.env.example` 裡還有一個註解掉的 `BACKUP_REPO_PATH`，只有在本機開發、`acm-backup` 不在預設位置時才需要設定。Docker 部署時這個值固定為容器內路徑，`.env` 裡設了也不會生效，不需要理會。

確認 `.env` 已被 git 忽略（`acm/backend/.gitignore` 應包含 `.env`），避免 token 外流。

---

## 五、設定網域

官網的 canonical 連結、sitemap 與社群分享預覽圖都需要完整網址，這些由設定檔中的網域產生。**網域確定後必須修改以下兩個地方**，否則搜尋引擎會收錄到錯誤位址。

**1. `acm/website/astro.config.ts`**

```ts
site: 'https://acm.ncnu.edu.tw',   // 改成實際網域
```

**2. `acm/website/public/robots.txt`**

```
Sitemap: https://acm.ncnu.edu.tw/sitemap-index.xml
```

修改後需重新建置才會生效：

```bash
cd acm/backend
docker compose restart
```

驗證方式見第七節。

> 網站上線後，還需到 [Google Search Console](https://search.google.com/search-console) 驗證網域所有權並提交 sitemap，Google 才會開始收錄。新網域通常需數天到數週才會出現在搜尋結果。

---

## 六、啟動服務

> 啟動前再確認一次：`acm-backup` 裡有資料的話，`acm/website/content/` 必須已經還原（見第二節的警告）。

在 `acm/backend/` 目錄下執行：

```bash
docker compose up --build
```

首次啟動需要安裝前端相依套件並建置官網，約需 5 至 10 分鐘。過程中畫面會停在 npm 安裝階段一段時間，屬正常現象。

依序會看到以下訊息：

```
==> 安裝官網相依套件
==> 安裝 CMS 後台相依套件
==> 建置 CMS 後台
==> 建置官網
==> 啟動 API
INFO:     Uvicorn running on http://0.0.0.0:8000
```

出現最後一行代表啟動完成。

確認無誤後，改用背景模式常駐執行：

```bash
# 先按 Ctrl+C 停止，然後
docker compose up -d
```

`docker-compose.yml` 已設定 `restart: unless-stopped`，主機重開機後容器會自動啟動，不需要另外設定 systemd。

---

## 七、驗證安裝

依序檢查以下三個網址（本機測試用 `localhost`，伺服器上換成主機位址）：

| 網址 | 預期結果 |
|---|---|
| `http://localhost:8000/api/health` | 回傳 JSON，且 `website_built` 與 `cms_built` 皆為 `true` |
| `http://localhost:8000/` | 顯示官網首頁 |
| `http://localhost:8000/admin/` | 顯示 CMS 登入畫面（結尾斜線不可省略） |

### 驗證完整資料流

1. 進入 `/admin/`，以 `.env` 設定的帳密登入
2. 到「通知管理」頁面，新增一筆測試資料並儲存
3. 在 `acm/backend/` 目錄下檢查以下項目：

```bash
# 檔案是否寫入
ls ../website/content/announcements/

# 查看日誌，應出現 [backup] 已推送到 acm-backup 與 [build] 完成
docker compose logs --tail 50
```

4. 前往 GitHub 上的 `NCNU-ACM/acm-backup`，確認有新的 commit
5. 等待約 10 至 20 秒後重新整理 `http://localhost:8000/events`，該筆通知應顯示在頁面上

五項皆通過代表安裝成功。測試資料請記得刪除。

### 驗證 SEO 設定

```bash
# sitemap 是否產生
docker exec acm-website ls /app/acm/website/dist | grep sitemap

# canonical 網址是否正確
docker exec acm-website grep canonical /app/acm/website/dist/index.html
```

應分別看到 `sitemap-index.xml` 與指向正式網域的 canonical 連結。

---

## 八、對外服務設定

容器只監聽 `8000` port，提供的是純 HTTP 服務。正式對外時需在容器前方架設反向代理處理網域與 HTTPS 憑證。

反向代理需將所有請求轉發至 `http://127.0.0.1:8000`，不需要針對 `/api` 或 `/admin` 做額外的路徑規則，容器內部已處理路由。

若要改變對外 port，修改 `docker-compose.yml` 的 `ports` 設定，例如改成 `"8080:8000"` 則對外變為 8080，冒號右側的容器內部 port 維持 8000 不要更動。

---

## 九、日常維運

以下指令除非另外註明，都在 `acm/backend/` 目錄下執行。

### 查看日誌

```bash
docker compose logs -f          # 即時追蹤
docker compose logs --tail 100  # 查看最近 100 行
```

### 停止與啟動

```bash
docker compose stop     # 停止
docker compose start    # 啟動
docker compose restart  # 重啟（修改 .env 或網站原始碼後使用）
```

### 更新程式碼

程式碼有更新時，兩個 repo 都要拉取，再重新建置。在 `ACM/` 目錄下執行：

```bash
cd acm-backup && git pull && cd ..
cd acm && git pull
cd backend
docker compose up -d --build
```

> **從 Vue 版升級到 React 版時必做（前端改寫後的第一次部署）**
>
> 官網與 CMS 後台的前端已由 Vue 改寫為 React + TypeScript，相依套件整組更換。舊的 `node_modules` volume 裡仍是 Vue 版的套件，容器啟動時看到 volume 不是空的就不會重新安裝，導致 CMS 建置失敗，容器不斷重啟，日誌出現 `Cannot find package '@vitejs/plugin-react'`。
>
> 因此上面的 `git pull` 之後、`docker compose up -d --build` 之前，**必須先刪除兩個 `node_modules` volume**，做法見下一節「新增或更新前端套件」。這是這個版本部署時唯一額外的步驟，內容資料（`content/`）與備份不受影響。

### 新增或更新前端套件

**這個情況需要額外步驟，只做 `git pull` 與 `--build` 不會生效。**

容器內的 `node_modules` 存放在獨立的 Docker volume 中，與主機上的目錄互不相通。因此在主機執行 `npm install` 安裝的套件，容器內並不會有，重啟後會出現找不到模組的錯誤。

正確做法是刪除該 volume，讓容器下次啟動時重新安裝：

```bash
cd acm/backend
docker compose down

# 查看實際的 volume 名稱
docker volume ls | grep node_modules

# 刪除官網的（若更新的是 CMS 後台套件，改刪 acm_cms_node_modules）
docker volume rm acm_website_node_modules

docker compose up -d
```

刪除後首次啟動會重新安裝所有套件，時間與初次安裝相當。

若不確定是哪一邊，兩個都刪除即可（從 Vue 版升級到 React 版時，兩個都必須刪）：

```bash
docker compose down
docker volume rm acm_website_node_modules acm_cms_node_modules
docker compose up -d
```

> volume 名稱的前綴是 Docker Compose 的專案名稱，已在 `docker-compose.yml` 以 `name: acm` 固定，不受資料夾名稱影響（另外指定了 `-p` 則例外）。一律以 `docker volume ls | grep node_modules` 實際列出的名稱為準。`docker volume rm` 只能在容器已停止（`docker compose down`）後執行。

### 修改帳密或更新 Token

修改 `.env` 後必須重啟容器才會生效，環境變數只在啟動時讀取：

```bash
docker compose restart
```

### 從備份還原內容

若官網內容資料遺失，或在新主機上安裝時，可從 `acm-backup` 還原。在 `ACM/` 目錄下執行：

```bash
cd acm-backup && git pull && cd ..
cp -r acm-backup/announcements acm/website/content/
cp -r acm-backup/events acm/website/content/
cp -r acm-backup/groups acm/website/content/
cp -r acm-backup/members acm/website/content/
cp -r acm-backup/showcase acm/website/content/
cd acm/backend
docker compose restart
```

Windows 環境請改用 `Copy-Item -Recurse` 或檔案總管直接複製。服務尚未啟動過的話，最後的 `docker compose restart` 省略，直接回到原本的步驟繼續即可。

> 若 `acm-backup` 已經被清空並 commit（見第二節的警告），資料仍在它的 git 歷史裡。先用 `git -C acm-backup log --stat` 找到清空前的最後一個 commit，再用 `git -C acm-backup checkout <commit> -- .` 取回檔案，然後照上面的步驟複製回 content。

---

## 十、從舊版搬遷（四個獨立 repo → 本 repo）

舊版的伺服器上是四個並列的資料夾：

```
ACM/
├── acm-website/
├── acm-cms-backend/
├── acm-cms-frontend/
└── acm-backup/
```

搬遷後 `acm-website`、`acm-cms-backend`、`acm-cms-frontend` 由單一的 `acm/` 取代，`acm-backup` 維持原位不動。

> [!CAUTION]
> **這是搬遷時最嚴重的風險：新服務啟動前，必須先把內容從舊的 `acm-website/content/` 複製到 `acm/website/content/`（第 4 步），否則 `acm-backup` 會被清空。**
>
> 官網內容不在 git 裡，新 clone 的 `acm/website/content/` 是空的。CMS 每次寫入都會以 `website/content/` 為準整個覆蓋 `acm-backup`，content 是空的時候，第一次寫入就會把備份裡的資料全部刪掉並 push 到 GitHub。第 4 步的檢查沒有通過之前，**不要執行第 6 步**。

以下指令都在 `ACM/` 目錄下執行。

**1. 停止舊服務**

新舊服務的容器名稱都是 `acm-website`，舊容器沒停掉的話新容器無法啟動。

```bash
cd acm-cms-backend && docker compose down && cd ..
```

**2. 取得新 repo**

```bash
git clone https://github.com/NCNU-ACM/acm.git
```

**3. 複製環境變數**

`.env` 不在 git 裡，要從舊目錄帶過來：

```bash
cp acm-cms-backend/.env acm/backend/.env
```

**4. 複製官網內容（必做）**

```bash
cp -r acm-website/content/. acm/website/content/
```

Windows 環境請改用 `Copy-Item -Recurse` 或檔案總管，把 `acm-website\content\` 底下的所有資料夾複製到 `acm\website\content\`。

複製完用下面的指令確認舊站的內容都已帶過來：

```bash
diff -r acm-website/content acm/website/content
```

判讀方式：

- **沒有輸出**：成功。
- 只出現 `Only in acm/website/content: ...`：也算成功，這是新 repo 本身附帶的空資料夾或 `.gitkeep`。
- 出現 `Only in acm-website/content...` 或 `Files ... differ`：**複製不完整，不可繼續**，重新執行上面的 `cp` 後再檢查。

再比對 `.md` 檔案數量，兩個數字必須相同，而且舊站有資料的話不應該是 0：

```bash
find acm-website/content -name '*.md' | wc -l
find acm/website/content -name '*.md' | wc -l
```

**5. 確認 `acm-backup` 的狀態**

```bash
git -C acm-backup status
```

應顯示 working tree clean。若有未 commit 的變更，先確認內容再處理，不要直接啟動新服務。

**6. 啟動新服務**

```bash
cd acm/backend
docker compose up -d --build
```

新版的 volume 名稱不同（`acm_` 開頭），首次啟動會重新安裝所有前端套件，約需 5 至 10 分鐘。

**7. 驗證**

依第七節驗證。在 CMS 新增測試資料後，額外確認備份 commit 只包含這次異動的檔案，沒有大量刪除：

```bash
git -C ../../acm-backup show --stat HEAD
```

**8. 清理舊資料**

確認新服務運作一段時間沒有問題後，再刪除舊的 node_modules volume：

```bash
docker volume rm acm-cms-backend_website_node_modules acm-cms-backend_cms_node_modules
```

舊的 `acm-website`、`acm-cms-backend`、`acm-cms-frontend` 資料夾建議先保留一段時間，確定不需要回退後再刪除。`acm-website/content/` 是舊站唯一的內容來源，刪除前務必確認第 4 步已完成。

---

## 十一、常見問題

**官網頁面顯示空白，沒有任何活動或小組資料**

`acm/website/content/` 底下沒有資料。若為全新安裝且 `acm-backup` 也是空的，屬正常現象，透過 CMS 新增資料即可。若原本有資料卻消失，**先不要在 CMS 新增或修改任何資料**（會清空備份，見第二節的警告），依第九節「從備份還原內容」處理。

**日誌出現 `[backup] 錯誤: ... 底下沒有 .git，不是備份 repo，略過備份`**

找不到 `acm-backup` 這個 repo，這時資料仍會寫入官網，只是不會備份。確認 `acm-backup` 與 `acm` 放在同一層目錄、資料夾名稱正確，且是用 `git clone` 取得的。

若 `acm-backup` 原本不存在，Docker 啟動時會自動建立一個空資料夾，這個資料夾不是 git repo。先停止服務並刪除它（在 Linux 上可能需要 `sudo`），重新 clone 後再啟動：

```bash
cd acm/backend && docker compose down && cd ../..
rm -rf acm-backup
git clone https://github.com/NCNU-ACM/acm-backup.git
cd acm/backend && docker compose up -d
```

**`/api/health` 顯示 `website_built: false`**

官網建置失敗。執行 `docker compose logs | grep -i error` 查看錯誤原因，修正後執行 `docker compose restart`。靜態檔在容器啟動時掛載，建置完成後必須重啟才會生效。

**日誌出現 `[backup] push 失敗（return code 128）`**

Token 權限不足或設定錯誤。回到第三步檢查：Resource owner 是否為 NCNU-ACM、是否已加入 Contents 的 Read and write 權限。重新產生 token 並更新 `.env` 後執行 `docker compose restart`。

可用以下指令查看實際錯誤訊息：

```bash
docker exec -it acm-website git -C /app/acm-backup push origin main
```

**建置失敗，出現 `Cannot find module '@astrojs/...'`、`Cannot find package '@vitejs/plugin-react'`、`Cannot find module 'react'` 或類似的找不到套件錯誤**

容器內的 `node_modules` volume 還是舊的：主機端更新了套件（例如從 Vue 版升級到 React 版），但容器內沒有跟著重裝。依第九節「新增或更新前端套件」刪除兩個 `node_modules` volume 後重新啟動。

**啟動時出現 `container name "/acm-website" is already in use`**

舊版的容器還在。從舊版搬遷時，需先在舊的 `acm-cms-backend/` 目錄執行 `docker compose down`（見第十節第 1 步）。

**容器一直重啟，`docker compose ps` 顯示 `Restarting`**

啟動時的安裝或建置失敗了。因為設定了 `restart: unless-stopped`，容器會不斷重試，日誌也會被重複的錯誤洗掉。先停止再查看：

```bash
docker compose stop
docker compose logs --tail 100
```

日誌中最先出現的錯誤才是原因，找到並排除後執行 `docker compose up -d`。

**CMS 後台頁面顯示空白或載入失敗**

確認網址結尾有斜線（`/admin/` 而非 `/admin`）。

**容器啟動後立即結束，日誌出現 `exec ... no such file or directory`**

`docker-entrypoint.sh` 的換行符號被轉換成 Windows 格式（CRLF）。在 `acm/backend/` 目錄執行：

```bash
sed -i 's/\r$//' docker-entrypoint.sh
docker compose up -d --build
```

**修改 `.env` 後設定沒有生效**

環境變數只在容器啟動時讀取，必須執行 `docker compose restart`。

**修改網站原始碼後畫面沒有變化**

官網是靜態網站，在容器啟動時建置。修改原始碼後執行 `docker compose restart` 重新建置。

---

## 十二、系統架構參考

整體架構見 [README.md](README.md)，各元件的詳細說明請參閱各目錄的 README：

| 位置 | 內容 |
|---|---|
| [website/](website/README.md) | 官網架構、資料 schema、頁面結構 |
| [backend/](backend/README.md) | API 端點、認證機制、備份邏輯 |
| [cms/](cms/README.md) | CMS 後台介面說明 |
| [acm-backup](https://github.com/NCNU-ACM/acm-backup)（獨立 repo） | 備份資料結構 |

資料流向：

```
CMS 後台 (/admin/) → API (/api/) → 寫入 website/content/*.md
                                    ├→ 同步備份至 acm-backup 並 push
                                    └→ 背景觸發官網重新建置
```

容器內僅執行 uvicorn 一個程序，官網與 CMS 後台的靜態檔由 FastAPI 直接提供，因此不需要在容器內安裝 Nginx 或程序管理工具。

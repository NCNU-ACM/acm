#!/bin/sh
set -e

# bind mount 進來的 repo 擁有者 UID 可能與容器內使用者不同，
# 不加這行 git 會以 "dubious ownership" 拒絕所有操作
git config --global --add safe.directory '*'

echo "==> 安裝官網相依套件"
cd /app/acm-website
if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    npm ci || npm install
fi

echo "==> 安裝 CMS 後台相依套件"
cd /app/acm-cms-frontend
if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    npm ci || npm install
fi

echo "==> 建置 CMS 後台"
npm run build

echo "==> 建置官網"
cd /app/acm-website
npm run build

echo "==> 啟動 API"
cd /app/acm-cms-backend
exec uvicorn main:app --host 0.0.0.0 --port 8000

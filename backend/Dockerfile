# 以 Node 為基底，再加上 Python。
# 反過來（Python 基底裝 Node）步驟較多，維護者要看的東西也較雜。
FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        python3-venv \
        git \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/acm-cms-backend

# 建立 Python 虛擬環境，避免與系統 Python 套件衝突（Debian 12 起會擋 pip 直接裝）
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# 先只複製 requirements，讓相依套件這層可以被 Docker 快取
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

import os
from fastapi import HTTPException, Header
from datetime import datetime, timedelta
import secrets

ADMIN_USERNAME = os.getenv("CMS_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("CMS_PASSWORD", "changeme")

active_tokens: dict[str, datetime] = {}

TOKEN_EXPIRE_HOURS = 24

def login(username: str, password: str) -> str:
    """驗證帳密，回傳 token"""
    if username != ADMIN_USERNAME or password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="帳號或密碼錯誤")

    token = secrets.token_urlsafe(32)
    active_tokens[token] = datetime.now() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return token


def verify_token(authorization: str = Header(None)):
    """檢查請求帶的 token 是否有效"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="未登入")

    token = authorization.replace("Bearer ", "")
    expire_time = active_tokens.get(token)

    if not expire_time:
        raise HTTPException(status_code=401, detail="無效的登入憑證")

    if datetime.now() > expire_time:
        del active_tokens[token]
        raise HTTPException(status_code=401, detail="登入已過期，請重新登入")

    return True
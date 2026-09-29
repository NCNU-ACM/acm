import os
import shutil
import subprocess

BASE = os.path.dirname(os.path.abspath(__file__))
CONTENT_ROOT = os.path.normpath(os.path.join(BASE, "..", "..", "acm-website", "content"))
BACKUP_REPO_PATH = os.path.normpath(os.path.join(BASE, "..", "..", "acm-backup"))

BACKUP_REPO_URL = os.getenv("BACKUP_REPO_URL", "github.com/NCNU-ACM/acm-backup.git")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GIT_USER_NAME = os.getenv("GIT_USER_NAME", "ACM CMS Bot")
GIT_USER_EMAIL = os.getenv("GIT_USER_EMAIL", "cms-bot@ncnu-acm.local")
GIT_BRANCH = os.getenv("GIT_BRANCH", "main")

_configured = False

def _git(args, check=False):
    """在備份 repo 目錄下執行 git，統一處理編碼避免 Windows cp950 解碼錯誤。"""
    return subprocess.run(
        ["git"] + args,
        cwd=BACKUP_REPO_PATH,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=check,
    )

def _ensure_config():
    """
    第一次備份前設定 git 身分與 remote。
    容器內 bind mount 的 repo 擁有者 UID 可能跟執行者不同，git 會拒絕操作，
    所以要加 safe.directory。
    """
    global _configured
    if _configured:
        return

    subprocess.run(
        ["git", "config", "--global", "--add", "safe.directory", BACKUP_REPO_PATH],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    _git(["config", "user.name", GIT_USER_NAME])
    _git(["config", "user.email", GIT_USER_EMAIL])

    if GITHUB_TOKEN:
        remote = f"https://x-access-token:{GITHUB_TOKEN}@{BACKUP_REPO_URL}"
        _git(["remote", "set-url", "origin", remote])

    _configured = True

def sync_to_backup():
    if not os.path.isdir(CONTENT_ROOT):
        print(f"[backup] 找不到 content 資料夾: {CONTENT_ROOT}", flush=True)
        return

    os.makedirs(BACKUP_REPO_PATH, exist_ok=True)

    for item in os.listdir(CONTENT_ROOT):
        src = os.path.join(CONTENT_ROOT, item)
        dst = os.path.join(BACKUP_REPO_PATH, item)

        if os.path.isdir(src):
            if os.path.exists(dst):
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)

def commit_change(message: str) -> bool:
    try:
        _ensure_config()
        sync_to_backup()

        _git(["add", "."])

        result = _git(["commit", "-m", message])
        if result.returncode != 0:
            combined = f"{result.stdout} {result.stderr}"
            if "nothing to commit" in combined:
                print("[backup] 內容無變更，略過 commit", flush=True)
                return True
            print(f"[backup] commit 警告: {combined}", flush=True)

        if not GITHUB_TOKEN:
            print("[backup] 未設定 GITHUB_TOKEN，略過 push", flush=True)
            return True

        push_result = _git(["push", "origin", GIT_BRANCH])
        if push_result.returncode != 0:
            print(f"[backup] push 失敗（return code {push_result.returncode}）", flush=True)
            return False

        print("[backup] 已推送到 acm-backup", flush=True)
        return True

    except Exception as e:
        print(f"[backup] 備份失敗: {e}", flush=True)
        return False
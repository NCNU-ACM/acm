import os
import subprocess
import threading

WEBSITE_PATH = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "acm-website")
)
DIST_PATH = os.path.join(WEBSITE_PATH, "dist")

# Windows 上 npm 實際是 npm.cmd，subprocess 找不到 npm 會直接 FileNotFoundError
NPM_CMD = "npm.cmd" if os.name == "nt" else "npm"

BUILD_TIMEOUT = 300

_lock = threading.Lock()
_building = False
_pending = False

def _run_build() -> bool:
    """實際執行 npm run build，同步阻塞，只由背景執行緒呼叫。"""
    try:
        result = subprocess.run(
            [NPM_CMD, "run", "build"],
            cwd=WEBSITE_PATH,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=BUILD_TIMEOUT,
        )

        if result.returncode != 0:
            print(f"[build] 失敗:\n{result.stdout}\n{result.stderr}", flush=True)
            return False

        if not os.path.isdir(DIST_PATH):
            print("[build] 找不到 dist 資料夾，build 可能沒有正確完成", flush=True)
            return False

        print("[build] 完成", flush=True)
        return True

    except subprocess.TimeoutExpired:
        print(f"[build] 逾時（超過 {BUILD_TIMEOUT} 秒）", flush=True)
        return False
    except FileNotFoundError:
        print("[build] 找不到 npm，請確認容器或主機已安裝 Node.js", flush=True)
        return False
    except Exception as e:
        print(f"[build] 發生錯誤: {e}", flush=True)
        return False

def _worker():
    """背景執行緒：跑完一輪後檢查期間有沒有新的請求，有就再跑一次。"""
    global _building, _pending

    while True:
        _run_build()

        with _lock:
            if _pending:
                _pending = False
                continue
            _building = False
            return

def trigger_rebuild() -> bool:
    """
    請求重建官網。立即回傳，不會阻塞 API 回應。

    正在 build 時只標記「待重建」，不會累積多個 npm 程序。
    連續存檔多筆資料最多只會多跑一輪 build。
    """
    global _building, _pending

    with _lock:
        if _building:
            _pending = True
            print("[build] 已在建置中，標記為待重建", flush=True)
            return True

        _building = True

    threading.Thread(target=_worker, daemon=True).start()
    print("[build] 已排入背景建置", flush=True)
    return True
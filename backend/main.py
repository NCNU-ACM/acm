import os

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from models import LoginRequest, LoginResponse
from auth import login, verify_token
from routers import groups, events, members, showcase, announcements

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEBSITE_DIST = os.path.normpath(os.path.join(BASE_DIR, "..", "acm-website", "dist"))
CMS_DIST = os.path.normpath(os.path.join(BASE_DIR, "..", "acm-cms-frontend", "dist"))

app = FastAPI(title="NCNU ACM CMS API", docs_url="/api/docs", openapi_url="/api/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4321"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(groups.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(members.router, prefix="/api")
app.include_router(showcase.router, prefix="/api")
app.include_router(announcements.router, prefix="/api")

@app.post("/api/auth/login", response_model=LoginResponse)
def auth_login(req: LoginRequest):
    token = login(req.username, req.password)
    return {"token": token}

@app.get("/api/auth/verify", dependencies=[Depends(verify_token)])
def auth_verify():
    return {"valid": True}

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "message": "NCNU ACM CMS API",
        "website_built": os.path.isdir(WEBSITE_DIST),
        "cms_built": os.path.isdir(CMS_DIST),
    }

if os.path.isdir(CMS_DIST):
    app.mount("/admin", StaticFiles(directory=CMS_DIST, html=True), name="cms")

if os.path.isdir(WEBSITE_DIST):
    app.mount("/", StaticFiles(directory=WEBSITE_DIST, html=True), name="website")
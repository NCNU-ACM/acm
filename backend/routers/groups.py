from fastapi import APIRouter, HTTPException, Depends
from models import GroupCreate, GroupResponse
from utils import file_io
from utils.git_backup import commit_change
from utils.build_trigger import trigger_rebuild
from auth import verify_token

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("", response_model=list[GroupResponse])
def get_groups():
    """列出所有小組"""
    entries = file_io.list_entries("groups")
    entries.sort(key=lambda x: x.get("order", 0))
    return entries


@router.get("/{slug}", response_model=GroupResponse)
def get_group(slug: str):
    """讀取單一小組"""
    entry = file_io.read_entry("groups", slug)
    if not entry:
        raise HTTPException(status_code=404, detail="找不到這個小組")
    return entry


@router.post("", response_model=GroupResponse, dependencies=[Depends(verify_token)])
def create_group(group: GroupCreate):
    """新增小組"""
    existing = file_io.read_entry("groups", group.slug)
    if existing:
        raise HTTPException(status_code=400, detail="這個 slug 已經存在")

    data = group.model_dump()
    file_io.write_entry("groups", group.slug, data)
    commit_change(f"新增小組: {group.name}")
    trigger_rebuild()

    return data


@router.put("/{slug}", response_model=GroupResponse, dependencies=[Depends(verify_token)])
def update_group(slug: str, group: GroupCreate):
    """編輯小組"""
    existing = file_io.read_entry("groups", slug)
    if not existing:
        raise HTTPException(status_code=404, detail="找不到這個小組")

    data = group.model_dump()
    file_io.write_entry("groups", slug, data)
    commit_change(f"更新小組: {group.name}")
    trigger_rebuild()

    return data


@router.delete("/{slug}", dependencies=[Depends(verify_token)])
def delete_group(slug: str):
    """刪除小組"""
    success = file_io.delete_entry("groups", slug)
    if not success:
        raise HTTPException(status_code=404, detail="找不到這個小組")

    commit_change(f"刪除小組: {slug}")
    trigger_rebuild()

    return {"message": "刪除成功"}
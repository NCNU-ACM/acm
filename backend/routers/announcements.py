from fastapi import APIRouter, Depends, HTTPException
from models import AnnouncementCreate, AnnouncementResponse
from utils import file_io
from utils.git_backup import commit_change
from utils.build_trigger import trigger_rebuild
from auth import verify_token

router = APIRouter(prefix="/announcements", tags=["announcements"])

@router.get("", response_model=list[AnnouncementResponse])
def list_announcements():
    entries = file_io.list_entries("announcements")
    return entries

@router.post("", response_model=AnnouncementResponse, dependencies=[Depends(verify_token)])
def create_announcement(item: AnnouncementCreate):
    entry_id = file_io.generate_timestamp_id()
    data = item.model_dump()
    data["created_at"] = entry_id

    file_io.write_entry("announcements", entry_id, data)
    commit_change(f"新增公告: {item.title}")
    trigger_rebuild()

    data["id"] = entry_id
    return data

@router.put("/{entry_id}", response_model=AnnouncementResponse, dependencies=[Depends(verify_token)])
def update_announcement(entry_id: str, item: AnnouncementCreate):
    existing = file_io.read_entry("announcements", entry_id)
    if not existing:
        raise HTTPException(status_code=404, detail="找不到這則公告")
    
    data = item.model_dump()
    data["created_at"] = existing.get("created_at", entry_id)
    file_io.write_entry("announcements", entry_id, data)
    commit_change(f"更新公告: {item.title}")
    trigger_rebuild()

    data["id"] = entry_id
    return data

@router.delete("/{entry_id}", dependencies=[Depends(verify_token)])
def delete_announcement(entry_id: str):
    success = file_io.delete_entry("announcements", entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="找不到這則公告")
    commit_change(f"刪除公告: {entry_id}")
    trigger_rebuild()
    return {"message": "公告已刪除"}
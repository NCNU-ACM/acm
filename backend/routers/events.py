from fastapi import APIRouter, Depends, HTTPException
from models import EventCreate, EventResponse
from utils import file_io
from utils.git_backup import commit_change
from utils.build_trigger import trigger_rebuild
from auth import verify_token

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventResponse])
def list_events():
    entries = file_io.list_entries("events")
    return entries


@router.post("", response_model=EventResponse, dependencies=[Depends(verify_token)])
def create_event(event: EventCreate):
    entry_id = file_io.generate_timestamp_id()
    data = event.model_dump()
    data["created_at"] = entry_id

    file_io.write_entry("events", entry_id, data)
    commit_change(f"新增活動: {event.title}")
    trigger_rebuild()

    data["id"] = entry_id
    return data


@router.put("/{entry_id}", response_model=EventResponse, dependencies=[Depends(verify_token)])
def update_event(entry_id: str, event: EventCreate):
    existing = file_io.read_entry("events", entry_id)
    if not existing:
        raise HTTPException(status_code=404, detail="找不到這個活動")

    data = event.model_dump()
    data["created_at"] = existing.get("created_at", entry_id)
    file_io.write_entry("events", entry_id, data)
    commit_change(f"更新活動: {event.title}")
    trigger_rebuild()

    data["id"] = entry_id
    return data


@router.delete("/{entry_id}", dependencies=[Depends(verify_token)])
def delete_event(entry_id: str):
    success = file_io.delete_entry("events", entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="找不到這個活動")

    commit_change(f"刪除活動: {entry_id}")
    trigger_rebuild()
    return {"message": "活動已刪除"}
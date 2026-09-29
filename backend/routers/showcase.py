from fastapi import APIRouter, HTTPException, Depends
from models import ShowcaseCreate, ShowcaseResponse
from utils import file_io
from utils.git_backup import commit_change
from utils.build_trigger import trigger_rebuild
from auth import verify_token

router = APIRouter(prefix="/showcase", tags=["showcase"])


@router.get("", response_model=list[ShowcaseResponse])
def get_showcase(group: str = None):
    if group:
        entries = file_io.list_entries(f"showcase/{group}")
    else:
        entries = []
        groups = file_io.list_entries("groups")
        for g in groups:
            entries.extend(file_io.list_entries(f"showcase/{g['slug']}"))
    return entries


@router.post("", response_model=ShowcaseResponse, dependencies=[Depends(verify_token)])
def create_showcase(item: ShowcaseCreate):
    entry_id = file_io.generate_timestamp_id()
    data = item.model_dump()

    file_io.write_entry(f"showcase/{item.group}", entry_id, data)
    commit_change(f"新增成果展示: {item.title}")
    trigger_rebuild()

    data["id"] = entry_id
    return data


@router.delete("/{group}/{entry_id}", dependencies=[Depends(verify_token)])
def delete_showcase(group: str, entry_id: str):
    success = file_io.delete_entry(f"showcase/{group}", entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="找不到這個項目")

    commit_change(f"刪除成果展示: {entry_id}")
    trigger_rebuild()

    return {"message": "刪除成功"}

@router.put("/{group}/{entry_id}", response_model=ShowcaseResponse, dependencies=[Depends(verify_token)])
def update_showcase(group: str, entry_id: str, item: ShowcaseCreate):
    existing = file_io.read_entry(f"showcase/{group}", entry_id)
    if not existing:
        raise HTTPException(status_code=404, detail="找不到這個項目")

    data = item.model_dump()

    if item.group != group:
        file_io.write_entry(f"showcase/{item.group}", entry_id, data)
        file_io.delete_entry(f"showcase/{group}", entry_id)
    else:
        file_io.write_entry(f"showcase/{group}", entry_id, data)

    commit_change(f"更新成果展示: {item.title}")
    trigger_rebuild()

    data["id"] = entry_id
    return data
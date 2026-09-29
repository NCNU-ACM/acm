from fastapi import APIRouter, HTTPException, Depends
from models import MemberCreate, MemberResponse
from utils import file_io
from utils.git_backup import commit_change
from utils.build_trigger import trigger_rebuild
from auth import verify_token

router = APIRouter(prefix="/members", tags=["members"])


@router.get("", response_model=list[MemberResponse])
def get_members(semester: str = None):
    if semester:
        entries = file_io.list_entries("members", semester)
    else:
        entries = []
        for sem in file_io.list_semesters("members"):
            entries.extend(file_io.list_entries("members", sem))
    return entries


@router.post("", response_model=MemberResponse, dependencies=[Depends(verify_token)])
def create_member(member: MemberCreate):
    entry_id = file_io.generate_timestamp_id()
    data = member.model_dump(exclude={"semester"})

    file_io.write_entry("members", entry_id, data, semester=member.semester)
    commit_change(f"新增幹部: {member.name}")
    trigger_rebuild()

    data["id"] = entry_id
    data["semester"] = member.semester
    return data


@router.put("/{semester}/{entry_id}", response_model=MemberResponse, dependencies=[Depends(verify_token)])
def update_member(semester: str, entry_id: str, member: MemberCreate):
    existing = file_io.read_entry("members", entry_id, semester)
    if not existing:
        raise HTTPException(status_code=404, detail="找不到這個幹部")

    data = member.model_dump(exclude={"semester"})
    file_io.write_entry("members", entry_id, data, semester=semester)
    commit_change(f"更新幹部: {member.name}")
    trigger_rebuild()

    data["id"] = entry_id
    data["semester"] = semester
    return data


@router.delete("/{semester}/{entry_id}", dependencies=[Depends(verify_token)])
def delete_member(semester: str, entry_id: str):
    success = file_io.delete_entry("members", entry_id, semester)
    if not success:
        raise HTTPException(status_code=404, detail="找不到這個幹部")

    commit_change(f"刪除幹部: {entry_id}")
    trigger_rebuild()

    return {"message": "刪除成功"}
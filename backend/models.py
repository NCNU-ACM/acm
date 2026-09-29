from pydantic import BaseModel
from typing import Optional, List
from datetime import date


class GroupBase(BaseModel):
    name: str
    slug: str
    order: int
    tagline: str
    description: str
    color: str


class GroupCreate(GroupBase):
    pass


class GroupResponse(GroupBase):
    pass


class ContactItem(BaseModel):
    label: str
    url: str


class LinkItem(BaseModel):
    label: str
    url: str


class EventBase(BaseModel):
    title: str
    event_date: str
    group: str
    type: str
    location: Optional[str] = None
    description: str
    content: Optional[str] = None
    links: Optional[List[LinkItem]] = []
    registration: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventResponse(EventBase):
    id: str
    created_at: str


class MemberBase(BaseModel):
    name: str
    group: Optional[str] = None
    role: str
    bio: Optional[str] = None
    avatar: Optional[str] = None
    contact: Optional[List[ContactItem]] = []


class MemberCreate(MemberBase):
    semester: str


class MemberResponse(MemberBase):
    id: str
    semester: str


class ShowcaseBase(BaseModel):
    title: str
    group: str
    date: date
    description: str
    related_event: Optional[str] = None
    cover_image: Optional[str] = None
    gallery: Optional[List[str]] = []
    tags: Optional[List[str]] = []
    links: Optional[List[LinkItem]] = []


class ShowcaseCreate(ShowcaseBase):
    pass


class ShowcaseResponse(ShowcaseBase):
    id: str


class AnnouncementBase(BaseModel):
    title: str
    content: str
    active: bool = False

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementResponse(AnnouncementBase):
    id: str
    created_at: str


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
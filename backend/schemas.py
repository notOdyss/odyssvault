from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class FolderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    parent_id: Optional[int] = None
    vault_id: Optional[int] = None


class FolderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    parent_id: Optional[int] = None


class FolderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    parent_id: Optional[int]
    vault_id: Optional[int]
    created_at: datetime


class NoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(default="")


class NoteCreate(NoteBase):
    folder_id: Optional[int] = None
    vault_id: Optional[int] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = None
    folder_id: Optional[int] = None


class NoteLinkInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str


class NoteResponse(NoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    folder_id: Optional[int]
    vault_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    links_to: List[NoteLinkInfo] = []
    linked_from: List[NoteLinkInfo] = []

    @property
    def filename(self):
        return f"{self.title}.od"


class GraphNode(BaseModel):
    id: int
    title: str
    folder_id: Optional[int] = None


class GraphEdge(BaseModel):
    source: int
    target: int


class GraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]


class UserCreate(BaseModel):
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    username: str
    is_active: bool
    is_guest: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class VaultCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class VaultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    owner_id: int
    is_default: bool
    created_at: datetime


class NoteVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    note_id: int
    title: str
    content: str
    created_at: datetime


class ErrorResponse(BaseModel):
    detail: str

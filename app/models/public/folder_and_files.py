from sqlmodel import SQLModel

class FolderBase(SQLModel):
    name: str

class FolderPublic(FolderBase):
    id: int
    parent_id: int

class FolderUpdate(FolderBase):
    parent_id: int | None = None
    name: str | None = None

class FolderCreate(FolderBase):
    parent_id: int | None = None

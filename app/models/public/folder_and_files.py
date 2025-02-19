from sqlmodel import SQLModel, Field
from fastapi import UploadFile

# Folder classes


class FolderBase(SQLModel):
    name: str | None = None


class FolderPublic(FolderBase):
    id: int
    parent_id: int | None = None


class FolderUpdate(FolderBase):
    parent_id: int | None = None
    name: str | None = None


class FolderCreate(FolderBase):
    parent_id: int | None = None


# File classes

class DocumentBase(SQLModel):
    name: str
    file_url: str


class DocumentPublic(DocumentBase):
    id: int
    folder_id: int | None = None
    

class DocumentCreate(SQLModel):
    folder_id: int | None = None


class DocumentUpdate(SQLModel):
    name: str | None = None
    folder_id: int | None = None

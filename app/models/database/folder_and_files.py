from typing import Optional
from sqlmodel import Field, Relationship
from ..public.folder_and_files import FolderBase, DocumentBase


class Folder(FolderBase, table=True):
    __tablename__ = "folder"
    
    id: int | None = Field(default=None, primary_key=True)
    parent_id: int | None = Field(
        default=None,
        foreign_key="folder.id",
        nullable=True
    )

    # For self-referential relationships
    _remote_side = []

    parent: Optional['Folder'] = Relationship(
        back_populates='subfolders',
        sa_relationship_kwargs={
            "remote_side": lambda: [Folder.id]  # to avoid circular reference
        }
    )
    subfolders: list['Folder'] = Relationship(back_populates='parent')
    documents: list["Document"] = Relationship(back_populates="folder")


class Document(DocumentBase, table=True):
    __tablename__ = "documents"
    
    id: int | None = Field(default=None, primary_key=True)
    folder_id: int | None = Field(default=None, foreign_key="folder.id", nullable=True)
    folder: Folder | None = Relationship(back_populates="documents")
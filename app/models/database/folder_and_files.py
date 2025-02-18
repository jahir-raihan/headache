from pydantic import Field
from sqlmodel import Relationship
from models.public.folder_and_files import FolderBase


class Folder(FolderBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    parent_id: int | None = Field(default=None, foreign_key="folder.id")

    # Define relationship for parent folder
    parent: "Folder" | None = Relationship(back_populates="subfolders", sa_relationship_kwargs={"remote_side": "Folder.id"})

    # Define relationship for subfolders
    subfolders: list["Folder"] = Relationship(back_populates="parent")
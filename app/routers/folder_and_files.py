import os
import shutil
import uuid
from typing import Annotated

from fastapi import APIRouter, UploadFile, Form, File, HTTPException
from sqlmodel import select

from app.db import SessionDep
from app.models.database.folder_and_files import Folder, Document
from app.models.public.folder_and_files import FolderPublic, FolderCreate, FolderUpdate, DocumentCreate, DocumentPublic, \
    DocumentUpdate

router = APIRouter(
    tags=['folder_upload']
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post('/folder-upload')
async def folder_upload(
    paths: Annotated[list[str], Form(description="Relative paths of the files, ordered same as files.")],
    files: Annotated[list[UploadFile], File(description="Upload a folder and use javascript to list out all the files "
                                                        "inside that folder.")],
    session: SessionDep
):
    print("files", files)
    return {"success": "success"}


@router.post('/folder-create', response_model=FolderPublic)
@router.post('/folder-create/{folder_id}', response_model=FolderPublic)
async def folder_create(folder_data: FolderCreate, session: SessionDep, folder_id: int | None = None):
    """
    Endpoint for creating folder.

    :param folder_data:
        - name:
        - parent_id:
    :param session:
    :param folder_id:
    :return FolderPublic:
    """

    # Validate and serialize data
    db_folder = Folder.model_validate(folder_data)
    db_folder.parent_id = folder_id

    # Commit into db
    session.add(db_folder)
    session.commit()
    session.refresh(db_folder)

    return db_folder


@router.patch('/folder-update/{folder_id}', response_model=FolderPublic)
async def folder_update(folder_id: int, folder_data: FolderUpdate, session: SessionDep):
    """
    Endpoint for updating folder, and/or renaming, moving to different folder.

    :param folder_id:
    :param folder_data:
        - name:
        - parent_id:
    :param session:
    :return FolderPublic:
    """

    folder_db = session.get(Folder, folder_id)
    if not folder_db:
        raise HTTPException(status_code=404, detail="Folder not found")

    # Dump and serialize updated data
    update_data = folder_data.model_dump(exclude_unset=True)
    folder_db.sqlmodel_update(update_data)

    # Commit changes into db
    session.add(folder_db)
    session.commit()
    session.refresh(folder_db)

    return folder_db


@router.delete('/folder-delete/{folder_id}')
async def folder_delete(folder_id: int, session: SessionDep):
    """
    Endpoint for deleting folder

    :param folder_id:
    :param session:
    :return dict:
    """

    folder_db = session.get(Folder, folder_id)
    if not folder_db:
        raise HTTPException(status_code=404, detail="Folder not found")

    # Delete & Commit changes into db
    session.delete(folder_db)
    session.commit()
    return {"ok": True}


@router.post('/file-create', response_model=DocumentPublic)
@router.post('/file-create/{folder_id}', response_model=DocumentPublic)
async def file_create(file: UploadFile, session: SessionDep, folder_id: int | None = None):
    """
    Endpoint for creating files

    :param folder_id:
    :param file:
    :param session:
    :return FilePublic:
    """

    # Generate a unique filename to avoid conflicts
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Save the uploaded file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create file record in the database
    new_file = Document(
        name=file.filename,
        file_url=file_path,
        folder_id=folder_id
    )

    session.add(new_file)
    session.commit()
    session.refresh(new_file)

    return new_file


@router.post('/file-update/{file_id}', response_model=DocumentPublic)
async def file_update(file_data: DocumentUpdate, session: SessionDep, file_id: int | None = None):
    """
    Endpoint for updating parent id of a file / changing its name.

    :param file_data:
    :param session:
    :param file_id:
    :return:
    """

    file_db = session.get(Document, file_id)
    if not file_db:
        raise HTTPException(status_code=404, detail="File not found")

    # Dump and serialize updated data
    update_data = file_data.model_dump(exclude_unset=True)
    file_db.sqlmodel_update(update_data)

    # Commit changes into db
    session.add(file_db)
    session.commit()
    session.refresh(file_db)

    return file_db


@router.delete('/file-delete/{file_id}')
async def file_delete(file_id: int, session: SessionDep):
    """
    Endpoint for deleting file

    :param file_id:
    :param session:
    :return dict:
    """

    file_db = session.get(Document, file_id)
    if not file_db:
        raise HTTPException(status_code=404, detail="File not found")

    # Delete & Commit changes into db
    session.delete(file_db)
    session.commit()
    return {"ok": True}


@router.get('/folder-details', response_model=list[FolderPublic])
async def folders(session: SessionDep, q: str | None = None):
    all_folders = session.exec(select(Folder)).all()
    return all_folders

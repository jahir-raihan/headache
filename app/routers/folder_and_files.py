import os
import shutil
import uuid
from io import BytesIO
from typing import Annotated

from fastapi import APIRouter, UploadFile, Form, File, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import select

from app.db import SessionDep
from app.models.database.folder_and_files import Folder, Document
from app.models.public.folder_and_files import FolderPublic, FolderCreate, FolderUpdate, DocumentCreate, DocumentPublic, \
    DocumentUpdate
from app.internals.folder_and_files import stream_progress

router = APIRouter(
    tags=['folder_upload']
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post('/folder-upload')
@router.post('/folder-upload/{folder_id}')
async def folder_upload(
    paths: Annotated[list[str], Form(description="Relative paths of the files, ordered same as files.")],
    files: Annotated[list[UploadFile], File(description="Upload a folder and use javascript to list out all the files "
                                                        "inside that folder.")],
    session: SessionDep,
    folder_id: int | None = None
):
    # Eagerly read each file's content and create in-memory copies.
    files_copies = []
    for file in files:
        content = await file.read()  # read the entire file
        # Create a new BytesIO object to act as a file-like object.
        file_copy = UploadFile(filename=file.filename, file=BytesIO(content))
        files_copies.append(file_copy)

    # Pass the file copies to your streaming generator.
    return StreamingResponse(
        stream_progress(paths, files_copies, session, folder_id),
        media_type="text/event-stream"
    )


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


@router.get('/folder-details', response_model=dict[str, list[FolderPublic] | list[DocumentPublic]])
@router.get('/folder-details/{folder_id}', response_model=dict[str, list[FolderPublic] | list[DocumentPublic]])
async def folder_details(
    session: SessionDep,
    folder_id: int | None = None,
    q: str | None = None
):
    """
    Fetch folders and documents, with optional filtering by folder_id and search query.

    :param session:
    :param folder_id:
    :param q:
    :return dict:
    """

    # Base query
    folder_query = select(Folder)
    document_query = select(Document)

    # Filter folders and files
    folder_query = folder_query.where(Folder.parent_id == folder_id)
    document_query = document_query.where(Document.folder_id == folder_id)

    if q:  # Apply search filter
        search_filter = f"%{q}%"

        folder_query = folder_query.where(Folder.name.ilike(search_filter))
        document_query = document_query.where(Document.name.ilike(search_filter))

    # Execute queries
    matching_folders = session.exec(folder_query).all()
    matching_documents = session.exec(document_query).all()

    return {"folders": matching_folders, "documents": matching_documents}

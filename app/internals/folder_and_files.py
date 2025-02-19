import asyncio
import json
import os
import shutil
import uuid
from select import select

from app.models.database.folder_and_files import Folder, Document

from fastapi import UploadFile

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

STAGES = {
    'VALIDATION': 'file_validation',
    'DOCUMENT_CREATION': 'document_creation',
    'FOLDER_STRUCTURE': 'folder_structure',
    'RELATION_UPDATE': 'file_folder_relation',
    'ERROR': 'error',
    'COMPLETE': 'upload_complete'
}


# Helper function to create a document
async def create_document(file: UploadFile, session):
    """
    Creates a document entry and stores the file locally.
    """
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Save file locally
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_file = Document(name=file.filename, file_url=file_path)

    # Add to session and commit
    session.add(new_file)
    await session.commit()
    await session.refresh(new_file)

    return new_file


# Get folder by name and parent
async def get_folder_by_name(session, name: str, parent_folder: int | None = None):
    statement = select(Folder).where(Folder.name == name, Folder.parent_id == parent_folder)
    result = await session.exec(statement)
    return result.first()


# Generate a unique folder name if one already exists
async def get_unique_folder_name(session, name: str, parent_folder: int | None = None):
    base_name = name
    counter = 0
    current_name = base_name

    while await get_folder_by_name(session, current_name, parent_folder) is not None:
        counter += 1
        current_name = f"{base_name} ({counter})"

    return current_name, (counter > 0)


# Streaming function for file upload and folder structure creation
async def stream_progress(paths: list[str], files: list[UploadFile], session, folder_id: int | None = None):
    try:
        all_files = files
        all_paths = paths
        folder_mapper = {}
        documents_to_update = []
        renamed_folders = []

        # Determine root folder
        yield json.dumps({"stage": STAGES['FOLDER_STRUCTURE'], "message": "Determining root folder"}) + "\n"
        await asyncio.sleep(0.1)

        root_folder_path = ""
        if folder_id:
            root_folder = await session.get(Folder, folder_id)
            if not root_folder:
                yield json.dumps({"stage": STAGES['ERROR'], "message": "Parent folder not found"}) + "\n"
                return
            root_folder_path = os.path.normpath(root_folder.name)
            folder_mapper[root_folder_path] = root_folder

        # Normalize paths
        normalized_paths = [
            os.path.normpath(f"{root_folder_path}/{path}") if root_folder_path else os.path.normpath(path)
            for path in all_paths
        ]

        # Create documents
        yield json.dumps({"stage": STAGES['DOCUMENT_CREATION'], "message": "Creating documents"}) + "\n"
        await asyncio.sleep(0.1)

        created_count = 0
        failed_files = []
        documents = []

        for file in all_files:
            try:
                document = await create_document(file, session)
                documents.append(document)
                created_count += 1

                # Yield progress
                yield json.dumps({
                    "stage": STAGES['DOCUMENT_CREATION'],
                    "message": f"Successfully created document: {file.filename}",
                    "created_count": created_count,
                    "valid_files_count": len(all_files)
                }) + "\n"

                await asyncio.sleep(0.1)

            except Exception as e:
                failed_files.append(file.filename)
                yield json.dumps({
                    "stage": STAGES['DOCUMENT_CREATION'],
                    "message": f"Failed to create document: {file.filename}",
                    "error": str(e)
                }) + "\n"
                await asyncio.sleep(0.1)

        document_mapper = {path: doc for doc, path in zip(documents, normalized_paths)}

        # Create folder structure
        yield json.dumps({"stage": STAGES['FOLDER_STRUCTURE'], "message": "Creating folder structure"}) + "\n"

        for full_path in normalized_paths:

            path_parts = []
            current_path = full_path

            while True:
                current_path, part = os.path.split(current_path)
                if part:
                    path_parts.append(part)
                elif current_path:
                    path_parts.append(current_path)
                    break
                else:
                    break

            path_parts = list(reversed(path_parts))

            for i in range(len(path_parts)):
                current = path_parts[i]
                current_full_path = os.path.normpath('/'.join(path_parts[:i + 1]))
                parent_path = os.path.normpath('/'.join(path_parts[:i])) if i > 0 else None

                if "." in current:  # It's a file
                    document = document_mapper.get(full_path)
                    if document:
                        parent_folder = folder_mapper.get(parent_path)
                        document.folder_id = parent_folder.id if parent_folder else None
                        documents_to_update.append(document)
                else:  # It's a folder
                    if current_full_path not in folder_mapper:
                        parent_folder = folder_mapper.get(parent_path)

                        # Ensure unique folder names
                        unique_name, was_renamed = await get_unique_folder_name(session, current, parent_folder.id if parent_folder else None)

                        if was_renamed:
                            renamed_folders.append({
                                'original_path': current_full_path,
                                'new_name': unique_name,
                                'parent_folder': parent_folder.name if parent_folder else None
                            })

                        folder = Folder(name=unique_name, parent_id=parent_folder.id if parent_folder else None)
                        session.add(folder)
                        await session.commit()
                        await session.refresh(folder)

                        folder_mapper[current_full_path] = folder

        # Update document-folder relationships
        yield json.dumps({"stage": STAGES['RELATION_UPDATE'], "message": "Updating document relationships"}) + "\n"
        await asyncio.gather(*[session.merge(doc) for doc in documents_to_update])
        await session.commit()

        # Final response
        yield json.dumps({
            "stage": STAGES['COMPLETE'],
            "message": "Upload complete",
            "total_files": len(all_files),
            "total_folders": len(folder_mapper) - (1 if folder_id else 0)
        }) + "\n"

    except Exception as e:
        yield json.dumps({"stage": STAGES['ERROR'], "message": str(e)}) + "\n"

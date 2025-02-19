from fastapi import FastAPI
from app.db import create_db_and_tables
from app.models.database.folder_and_files import Folder, Document

from .routers import file_folders


# Lifespan function
async def lifespan(app: FastAPI):
    """
    Run application startup logics
    """

    # create tables
    await create_db_and_tables()

    # Yield control back to FastAPI
    yield

app = FastAPI(lifespan=lifespan)


app.include_router(file_folders.router)


@app.get('/', tags=['root'])
async def home():
    return {"message": "Hello world!"}

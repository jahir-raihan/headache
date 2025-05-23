from fastapi import FastAPI
from .db import create_db_and_tables
from .models.database.folder_and_files import Folder, Document
from fastapi.middleware.cors import CORSMiddleware

from .routers import folder_and_files


# Lifespan function
async def lifespan(app: FastAPI):
    """
    Run application startup logics
    """

    # create tables
    await create_db_and_tables()

    # Yield control back to FastAPI
    yield

app = FastAPI()

# Cors config
origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router configs
app.include_router(folder_and_files.router)


@app.get('/', tags=['root'])
async def home():
    return {"message": "Hello world!"}

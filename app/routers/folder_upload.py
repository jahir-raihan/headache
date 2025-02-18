from fastapi import APIRouter

router = APIRouter(
    tags=['folder_upload']
)

@router.post('/folder-upload')
async def folder_upload(form_data):
    pass
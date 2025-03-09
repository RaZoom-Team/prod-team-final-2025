from fastapi import APIRouter, File, Response

from src.config import settings
from src.core.exc import HTTPErrorModel
from src.schemes import UploadFileResponse
from src.service.files import FileServiceDep

router = APIRouter(prefix="/files", tags=["Files"])

@router.post(
    "",
    responses={
        400: {
            "model": HTTPErrorModel,
            "description": "Невалидное изображение"
        }
    }
)
async def upload_file(service: FileServiceDep, file: bytes = File(...)) -> UploadFileResponse:
    """
    Загрузка изображения на сервер<br>
    Возвращает `400` если файл не является валидным изображением
    """
    filename = await service.upload_file(file)
    return UploadFileResponse(
        image_id=filename,
        image_url=settings.api_url + "/files/" + filename
    )

@router.get("/{filename}", include_in_schema=False)
async def download_file(service: FileServiceDep, filename: str):
    data = await service.download_file(filename)
    return Response(
        content = data,
        media_type = "image/jpeg"
    )
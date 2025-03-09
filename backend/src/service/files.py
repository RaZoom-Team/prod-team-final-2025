import io
import uuid
from typing import Annotated

from PIL import Image, UnidentifiedImageError
from aiobotocore.client import AioBaseClient
from botocore.exceptions import ClientError
from fastapi import Depends

from src.config import settings
from src.core.exc import NotFoundError, BadRequestError
from src.core.aws import AWSClientDep


class FileStorageService:

    def __init__(self, client: AioBaseClient):
        self.client = client

    @staticmethod
    async def _convert_file(file: bytes) -> bytes:
        img_data = io.BytesIO()
        try:
            with Image.open(io.BytesIO(file)) as img:
                img = img.convert("RGB")
                img.save(img_data, "JPEG", optimize=True)
            img_data.seek(0)
            return img_data.read()
        except (UnidentifiedImageError, OSError):
            raise BadRequestError("Invalid image")

    async def upload_file(self, file: bytes) -> str:
        filename = str(uuid.uuid4()) + ".jpeg"
        await self.client.put_object(
            Bucket=settings.aws_images_bucket,
            Key=filename,
            Body=await self._convert_file(file)
        )
        return filename

    async def download_file(self, filename: str) -> bytes:
        try:
            res = await self.client.get_object(Bucket=settings.aws_images_bucket, Key=filename)
            return await res["Body"].read()
        except ClientError:
            raise NotFoundError

    async def is_file_exists(self, filename: str) -> bool:
        try:
            await self.client.head_object(Bucket=settings.aws_images_bucket, Key=filename)
            return True
        except ClientError:
            return False

def create_file_service(client: AWSClientDep) -> FileStorageService:
    return FileStorageService(client)

FileServiceDep = Annotated[FileStorageService, Depends(create_file_service)]

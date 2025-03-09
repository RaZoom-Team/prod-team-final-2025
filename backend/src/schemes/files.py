from pydantic import BaseModel


__all__ = ("UploadFileResponse",)


class UploadFileResponse(BaseModel):
    image_id: str
    image_url: str
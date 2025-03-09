from pydantic import BaseModel


__all__ = ("CreateSchemeDTO", "UpdateSchemeDTO")


class CreateSchemeDTO(BaseModel):
    floor: int
    image_id: str

class UpdateSchemeDTO(BaseModel):
    floor: int = None
    image_id: str = None
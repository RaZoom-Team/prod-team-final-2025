from typing import Annotated

from pydantic import BaseModel, Field, computed_field, model_validator

from src.config import settings
from src.core.utils import undefined
from .place import PlaceDTO

__all__ = ("CreateBuildingDTO", "BuildingDTO", "UpdateBuildingDTO", "BuildingFloor")


NameField = Annotated[str, Field(description="Название коворкинга", min_length=1, examples=[""])]

class CreateBuildingDTO(BaseModel):
    name: str
    description: str
    open_from: int | None = None
    open_till: int | None = None
    address: str
    x: float
    y: float
    images_id: list[str] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_open_hours(self):
        if type(self.open_from) != type(self.open_till):
            raise ValueError("open_from and open_till should be both None or int")
        if self.open_from is not None:
            if self.open_from >= self.open_till:
                raise ValueError("open_from should be less than open_till")
        return self


class UpdateBuildingDTO(BaseModel):
    name: str = undefined
    description: str = undefined
    open_from: int | None = undefined
    open_till: int | None = undefined
    address: str = undefined
    x: float = undefined
    y: float = undefined
    images_id: list[str] = undefined


class BuildingDTO(CreateBuildingDTO):
    id: int

    @computed_field
    @property
    def image_urls(self) -> list[str]:
        return [f"{settings.api_url}/files/{image_id}" for image_id in self.images_id]


class BuildingFloor(BaseModel):
    floor: int
    image_id: str
    places: list[PlaceDTO]

    @computed_field
    @property
    def image_url(self) -> str:
        return f"{settings.api_url}/files/{self.image_id}"
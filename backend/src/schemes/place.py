from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, computed_field, model_validator

from src.config import settings


__all__ = ("CreatePlaceDTO", "PlaceDTO", "SearchPlaceRequest", "PlaceVisitDTO", "UpdatePlaceDTO")

from src.core.utils import undefined


class CreatePlaceDTO(BaseModel):
    name: str
    features: List[str] = Field(default=[])
    size: int = Field(default=1)
    rotate: int = Field(default=0)
    x: Optional[float] = Field(default=None)
    y: Optional[float] = Field(default=None)
    image_id: Optional[str] = Field(default=None)

class UpdatePlaceDTO(BaseModel):
    name: str = undefined
    features: List[str] = undefined
    size: int = undefined
    rotate: int = undefined
    x: Optional[float] = undefined
    y: Optional[float] = undefined
    image_id: Optional[str] = undefined

class PlaceDTO(CreatePlaceDTO):
    id: int
    building_id: int
    floor: int

    @computed_field
    @property
    def image_url(self) -> str | None:
        return f"{settings.api_url}/files/{self.image_id}" if self.image_id else None


class SearchPlaceRequest(BaseModel):
    start_time: datetime
    end_time: datetime

    @model_validator(mode="after")
    def validate_time(self):
        if self.start_time > self.end_time:
            raise ValueError("Start time should be less than end time")
        # if self.start_time.timestamp() % 3600 != 0 or self.end_time.timestamp() % 3600 != 0:
        #     raise ValueError("Time should be rounded to hours")
        return self


class PlaceVisitDTO(BaseModel):
    id: int
    client_id: int
    place_id: int
    visit_from: datetime
    visit_till: datetime
    is_visited: bool
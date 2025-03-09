from datetime import datetime

import pytz
from pydantic import BaseModel, computed_field, model_validator, Field

from .place import PlaceDTO


__all__ = ("CreateVisitorDTO", "VisitorDTO", "PlaceVisitDTO", "CreateVisitFeedbackDTO", "FeedbackDTO")

from ..models import Feedback, PlaceVisit


class CreateVisitorDTO(BaseModel):
    visit_from: datetime
    visit_till: datetime

    @model_validator(mode="after")
    def validate_dates(self):
        if type(self) != CreateVisitorDTO:
            return self
        if self.visit_from > self.visit_till:
            raise ValueError("Start time should be less than end time")
        total_range = (self.visit_till.astimezone(pytz.UTC) - self.visit_from.astimezone(pytz.UTC)).total_seconds()

        if total_range <= 0 or total_range > 12 * 3600:
            raise ValueError("Time range should be between 1 and 12 hours")
        if datetime.now(pytz.UTC) > self.visit_from.astimezone(pytz.UTC):
            raise ValueError("Start time can not be in the past")
        return self

class VisitorDTO(CreateVisitorDTO):
    place_id: int
    client_name: str

    @classmethod
    def from_db(cls, visit: PlaceVisit):
        return VisitorDTO(
            **visit.__dict__,
            client_name=visit.client.name
        )

class PlaceVisitDTO(CreateVisitorDTO):
    id: int
    place: PlaceDTO
    is_visited: bool
    is_feedbacked: bool

    @computed_field
    @property
    def is_ended(self) -> bool:
        return self.visit_till < datetime.now(pytz.UTC)

class CreateVisitFeedbackDTO(BaseModel):
    rating: int = Field(ge=1, le=5)
    text: str

class FeedbackDTO(BaseModel):
    id: int
    client_name: str
    text: str
    rating: int = Field(ge=1, le=5)
    created_at: datetime

    @classmethod
    def from_db(cls, feedback: Feedback):
        return FeedbackDTO(
            **feedback.__dict__,
            client_name=feedback.client.name
       )
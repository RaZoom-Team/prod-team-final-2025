from datetime import datetime

from pydantic import BaseModel, EmailStr

from src.enums import AccessLevel
from .place import PlaceDTO
from .visitor import (VisitorDTO)  # noqa


__all__ = ("CreateClientDTO", "ClientDTO", "UpdateClientDTO", "ClientDTOWithVisits", "ClientCurrentVisitDTO")


class CreateClientDTO(BaseModel):
    name: str
    email: EmailStr
    password: str


class UpdateClientDTO(BaseModel):
    name: str


class ClientDTO(BaseModel):
    id: int
    name: str
    email: EmailStr
    access_level: AccessLevel


class ClientDTOWithVisits(ClientDTO):
    visits: VisitorDTO


class ClientCurrentVisitDTO(BaseModel):
    id: int
    name: str
    visit_id: int
    visit_from: datetime
    visit_till: datetime
    is_feedbacked: bool
    place: PlaceDTO

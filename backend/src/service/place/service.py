import datetime
from typing import Annotated

import pytz
from fastapi import Depends
from sqlalchemy.exc import IntegrityError

from src.core.exc import BadRequestError, ConflictError, NotFoundError
from src.core.utils import get_seconds_from_begin_day, undefined
from src.models import BuildingFloorImage, Feedback, Place, PlaceVisit, Building
from src.repo.place import PlaceRepoDep, PlaceRepository
from src.schemes import CreateVisitorDTO, CreatePlaceDTO, UpdatePlaceDTO, CreateVisitFeedbackDTO, UpdateSchemeDTO
from src.schemes.scheme import CreateSchemeDTO
from src.service.files import FileServiceDep, FileStorageService


class PlaceService:

    def __init__(self, repo: PlaceRepository, file_service: FileStorageService):
        self.repo = repo
        self.file_service = file_service

    async def get_by_id(self, place_id: int) -> Place:
        return await self.repo.get_by_id(place_id)

    async def get_all_by_building_id(self, building_id: int) -> list[Place]:
        return await self.repo.search_by_building_id(building_id)

    async def get_visits_by_building_id(self, building_id: int) -> list[PlaceVisit]:
        return await self.repo.get_visits_by_building_id(building_id)

    async def create_scheme(self, building_id: int, data: CreateSchemeDTO):
        if await self.is_place_floor_exists(building_id, data.floor):
            raise ConflictError("Floor already exists")
        if not await self.file_service.is_file_exists(data.image_id):
            raise BadRequestError(f"File {data.image_id} does not exist")
        try:
            await self.repo.insert_floor(BuildingFloorImage(
                building_id=building_id,
                floor=data.floor,
                image_id=data.image_id
            ))
        except IntegrityError:
            raise NotFoundError("Building not found")

    async def create_place(self, building_id: int, floor: int, data: CreatePlaceDTO) -> Place:
        if not await self.is_place_floor_exists(building_id, floor):
            raise NotFoundError("Floor not found")
        if data.image_id and not await self.file_service.is_file_exists(data.image_id):
            raise BadRequestError(f"File {data.image_id} does not exist")
        return await self.repo.insert_place(Place(
            **data.model_dump(),
            floor=floor,
            building_id=building_id
        ))

    async def is_place_floor_exists(self, building_id: int, floor: int) -> bool:
        return await self.repo.is_place_floor_exists(building_id, floor)

    async def delete_floor(self, building_id: int, floor: int) -> None:
        if not await self.is_place_floor_exists(building_id, floor):
            raise NotFoundError("Floor not found")
        await self.repo.delete_floor(building_id, floor)

    async def update_floor(self, building: Building, floor: int, data: UpdateSchemeDTO) -> None:
        if not self.is_place_floor_exists(building.id, floor):
            raise NotFoundError("Floor not found")
        if data.floor is not None:
            if not self.is_place_floor_exists(building.id, data.floor):
                raise ConflictError("New floor already exists")
        if data.image_id and not self.file_service.is_file_exists(data.image_id):
            raise BadRequestError(f"File {data.image_id} does not exist")
        await self.repo.update_places_floor(building.id, floor, data.floor, data.image_id)

    async def insert_visit(self, visitor_id: int, place: Place, data: CreateVisitorDTO) -> PlaceVisit:
        await place.awaitable_attrs.building

        if place.building.open_from is not None and (
            place.building.open_from > get_seconds_from_begin_day(data.visit_from) or
            place.building.open_till < get_seconds_from_begin_day(data.visit_till)
        ):
            raise BadRequestError("period should be in open range")
        if not await self.repo.is_unable_to_visit(place.id, data.visit_from, data.visit_till):
            raise BadRequestError("place is busy on this time")
        return await self.repo.insert_visit(place.id, visitor_id, data.visit_from, data.visit_till)

    async def delete_visit(self, visit_id: int) -> None:
        return await self.repo.delete_visit(visit_id)

    async def get_visits_by_client_id(self, client_id: int) -> list[PlaceVisit]:
        return await self.repo.get_visits_by_client_id(client_id)

    async def mark_visit(self, visit: PlaceVisit) -> None:
        if datetime.datetime.now(pytz.UTC) < visit.visit_from.astimezone(pytz.UTC):
            raise BadRequestError("Visit is not started")
        visit.is_visited = True

    async def insert_feedback(self, visit: PlaceVisit, data: CreateVisitFeedbackDTO) -> None:
        if not visit.is_visited:
            raise BadRequestError("Visit is not visited")
        if visit.is_feedbacked:
            raise BadRequestError("Visit is already feedbacked")
        await self.repo.insert_feedback(Feedback(
            **data.model_dump(),
            visit_id=visit.id
        ))
        visit.is_feedbacked = True

    async def update(self, place: Place, data: UpdatePlaceDTO) -> None:
        for k, v in data.__dict__.items():
            if v is not undefined:
                if k == "image_id" and not await self.file_service.is_file_exists(v):
                    raise BadRequestError(f"File {v} does not exist")
                setattr(place, k, v)

    async def delete(self, place: Place) -> None:
        await self.repo.delete(place)

    async def get_all_feedbacks(self) -> list[Feedback]:
        return await self.repo.get_all_feedbacks()

    async def get_all_feedbacks_by_building_id(self, building_id: int) -> list[Feedback]:
        return await self.repo.get_all_feedbacks_by_building_id(building_id)

    async def refuse_feedback(self, visit: PlaceVisit):
        if not visit.is_visited:
            raise BadRequestError("Visit is not visited")
        if visit.is_feedbacked:
            raise BadRequestError("Visit is already feedbacked")
        visit.is_feedbacked = True


async def create_place_service(repo: PlaceRepoDep, file_service: FileServiceDep) -> PlaceService:
    return PlaceService(repo, file_service)


PlaceServiceDep = Annotated[PlaceService, Depends(create_place_service)]

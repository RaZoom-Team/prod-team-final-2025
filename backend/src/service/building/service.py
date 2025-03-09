from typing import Annotated
from fastapi import Depends

from src.core.exc import BadRequestError
from src.core.utils import undefined
from src.models import Building
from src.repo.building import BuildingRepository, BuildingRepoDep
from src.service.files import FileStorageService, FileServiceDep
from src.schemes import CreateBuildingDTO, UpdateBuildingDTO

__all__ = ("BuildingService", "BuildingServiceDep")


class BuildingService:

    def __init__(self, repo: BuildingRepository, file_service: FileStorageService):
        self.repo = repo
        self.file_service = file_service

    async def get_by_id(self, building_id: int) -> Building | None:
        return await self.repo.get_by_id(building_id)

    async def get_all(self, limit: int, offset: int) -> (list[Building], int):
        return await self.repo.find_all(limit, offset)

    async def insert(self, data: CreateBuildingDTO) -> Building:
        if not all([await self.file_service.is_file_exists(image_id) for image_id in data.images_id]):
            raise BadRequestError("Invalid images")
        return await self.repo.insert(Building(**data.model_dump()))

    async def delete(self, building: Building) -> None:
        await self.repo.delete(building)

    async def update(self, building: Building, data: UpdateBuildingDTO) -> None:
        for k, v in data.__dict__.items():
            if v is not undefined:
                if k == "images_id" and not all([await self.file_service.is_file_exists(image_id) for image_id in v]):
                    raise BadRequestError("Invalid images")
                if (k == "open_from" and v is not None and v >= building.open_till) or \
                    (k == "open_till" and v is not None and v <= building.open_from):
                    raise BadRequestError("open_from should be less than open_till")
                setattr(building, k, v)
        if type(building.open_from) != type(building.open_till):
            raise BadRequestError("open_from and open_till should be both None or int")

async def create_building_service(repo: BuildingRepoDep, file_service: FileServiceDep) -> BuildingService:
    return BuildingService(repo, file_service)

BuildingServiceDep = Annotated[BuildingService, Depends(create_building_service)]
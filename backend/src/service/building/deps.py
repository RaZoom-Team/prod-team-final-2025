from typing import Annotated

from fastapi import Depends

from src.core.exc import NotFoundError
from src.models import Building
from src.repo.building import BuildingRepoDep


__all__ = ("BuildingDep",)


async def get_building(
    building_id: int,
    repo: BuildingRepoDep,
) -> Building:
    building = await repo.get_by_id(building_id)
    if not building:
        raise NotFoundError("Building not found")
    return building


BuildingDep = Annotated[Building, Depends(get_building)]

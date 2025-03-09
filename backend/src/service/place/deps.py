from typing import Annotated

from fastapi import Depends

from src.core.exc import NotFoundError
from src.models import PlaceVisit
from src.models.place import Place
from src.repo.place import PlaceRepoDep


__all__ = ("PlaceDep", "VisitDep")


async def get_place(building_id: int, place_id: int, repo: PlaceRepoDep) -> Place:
    place = await repo.get_by_id(place_id)
    if not place or place.building_id != building_id:
        raise NotFoundError("Place not found")
    return place


async def get_visit(visit_id: int, place: "PlaceDep", repo: PlaceRepoDep) -> PlaceVisit:
    visit = await repo.get_visit_by_id(visit_id)
    if not visit or visit.place_id != place.id:
        raise NotFoundError("Visit not found")
    return visit


PlaceDep = Annotated[Place, Depends(get_place)]
VisitDep = Annotated[PlaceVisit, Depends(get_visit)]

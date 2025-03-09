from datetime import datetime
from typing import Annotated, List

from fastapi import Depends
from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db import SessionDep
from src.core.exc import NotFoundError
from src.models import BuildingFloorImage, Feedback, Place, PlaceVisit


class PlaceRepository:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, place_id: int) -> Place:
        return await self.session.scalar(
            select(Place).filter(Place.id == place_id)
        )

    async def search_by_building_id(self, building_id: int) -> list[Place]:
        return list(await self.session.scalars(
            select(Place).filter(Place.building_id == building_id)
        ))

    async def bulk_insert(self, places: List[Place]) -> List[Place]:
        self.session.add_all(places)
        await self.session.flush()

        for place in places:
            await self.session.refresh(place)

        return places

    async def is_unable_to_visit(self, place_id: int, start: datetime, end: datetime) -> bool:
        return await self.session.scalar(
            select(True)
            .select_from(Place)
            .filter(
                Place.id == place_id,
                ~select(True)
                .select_from(PlaceVisit)
                .filter(
                    PlaceVisit.place_id == Place.id,
                    ((start > PlaceVisit.visit_from) &
                     (start < PlaceVisit.visit_till)) |
                    ((end > PlaceVisit.visit_from) &
                     (end < PlaceVisit.visit_till))
                )
                .limit(1).scalar_subquery().exists()
            )
        ) or False

    async def get_visit_by_id(self, visit_id: int) -> PlaceVisit | None:
        return await self.session.scalar(
            select(PlaceVisit).filter(PlaceVisit.id == visit_id)
        )

    async def insert_place(self, place: Place) -> Place:
        self.session.add(place)
        await self.session.flush()
        await self.session.refresh(place)
        return place

    async def insert_visit(self, place_id: int, client_id: int, start: datetime, end: datetime) -> PlaceVisit:
        v = PlaceVisit(place_id=place_id, client_id=client_id, visit_from=start, visit_till=end)
        self.session.add(v)
        await self.session.flush()
        await self.session.refresh(v)
        return v

    async def delete_visit(self, visit_id: int) -> None:
        await self.session.execute(
            delete(PlaceVisit).filter(PlaceVisit.id == visit_id)
        )

    async def is_place_floor_exists(self, building_id: int, floor: int) -> bool:
        return await self.session.scalar(
            select(True)
            .select_from(BuildingFloorImage)
            .filter(BuildingFloorImage.building_id == building_id, BuildingFloorImage.floor == floor)
        ) or False

    async def insert_floor(self, obj: BuildingFloorImage) -> None:
        self.session.add(obj)
        await self.session.flush()

    async def insert_feedback(self, feedback: Feedback) -> None:
        self.session.add(feedback)
        await self.session.flush()

    async def delete_floor(self, building_id: int, floor: int) -> None:
        if not await self.is_place_floor_exists(building_id, floor):
            raise NotFoundError("Floor not found")

        place_ids = await self.session.execute(
            select(Place.id).filter(
                Place.building_id == building_id,
                Place.floor == floor
            )
        )
        place_ids = [row[0] for row in place_ids.fetchall()]

        if place_ids:
            await self.session.execute(
                delete(PlaceVisit).filter(PlaceVisit.place_id.in_(place_ids))
            )

        await self.session.execute(
            delete(BuildingFloorImage).filter(
                BuildingFloorImage.building_id == building_id,
                BuildingFloorImage.floor == floor
            )
        )

        await self.session.execute(
            delete(Place).filter(
                Place.building_id == building_id,
                Place.floor == floor
            )
        )

    async def update_places_floor(self, building_id: int, floor: int, new_floor: int | None,
                                  image_id: str | None) -> None:
        await self.session.execute(
            update(Place).filter(
                Place.building_id == building_id,
                Place.floor == floor
            ).values(floor=new_floor)
        )
        await self.session.execute(
            update(BuildingFloorImage).filter(
                BuildingFloorImage.building_id == building_id,
                BuildingFloorImage.floor == floor
            ).values(
                **({"floor": new_floor} if new_floor is not None else {}),
                **({"image_id": image_id} if image_id is not None else {})
            )
        )

    async def get_visits_by_building_id(self, building_id: int) -> List[PlaceVisit]:
        return list(await self.session.scalars(
            select(PlaceVisit).join(Place).filter(
                Place.building_id == building_id,
                PlaceVisit.visit_till >= func.now()
            )
        ))

    async def get_visits_by_client_id(self, client_id: int) -> List[PlaceVisit]:
        return list(await self.session.scalars(
            select(PlaceVisit).filter(PlaceVisit.client_id == client_id)
        ))

    async def delete(self, place: Place) -> None:
        await self.session.delete(place)

    async def get_all_feedbacks(self) -> list[Feedback]:
        return list(await self.session.scalars(select(Feedback)))

    async def get_all_feedbacks_by_building_id(self, building_id: int) -> list[Feedback]:
        return list(await self.session.scalars(
            select(Feedback).join(PlaceVisit).join(Place).filter(Place.building_id == building_id)
        ))


async def create_place_repository(session: SessionDep) -> PlaceRepository:
    return PlaceRepository(session)


PlaceRepoDep = Annotated[PlaceRepository, Depends(create_place_repository)]

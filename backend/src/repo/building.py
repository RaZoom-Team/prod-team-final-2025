from typing import Annotated, List

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.functions import func

from src.core.db import SessionDep
from src.models import Building


class BuildingRepository:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, building_id: int):
        return await self.session.scalar(
            select(Building).filter(Building.id == building_id)
        )

    async def insert(self, building: Building) -> Building:
        self.session.add(building)
        await self.session.commit()
        await self.session.refresh(building)
        return building

    async def delete(self, building: Building) -> None:
        await self.session.delete(building)

    async def find_all(self, limit: int, offset: int) -> (List[Building], int):
        query = select(Building).limit(limit).offset(offset)
        result = await self.session.scalars(query)
        count_query = select(func.count()).select_from(Building)
        cnt = await self.session.execute(count_query)
        total_count = cnt.scalar()
        return list(result.all()), total_count


async def create_building_repository(session: SessionDep) -> BuildingRepository:
    return BuildingRepository(session)


BuildingRepoDep = Annotated[BuildingRepository, Depends(create_building_repository)]

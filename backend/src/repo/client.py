from datetime import datetime
from typing import Annotated, Optional

from fastapi import Depends
from sqlalchemy import desc, select, update
from sqlalchemy import and_, desc, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.db import SessionDep
from src.enums import AccessLevel
from src.models import Client, PlaceVisit


__all__ = ("ClientRepository", "ClientRepoDep")

from src.schemes import PlaceDTO
from src.schemes.client import ClientCurrentVisitDTO


class ClientRepository:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, client_id: int) -> Client | None:
        return await self.session.scalar(
            select(Client).filter(Client.id == client_id)
        )

    async def get_by_email(self, email: str) -> Client | None:
        return await self.session.scalar(
            select(Client).filter(Client.email == email)
        )

    async def is_exists_by_email(self, email: str) -> bool:
        return await self.session.scalar(
            select(True).filter(Client.email == email, Client.password != None)
        ) or False

    async def get_by_auth(self, email: str, hashed_password: str) -> Client | None:
        return await self.session.scalar(
            select(Client).filter(Client.email == email, Client.password == hashed_password)
        )

    async def insert(
        self,
        email: str,
        hashed_password: Optional[str],
        name: str,
        access_level: AccessLevel = AccessLevel.USER,
    ) -> Client:
        stmt = insert(Client).values(
            email=email,
            name=name,
            password=hashed_password,
            access_level=access_level,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=[Client.email],
            set_={
                "name": stmt.excluded.name,
                "password": stmt.excluded.password
            }
        ).returning(Client)
        return await self.session.scalar(stmt)

    async def find_all(self, limit: int = 100, offset: int = 0, order_by: str = "id") -> list[Client]:
        query = select(Client)

        if order_by.startswith("-"):
            field_name = order_by[1:]
            if hasattr(Client, field_name):
                query = query.order_by(desc(getattr(Client, field_name)))
        else:
            if hasattr(Client, order_by):
                query = query.order_by(getattr(Client, order_by))

        query = query.limit(limit).offset(offset)

        result = await self.session.scalars(query)
        return list(result.all())

    async def find_all_access_level_filter(self, access_level: AccessLevel) -> list[Client]:
        query = select(Client).where(Client.access_level == access_level)
        result = await self.session.scalars(query)
        return list(result.all())

    async def set_access_level_by_email(self, *, email: str, access_level: AccessLevel) -> None:
        await self.session.execute(
            update(Client).filter(Client.email == email).values(access_level=access_level)
        )

    async def set_access_level_by_id(self, *, id: int, access_level: AccessLevel) -> None:
        await self.session.execute(
            update(Client).filter(Client.id == id).values(access_level=access_level)
        )

    async def get_currently_visiting_clients_with_places(self) -> list[ClientCurrentVisitDTO]:
        now = datetime.now()

        query = (
            select(Client, PlaceVisit)
            .join(PlaceVisit, Client.id == PlaceVisit.client_id)
            .options(selectinload(PlaceVisit.place))
            .where(
                and_(
                    PlaceVisit.is_visited == True,
                    PlaceVisit.visit_from <= now,
                    PlaceVisit.visit_till >= now
                )
            )
        )

        result = await self.session.execute(query)
        rows = result.all()

        client_visits = []
        for client, visit in rows:
            dto = ClientCurrentVisitDTO(
                id=client.id,
                name=client.name,
                visit_id=visit.id,
                visit_from=visit.visit_from,
                visit_till=visit.visit_till,
                is_feedbacked=visit.is_feedbacked,
                place=PlaceDTO(
                    id=visit.place.id,
                    name=visit.place.name,
                )
            )
            client_visits.append(dto)

        return client_visits


def create_client_repository(session: SessionDep) -> ClientRepository:
    return ClientRepository(session)


ClientRepoDep = Annotated[ClientRepository, Depends(create_client_repository)]

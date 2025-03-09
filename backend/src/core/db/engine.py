from typing import Annotated

from fastapi.params import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import (AsyncEngine, AsyncSession, create_async_engine)

from src.config import settings
from src.core.exc import HTTPError


__all__ = ("ping_db", "SessionDep", "get_session", "get_engine")

engine: AsyncEngine = create_async_engine(
    settings.database_url,
    pool_size=20,
    max_overflow=10,
    pool_recycle=3600,
    isolation_level="SERIALIZABLE",
)


# Зависимость для движка необходима для подмены в тестах
def get_engine() -> AsyncEngine:
    return engine


async def get_session(eng: AsyncEngine = Depends(get_engine)):
    session = AsyncSession(
        eng,
        expire_on_commit=False,
        autoflush=False,
    )
    async with session:
        try:
            yield session
            await session.commit()
        except HTTPError as err:
            if err.commit_db:
                await session.commit()
            raise err


async def ping_db(session: AsyncSession) -> None:
    await session.execute(select(True))


SessionDep = Annotated[AsyncSession, Depends(get_session)]

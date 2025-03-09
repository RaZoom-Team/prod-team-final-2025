from typing import Annotated

from fastapi import Depends
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.core.db import get_session
from src.core.exc import NotFoundError
from src.models import ApplicationGlobalSettings


class ApplicationSettingsService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def set(self, k: str, v: str):
        stmt = update(ApplicationGlobalSettings).where(ApplicationGlobalSettings.key == k).values(value=v)
        try:
            await self.session.execute(stmt)
        except Exception as e:
            raise NotFoundError
        settings.application_settings[k] = v

        await self.session.commit()


async def create_application_settings(session: AsyncSession = Depends(get_session)):
    return ApplicationSettingsService(session)


ApplicationSettingsDep = Annotated[ApplicationSettingsService, Depends(create_application_settings)]

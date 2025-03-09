import hashlib

from sqlalchemy import insert, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.core.application import create_app
from src.core.db import get_engine
from src.enums import AccessLevel
from src.models import Client
from src.models.settings import ApplicationGlobalSettings
from src.routers import (admin_router, auth_router, building_router, client_router,
                         files_router, place_router, system_router, visitor_router)


async def create_owner_startup_task():
    engine = get_engine()
    async with AsyncSession(engine, expire_on_commit=False, autoflush=False) as session:
        stmt_check = select(Client).where(Client.access_level == AccessLevel.OWNER)
        result = await session.execute(stmt_check)
        owner = result.scalar_one_or_none()

        if owner:
            stmt = update(Client).where(Client.access_level == AccessLevel.OWNER).values(
                email=settings.super_user_email,
                name=settings.super_user_name,
                password=hashlib.sha256(settings.super_user_password.encode()).hexdigest(),
            )
        else:
            stmt = insert(Client).values(
                access_level=AccessLevel.OWNER,
                email=settings.super_user_email,
                name=settings.super_user_name,
                password=hashlib.sha256(settings.super_user_password.encode()).hexdigest(),
            )

        await session.execute(stmt)
        await session.commit()


async def init_application_settings():
    engine = get_engine()
    async with AsyncSession(engine, expire_on_commit=False, autoflush=False) as session:
        for k, v in (("accent_color", "#000000"), ("application_name", "CoworkHub1"), ("logo_id", "")):
            stmt_check = select(ApplicationGlobalSettings).where(ApplicationGlobalSettings.key == k)
            result = await session.execute(stmt_check)
            result = result.scalar_one_or_none()

            if not result:
                new_setting = ApplicationGlobalSettings(key=k, value=v)
                session.add(new_setting)
                await session.commit()
                result = new_setting

            settings.application_settings[result.key] = result.value


app = create_app(
    routers=[
        place_router,
        visitor_router,
        client_router,
        building_router,
        system_router,
        auth_router,
        files_router,
        admin_router
    ],
    startup_tasks=[
        create_owner_startup_task,
        init_application_settings,
    ],
    shutdown_tasks=[],
    ignoring_log_endpoints=[
        ("/system/ping", "GET"),
        ("/metrics", "GET")
    ],
    root_path=settings.root_path
)

from typing import Literal

from fastapi import APIRouter

from src.config import settings
from src.core.db import SessionDep, ping_db
from src.core.exc import HTTPErrorModel
from src.schemes import FeedbackDTO, MetricsDTO, SettingsDTO
from src.service.application_settings import ApplicationSettingsDep
from src.service.client import AdminDep, OwnerDep
from src.service.metrics import MetricsServiceDep
from src.service.place import PlaceServiceDep


router = APIRouter(prefix="/system", tags=["System"])


@router.get("/ping", include_in_schema=False)
async def ping(session: SessionDep) -> Literal[True]:
    await ping_db(session)
    return True


@router.get("/settings")
async def get_settings() -> SettingsDTO:
    """
    Получение текущих настроек
    """
    return SettingsDTO(**settings.application_settings)


@router.patch("/settings")
async def update_settings(
    data: SettingsDTO,
    service: ApplicationSettingsDep,
    _admin: OwnerDep
) -> SettingsDTO:
    """
    Обновление настроек<br>
    Возвращает `403` если пользователь не является владельцем
    """
    for k, v in data.model_dump().items():
        await service.set(k, v)

    return SettingsDTO(**settings.application_settings)


@router.get(
    "/metrics",
    response_model=MetricsDTO,
    responses={
        403: {
            "model": HTTPErrorModel,
            "description": "Недостаточно прав"
        }
    }
)
async def get_metrics(
    service: MetricsServiceDep,
    _admin: AdminDep
) -> MetricsDTO:
    """
    Получение статистики по организации<br>
    Возвращает `403` если пользователь не является администратором
    """
    return await service.get_dashboard_metrics()


@router.get(
    "/feedbacks",
    response_model=list[FeedbackDTO],
    responses={
        403: {
            "model": HTTPErrorModel,
            "description": "Недостаточно прав"
        }
    }
)
async def get_feedbacks(service: PlaceServiceDep, _admin: AdminDep) -> list[FeedbackDTO]:
    """
    Получение всех отзывов<br>
    Возвращает `403` если пользователь не является администратором
    """
    feedbacks = await service.get_all_feedbacks()
    for i in feedbacks:
        await i.awaitable_attrs.client
    return [FeedbackDTO.from_db(i) for i in feedbacks]

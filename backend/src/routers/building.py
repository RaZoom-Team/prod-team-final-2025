from typing import List

from fastapi import APIRouter, Query, Response

from src.core.exc import HTTPErrorModel
from src.schemes import BuildingDTO, CreateBuildingDTO, FeedbackDTO, UpdateBuildingDTO
from src.service.building import BuildingDep, BuildingServiceDep
from src.service.client import AdminDep
from src.service.place import PlaceServiceDep


router = APIRouter(prefix="/buildings", tags=["Buildings"])


@router.get(
    "",
    response_model=List[BuildingDTO]
)
async def get_all(
    response: Response,
    service: BuildingServiceDep,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> List[BuildingDTO]:
    """
    Получение списка всех коворкингов
    """
    res, cnt = await service.get_all(limit=limit, offset=offset)
    response.headers["X-Total-Count"] = str(cnt)
    return [BuildingDTO(**building.__dict__) for building in res]


@router.get(
    "/{building_id}",
    response_model=BuildingDTO,
    responses={
        404: {
            "model": HTTPErrorModel,
            "description": "Коворкинг не найден"
        }
    }
)
async def get_by_id(building: BuildingDep) -> BuildingDTO:
    """
    Получение коворкинга по id<br>
    Возвращает `404` если коворкинг не найден
    """
    return BuildingDTO(**building.__dict__)


@router.post(
    "",
    response_model=BuildingDTO,
    responses={
        403: {
            "model": HTTPErrorModel,
            "description": "Недостаточно прав"
        },
        400: {
            "model": HTTPErrorModel,
            "description": "Передано неверное изображение"
        }
    }
)
async def create_building(data: CreateBuildingDTO, service: BuildingServiceDep, _admin: AdminDep) -> BuildingDTO:
    """
    Создание нового коворкинга<br>
    Возвращает `403` если пользователь не администратор<br>
    Возвращает `400` если передано неверное изображение
    """
    building = await service.insert(data)
    return BuildingDTO(**building.__dict__)


@router.patch(
    "/{building_id}",
    response_model=BuildingDTO,
    responses={
        403: {
            "model": HTTPErrorModel,
            "description": "Недостаточно прав"
        },
        404: {
            "model": HTTPErrorModel,
            "description": "Коворкинг не найден"
        },
        400: {
            "model": HTTPErrorModel,
            "description": "Передано неверное изображение или нарушены временные рамки"
        }
    }
)
async def update_building(
    building: BuildingDep,
    data: UpdateBuildingDTO,
    service: BuildingServiceDep,
    _admin: AdminDep
) -> BuildingDTO:
    """
    Обновление коворкинга<br>
    Возвращает `403` если пользователь не администратор<br>
    Возвращает `404` если коворкинг не найден<br>
    Возвращает `400` если передано неверное изображение или нарушены временные рамки
    """
    await service.update(building, data)
    return BuildingDTO(**building.__dict__)


@router.delete(
    "/{building_id}",
    status_code=204,
    responses={
        403: {
            "model": HTTPErrorModel,
            "description": "Недостаточно прав"
        },
        404: {
            "model": HTTPErrorModel,
            "description": "Коворкинг не найден"
        }
    }
)
async def delete_building(building: BuildingDep, service: BuildingServiceDep, _admin: AdminDep):
    """
    Удаление коворкинга<br>
    Возвращает `403` если пользователь не администратор<br>
    Возвращает `404` если коворкинг не найден
    """
    await service.delete(building)


@router.get(
    "/{building_id}/feedbacks",
    response_model=list[FeedbackDTO],
    responses={
        404: {
            "model": HTTPErrorModel,
            "description": "Коворкинг не найден"
        }
    }
)
async def get_feedbacks(building: BuildingDep, service: PlaceServiceDep) -> list[FeedbackDTO]:
    """
    Получение отзывов о коворкинге<br>
    Возвращает `404` если коворкинг не найден
    """
    feedbacks = await service.get_all_feedbacks_by_building_id(building.id)
    for i in feedbacks:
        await i.awaitable_attrs.client
    return [FeedbackDTO.from_db(i) for i in feedbacks]

import asyncio

from fastapi import APIRouter, Request

from src.core.exc import ForbiddenError, HTTPErrorModel
from src.enums import AccessLevel
from src.schemes import CreateVisitFeedbackDTO, CreateVisitorDTO, PlaceDTO, PlaceVisitDTO
from src.service.client import ClientDep
from src.service.place import PlaceDep, PlaceServiceDep, VisitDep


router = APIRouter(prefix="/buildings/{building_id}/places/{place_id}/visits", tags=["Visits"])


@router.post(
    "",
    status_code=200,
    response_model=PlaceVisitDTO,
    responses={
        400: {
            "model": HTTPErrorModel,
            "description": "Период находится вне рабочего времени здания или место уже занято на этот период"
        },
        404: {
            "model": HTTPErrorModel,
            "description": "Место не найдено"
        }
    }
)
async def create(
    data: CreateVisitorDTO,
    place: PlaceDep,
    client: ClientDep,
    service: PlaceServiceDep,
    request: Request
) -> PlaceVisitDTO:
    """
    Бронирование места на определённый период<br>
    Возвращает `404` если место не найдено<br>
    Возвращает `400` если период находится вне рабочего времени здания или место уже занято на этот период
    """
    lock = request.app.extra.setdefault("lock_place_" + str(place.id), asyncio.Lock())
    async with lock:
        place = await service.insert_visit(client.id, place, data)
        await place.awaitable_attrs.place
        result = place.__dict__
        result['place'] = PlaceDTO(**result['place'].__dict__)
        return PlaceVisitDTO(**result)


@router.delete(
    "/{visit_id}",
    status_code=204,
    responses={
        403: {
            "model": HTTPErrorModel,
            "description": "Недостаточно прав"
        },
        404: {
            "model": HTTPErrorModel,
            "description": "Бронь не найдена"
        }
    }
)
async def delete(visit: VisitDep, client: ClientDep, service: PlaceServiceDep):
    """
    Отмена брони места<br>
    Возвращает `403` при попытке отменить не свою бронь не администраторам<br>
    """
    if client.id != visit.client_id and client.access_level.value < AccessLevel.ADMIN.value:
        raise ForbiddenError
    await service.delete_visit(visit.id)


@router.post(
    "/{visit_id}/visited",
    status_code=204,
    responses={
        400: {
            "model": HTTPErrorModel,
            "description": "Бронь ещё не началась"
        },
        403: {
            "model": HTTPErrorModel,
            "description": "Недостаточно прав"
        },
        404: {
            "model": HTTPErrorModel,
            "description": "Бронь не найдена"
        }
    }
)
async def mark_visit(
    visit: VisitDep,
    client: ClientDep,
    service: PlaceServiceDep,
):
    """
    Пометка брони как посещённой (для администраторов)<br>
    Возвращает `400` если бронь ещё не началась<br>
    Возвращает `403` если у клиента недостаточно прав<br>
    Возвращает `404` если бронь не найдена
    """
    if client.access_level.value < AccessLevel.ADMIN.value:
        raise ForbiddenError
    await service.mark_visit(visit)


@router.post(
    "/{visit_id}/feedback",
    status_code=204,
    responses={
        400: {
            "model": HTTPErrorModel,
            "description": "Бронь не посещена или отзыв уже оставлен"
        },
        404: {
            "model": HTTPErrorModel,
            "description": "Бронь не найдена"
        },
        403: {
            "model": HTTPErrorModel,
            "description": "Бронь принадлежит другому клиенту"
        }
    }
)
async def send_feedback(
    visit: VisitDep,
    client: ClientDep,
    data: CreateVisitFeedbackDTO,
    service: PlaceServiceDep,
):
    """
    Оставление отзыва о месте<br>
    Возвращает `400` если отзыв уже оставлен или бронь не посещена<br>
    Возвращает `403` если отзыв оставлен другим клиентом<br>
    Возвращает `404` если бронь не найдена
    """
    if visit.client_id != client.id:
        raise ForbiddenError
    await service.insert_feedback(visit, data)


@router.post(
    "/{visit_id}/feedback/refuse",
    responses={
        400: {
            "model": HTTPErrorModel,
            "description": "Бронь не посещена или отзыв уже оставлен"
        },
        403: {
            "model": HTTPErrorModel,
            "description": "Бронь принадлежит другому клиенту"
        },
        404: {
            "model": HTTPErrorModel,
            "description": "Бронь не найдена"
        }
    }
)
async def refuse_feedback(
    visit: VisitDep,
    client: ClientDep,
    service: PlaceServiceDep,
):
    """
    Отказ от отзыва о месте<br>
    Возвращает `400` если отзыв уже оставлен или бронь не посещена<br>
    Возвращает `403` если отзыв оставлен другим клиентом<br>
    Возвращает `404` если бронь не найдена<br>
    """
    if visit.client_id != client.id:
        raise ForbiddenError
    await service.refuse_feedback(visit)

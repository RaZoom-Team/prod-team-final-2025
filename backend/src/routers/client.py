from typing import List, Literal

from fastapi import APIRouter

from src.core.exc import ForbiddenError, HTTPErrorModel, NotFoundError
from src.enums import AccessLevel
from src.schemes import ClientDTO, PlaceDTO, PlaceVisitDTO, UpdateClientDTO
from src.schemes.client import ClientCurrentVisitDTO
from src.service.client import AdminDep, ClientDep, ClientServiceDep
from src.service.place import PlaceServiceDep


router = APIRouter(prefix="/clients", tags=["Clients"])


# @router.get("", response_model=List[ClientDTO])
# async def get_clients() -> List[ClientDTO]:
#     ...

@router.get("/visits", response_model=list[PlaceVisitDTO])
async def get_visits(client: ClientDep, service: PlaceServiceDep) -> list[PlaceVisitDTO]:
    """
    Получение броней клиента
    """
    res = []
    for visit in await service.get_visits_by_client_id(client.id):
        await visit.awaitable_attrs.place
        data = visit.__dict__.copy()
        data["place"] = PlaceDTO(**visit.place.__dict__)
        res.append(PlaceVisitDTO(**data))
    return res


@router.get(
    "/{client_id}",
    response_model=ClientDTO,
    responses={
        403: {
            "model": HTTPErrorModel,
            "description": "Недостаточно прав"
        },
        404: {
            "model": HTTPErrorModel,
            "description": "Клиент не найден"
        }
    }
)
async def get_client(client_id: int | Literal['@me'], client: ClientDep, service: ClientServiceDep) -> ClientDTO:
    """
    Получение информации о клиенте, `@me` для получения информации о себе<br>
    Возвращает `403` при попытке получения информации о другом клиенте без админ прав<br>
    Возвращает `404` если клиент не найден
    """
    if client_id == "@me":
        return ClientDTO(**client.__dict__)
    elif client.access_level.value >= AccessLevel.ADMIN.value or client.id == client_id:
        target = await service.get_by_id(client_id) if client.id != client_id else client
        if not target:
            raise NotFoundError("Client not found")
        return ClientDTO(**target.__dict__)
    raise ForbiddenError


@router.patch(
    "/{client_id}",
    response_model=ClientDTO,
    responses={
        403: {
            "model": HTTPErrorModel,
            "description": "Недостаточно прав"
        },
        404: {
            "model": HTTPErrorModel,
            "description": "Клиент не найден"
        }
    }
)
async def update_client(
    client_id: int,
    client: ClientDep,
    data: UpdateClientDTO,
    service: ClientServiceDep,
) -> ClientDTO:
    """
    Обновление информации о клиенте<br>
    Возвращает `403` при попытке изменить другого клиента без админ прав<br>
    Возвращает `404` если клиент не найден
    """
    if client.access_level.value >= AccessLevel.ADMIN.value or client.id == client_id:
        target = await service.get_by_id(client_id) if client.id != client_id else client
        if not target:
            raise NotFoundError("Client not found")
        await service.update(client, data)
        return ClientDTO(**target.__dict__)
    raise ForbiddenError


@router.get(
    "/currently_visiting",
    response_model=List[ClientCurrentVisitDTO],
)
async def get_currently_visiting_clients_with_places(
    _admin: AdminDep,
    service: ClientServiceDep,
) -> List[ClientCurrentVisitDTO]:
    print("LDKMFDLKNFDSLFNLJDNFDS")
    return await service.get_currently_visiting_clients_with_places()

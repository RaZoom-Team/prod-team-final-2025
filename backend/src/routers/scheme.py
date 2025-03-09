from typing import List

from fastapi import APIRouter

from src.core.exc import HTTPErrorModel
from src.schemes import CreatePlaceDTO, PlaceDTO, UpdatePlaceDTO, UpdateSchemeDTO, VisitorDTO
from src.schemes.building import BuildingFloor
from src.schemes.scheme import CreateSchemeDTO
from src.service.building import BuildingDep
from src.service.client import AdminDep
from src.service.place import PlaceDep, PlaceServiceDep


router = APIRouter(prefix="/buildings/{building_id}/schemes", tags=["Schemes"])


# @router.get(
#     "",
#     response_model=List[PlaceDTO],
#     responses={
#         404: {
#             "model": HTTPErrorModel,
#             "description": "Коворкинг не найден"
#         }
#     }
# )
# async def get_all_places_by_building(
#     building: BuildingDep,
#     service: PlaceServiceDep
# ) -> List[PlaceDTO]:
#     """
#     Получение списка всех мест в коворкинге<br>
#     Возвращает `404` если коворкинг не найден
#     """
#     return [
#         PlaceDTO(**place.__dict__)
#         for place in await service.get_all_by_building_id(building.id)
#     ]


@router.get(
    "",
    response_model=dict[int, BuildingFloor],
    responses={
        404: {
            "model": HTTPErrorModel,
            "description": "Коворкинг не найден"
        }
    }
)
async def get_floors(building: BuildingDep, service: PlaceServiceDep) -> dict[int, BuildingFloor]:
    """
    Получение списка всех этажей в коворкинге<br>
    Возвращает `404` если коворкинг не найден
    """
    places = await service.get_all_by_building_id(building.id)
    res = {floor.floor: BuildingFloor(
        floor=floor.floor,
        image_id=floor.image_id,
        places=[]
    ) for floor in building.floors}
    for place in places:
        res[place.floor].places.append(PlaceDTO(**place.__dict__))
    return res


@router.get(
    "/visits",
    response_model=List[VisitorDTO],
    responses={
        404: {
            "model": HTTPErrorModel,
            "description": "Коворкинг не найден"
        }
    }
)
async def get_all_visits_by_building(
    building: BuildingDep,
    service: PlaceServiceDep
) -> List[VisitorDTO]:
    """
    Получение списка всех активных броней в коворкинге<br>
    Возвращает `404` если коворкинг не найден
    """
    return [
        VisitorDTO.from_db(visit)
        for visit in await service.get_visits_by_building_id(building.id)
    ]


@router.delete(
    "/{floor}",
    responses={
        403: {
            "model": HTTPErrorModel,
            "description": "Недостаточно прав"
        },
        404: {
            "model": HTTPErrorModel,
            "description": "Этаж не найден"
        }
    },
    status_code=204
)
async def delete_floor(
    building_id: int,
    floor: int,
    service: PlaceServiceDep,
    _admin: AdminDep,
):
    """
    Удаление этажа в коворкинге<br>
    Возвращает `403` если пользователь не администратор<br>
    Возвращает `404` если этаж не найден
    """
    await service.delete_floor(building_id, floor)


@router.get(
    "/places/{place_id}",
    response_model=PlaceDTO,
    responses={
        404: {
            "model": HTTPErrorModel,
            "description": "Коворкинг не найден"
        }
    }
)
async def get_place_by_id(place: PlaceDep) -> PlaceDTO:
    """
    Получение информации о месте по id<br>
    Возвращает `404` если место не найдено
    """
    return PlaceDTO(**place.__dict__)


@router.patch(
    "/{floor}",
    responses={
        400: {
            "model": HTTPErrorModel,
            "description": "Передано неверное изображение"
        },
        403: {
            "model": HTTPErrorModel,
            "description": "Недостаточно прав"
        },
        404: {
            "model": HTTPErrorModel,
            "description": "Этаж не найден"
        },
        409: {
            "model": HTTPErrorModel,
            "description": "Новый этаж уже существует"
        }
    },
    status_code=204
)
async def update_floor(
    floor: int,
    building: BuildingDep,
    data: UpdateSchemeDTO,
    service: PlaceServiceDep,
    _admin: AdminDep,
):
    """
    Обновление этажа в коворкинге<br>
    Возвращает `400` если передано неверное изображение<br>
    Возвращает `403` если пользователь не администратор<br>
    Возвращает `404` если этаж не найден<br>
    Возвращает `409` если новый этаж
    """
    await service.update_floor(building, floor, data)


@router.post(
    "",
    responses={
        403: {
            "model": HTTPErrorModel,
            "description": "Недостаточно прав"
        },
        404: {
            "model": HTTPErrorModel,
            "description": "Коворкинг не найден"
        },
        409: {
            "model": HTTPErrorModel,
            "description": "Этаж уже существует"
        }
    },
    status_code=204
)
async def create_scheme(
    building_id: int,
    scheme: CreateSchemeDTO,
    service: PlaceServiceDep,
    _admin: AdminDep,
):
    """
    Создание нового этажа в коворкинге<br>
    Возвращает `403` если пользователь не администратор<br>
    Возвращает `404` если коворкинг не найден<br>
    Возвращает `409` если этаж уже существует
    """
    await service.create_scheme(building_id, scheme)


@router.post(
    "/{floor}",
    response_model=PlaceDTO,
    responses={
        400: {
            "model": HTTPErrorModel,
            "description": "Передано неверное изображение"
        },
        403: {
            "model": HTTPErrorModel,
            "description": "Недостаточно прав"
        },
        404: {
            "model": HTTPErrorModel,
            "description": "Этаж не найден"
        }
    }
)
async def create_place(
    building_id: int,
    floor: int,
    data: CreatePlaceDTO,
    service: PlaceServiceDep,
    _admin: AdminDep,
) -> PlaceDTO:
    """
    Создание нового места на этаже<br>
    Возвращает `400` если передано неверное изображение<br>
    Возвращает `403` если пользователь не администратор<br>
    Возвращает `404` если этаж не найден
    """
    place = await service.create_place(building_id, floor, data)
    return PlaceDTO(**place.__dict__)


@router.patch(
    "/places/{place_id}",
    response_model=PlaceDTO,
    responses={
        403: {
            "model": HTTPErrorModel,
            "description": "Недостаточно прав"
        }
    }
)
async def update_place(
    place: PlaceDep,
    data: UpdatePlaceDTO,
    service: PlaceServiceDep,
    _admin: AdminDep,
) -> PlaceDTO:
    """
    Обновление информации о месте<br>
    Возвращает `403` если пользователь не администратор<br>
    """
    await service.update(place, data)
    return PlaceDTO(**place.__dict__)


@router.delete(
    "/places/{place_id}",
    responses={
        403: {
            "model": HTTPErrorModel,
            "description": "Недостаточно прав"
        }
    },
    status_code=204
)
async def delete_place(
    place: PlaceDep,
    service: PlaceServiceDep,
    _admin: AdminDep,
):
    """
    Удаляет место по id<br>
    Возвращает `403` если пользователь не администратор<br>
    """
    await service.delete(place)

#
# @router.get("/{id}/visitors", response_model=List[VisitorDTO])
# async def get_place_visitors(id: int) -> List[VisitorDTO]:
#     ...

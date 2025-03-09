from fastapi import APIRouter, BackgroundTasks

from src.core.exc import HTTPErrorModel
from src.core.utils import create_token
from src.schemes import AuthResponse, ClientDTO, CreateAdminDTO, CreateClientDTO
from src.service.client import AdminDep, ClientServiceDep, OwnerDep


router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get(
    "",
    responses={
        403: {
            "model": HTTPErrorModel,
            "description": "Недостаточно прав"
        }
    }
)
async def get_all_admins(
    _owner: OwnerDep,
    service: ClientServiceDep,
) -> list[ClientDTO]:
    """
    Получение списка всех администраторов<br>
    Возвращает `403` если пользователь не является владельцем
    """
    result = await service.get_all_admins()
    return [ClientDTO(**client.__dict__) for client in result]


@router.post(
    "",
    responses={
        403: {
            "model": HTTPErrorModel,
            "description": "Недостаточно прав"
        }
    },
    status_code=204
)
async def add_admin(
    data: CreateAdminDTO,
    service: ClientServiceDep,
    background_tasks: BackgroundTasks,
    _admin: AdminDep,
):
    """
    Создание нового администратора<br>
    Возвращает `403` если пользователь не является владельцем
    """
    await service.create_admin(data, background_tasks)


@router.post("/create_for_tests", include_in_schema=False)
async def create_for_tests(data: CreateClientDTO, service: ClientServiceDep) -> AuthResponse:
    client = await service.create_admin_for_tests(data)
    token = create_token(client)
    return AuthResponse(token=token)


@router.delete(
    "/{admin_id}",
    status_code=204,
    responses={
        403: {
            "model": HTTPErrorModel,
            "description": "Недостаточно прав"
        }
    }
)
async def remove_admin(
    admin_id: int,
    _owner: OwnerDep,
    service: ClientServiceDep,
):
    """
    Удаление администратора<br>
    Возвращает `403` если пользователь не является владельцем
    """
    await service.remove_admin(admin_id)

from fastapi import APIRouter

from src.core.exc import HTTPErrorModel
from src.core.utils.jwt import create_token
from src.schemes import AuthResponse, CreateClientDTO, LoginRequest
from src.service.client import ClientServiceDep


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/login",
    response_model=AuthResponse,
    responses={
        401: {
            "model": HTTPErrorModel,
            "description": "Неверные данные для аутентификации"
        }
    }
)
async def login_user(data: LoginRequest, service: ClientServiceDep) -> AuthResponse:
    """
    Аутентификация пользователя по почте и паролю<br>
    Возвращает `401` в случае если пользователь не найден или пароль не верен
    """
    return AuthResponse(token=await service.login(data.email, data.password))


@router.post(
    "/register",
    response_model=AuthResponse,
    responses={
        409: {
            "model": HTTPErrorModel,
            "description": "Email уже зарегистрирован"
        }
    }
)
async def register_client(data: CreateClientDTO, service: ClientServiceDep) -> AuthResponse:
    """
    Регистрация нового клиента<br>
    Возвращает `409` если email уже зарегистрирован
    """
    client = await service.insert(data)
    token = create_token(client)
    return AuthResponse(token=token)

import datetime
from typing import Annotated

import jwt
import pytz
from fastapi import Depends, Security
from fastapi.security import APIKeyHeader

from src.config import settings
from src.core.exc import ForbiddenError, UnauthorizedError
from src.enums import AccessLevel
from src.models import Client
from src.repo.client import ClientRepoDep


__all__ = ("ClientDep", "AdminDep", "OwnerDep")

api_key = APIKeyHeader(name="Authorization")


async def get_client(repo: ClientRepoDep, auth: str = Security(api_key)) -> Client:
    try:
        payload = jwt.decode(auth, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.InvalidTokenError:
        raise UnauthorizedError
    if datetime.datetime.now(pytz.UTC) >= datetime.datetime.fromtimestamp(payload['exp'], pytz.UTC):
        raise UnauthorizedError
    user = await repo.get_by_email(payload["sub"])
    if not user:
        raise UnauthorizedError
    return user


async def get_admin(client: Client = Depends(get_client)) -> Client:
    if client.access_level.value < AccessLevel.ADMIN.value:
        raise ForbiddenError
    return client


async def get_owner(client: Client = Depends(get_client)) -> Client:
    if client.access_level.value < AccessLevel.OWNER.value:
        raise ForbiddenError
    return client


ClientDep = Annotated[Client, Depends(get_client)]
AdminDep = Annotated[Client, Depends(get_admin)]
OwnerDep = Annotated[Client, Depends(get_owner)]

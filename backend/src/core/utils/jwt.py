from datetime import datetime, timedelta

import jwt
import pytz

from src.config import settings
from src.models import Client


__all__ = ("create_token",)


def create_token(client: Client) -> str:
    data = {
        "sub": client.email,
        "exp": datetime.now(pytz.UTC) + timedelta(seconds=settings.jwt_expires)
    }
    return jwt.encode(data, settings.jwt_secret, settings.jwt_algorithm)

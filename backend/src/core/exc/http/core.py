from enum import Enum

from fastapi import Request
from fastapi.responses import JSONResponse

from pydantic import BaseModel, Field


__all__ = (
    "HTTPError",
    "HTTPErrorModel",
    "HTTPValidationErrorModel",
    "ErrorType",
    "NotFoundError",
    "ForbiddenError",
    "UnauthorizedError",
    "BadRequestError",
    "ConflictError"
)


class ErrorType(Enum):
    E400_BAD_REQUEST = 400
    E401_UNAUTHORIZED = 401
    E404_NOT_FOUND = 404
    E403_FORBIDDEN = 403
    E409_CONFLICT = 409

    E1000_EMAIL_CONFLICT = 1000

class HTTPErrorModel(BaseModel):
    error_code: int
    http_code: int
    message: str


class HTTPValidationErrorModel(HTTPErrorModel):
    detail: list[dict] | None = Field(default=None)


class HTTPError(Exception):
    
    def __init__(
        self,
        error_type: ErrorType,
        message: str = None,
        http_code: int = 400,
        additional: dict | None = None,
        headers: dict[str, str] | None = None,
        commit_db: bool = False
    ) -> None:
        self.error_type = error_type
        self.http_code = http_code
        self.message = message
        self.additional = additional or {}
        self.headers = headers or {}
        self.commit_db = commit_db
    
    @staticmethod
    async def handler(_: Request, exc: "HTTPError") -> JSONResponse:
        return JSONResponse(
            content={
                "error_code": exc.error_type.value,
                "http_code": exc.http_code,
                **({"message": exc.message} if exc.message else {}),
                **exc.additional
            },
            status_code=exc.http_code,
            headers=exc.headers
        )


class BadRequestError(HTTPError):
    def __init__(self, message: str = "Bad Request"):
        super().__init__(ErrorType.E400_BAD_REQUEST, message, 400)


class NotFoundError(HTTPError):
    def __init__(self, message: str = "Not found"):
        super().__init__(ErrorType.E404_NOT_FOUND, message, 404)


class ForbiddenError(HTTPError):
    def __init__(self, message: str = "Forbidden"):
        super().__init__(ErrorType.E403_FORBIDDEN, message, 403)


class UnauthorizedError(HTTPError):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(ErrorType.E401_UNAUTHORIZED, message, 401)


class ConflictError(HTTPError):
    def __init__(self, message: str = "Conflict"):
        super().__init__(ErrorType.E409_CONFLICT, message, 409)
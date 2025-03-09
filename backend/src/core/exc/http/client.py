from .core import HTTPError, ErrorType


__all__ = ("EmailConflictError",)


class EmailConflictError(HTTPError):
    def __init__(self):
        super().__init__(error_type=ErrorType.E1000_EMAIL_CONFLICT, message="Email already exists", http_code=409)
from pydantic import BaseModel, Field

__all__ = ("AuthResponse", "LoginRequest")


class AuthResponse(BaseModel):
    token: str = Field(description="Авторизационный токен", examples=["abcde123"])

class LoginRequest(BaseModel):
    email: str = Field(description="email-адрес пользователя", examples=["test@mail.ru"])
    password: str = Field(description="Пароль пользователя", examples=["StrongPass"])
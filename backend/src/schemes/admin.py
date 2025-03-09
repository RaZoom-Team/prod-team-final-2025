from pydantic import BaseModel, EmailStr, Field

__all__ = ("CreateAdminDTO",)


class CreateAdminDTO(BaseModel):
    email: EmailStr =  Field(description="email-адрес администратора", examples=["test@mail.ru"], min_length=1)

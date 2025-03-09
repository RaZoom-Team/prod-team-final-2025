from pydantic import BaseModel


__all__ = ("KeyValueDTO", "SettingsDTO")


class KeyValueDTO(BaseModel):
    key: str
    value: str


class SettingsDTO(BaseModel):
    accent_color: str
    application_name: str
    logo_id: str

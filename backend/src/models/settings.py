from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db import Base


class ApplicationGlobalSettings(Base):
    __tablename__ = "application_global_settings"

    key: Mapped[str] = mapped_column(String, primary_key=True, nullable=False)
    value: Mapped[str] = mapped_column(String, nullable=False)

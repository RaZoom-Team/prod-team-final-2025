from datetime import datetime
from typing import Optional

from sqlalchemy import ARRAY, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.db import Base


__all__ = ("Place",)


class Place(Base, AsyncAttrs):
    __tablename__ = "places"

    id: Mapped[int] = mapped_column(
        Integer,
        autoincrement=True,
        primary_key=True,
        index=True,
        nullable=False
    )
    building_id: Mapped[int] = mapped_column(ForeignKey("buildings.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    floor: Mapped[int] = mapped_column(Integer, nullable=False)
    features: Mapped[list[str]] = mapped_column(MutableList.as_mutable(ARRAY(String)))
    size: Mapped[float] = mapped_column(Float, default=1)
    rotate: Mapped[int] = mapped_column(Integer, default=0)
    x: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=None)
    y: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=None)
    image_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, default=None)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    building = relationship("Building", back_populates="places")
    visits = relationship("PlaceVisit", back_populates="place", cascade="all,delete")
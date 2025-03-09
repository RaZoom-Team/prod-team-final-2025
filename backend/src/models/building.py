from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, func, ARRAY, ForeignKey
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.db import Base


__all__ = ("Building", "BuildingFloorImage")


class Building(Base):
    __tablename__ = "buildings"

    id: Mapped[int] = mapped_column(
        Integer,
        autoincrement=True,
        primary_key=True,
        index=True,
        nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    open_from: Mapped[int | None] = mapped_column(Integer, nullable=True)
    open_till: Mapped[int | None] = mapped_column(Integer, nullable=True)
    address: Mapped[str] = mapped_column(String, nullable=False)
    x: Mapped[float] = mapped_column(Float, nullable=False)
    y: Mapped[float] = mapped_column(Float, nullable=False)
    images_id: Mapped[list[str]] = mapped_column(MutableList.as_mutable(ARRAY(String)), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    places = relationship("Place", back_populates="building", cascade="all,delete")
    floors = relationship("BuildingFloorImage", back_populates="building", lazy="selectin", cascade="all,delete")


class BuildingFloorImage(Base):
    __tablename__ = "floor_images"

    building_id: Mapped[int] = mapped_column(ForeignKey("buildings.id"), primary_key=True, nullable=False)
    floor: Mapped[int] = mapped_column(Integer, primary_key=True, nullable=False)
    image_id: Mapped[str] = mapped_column(String, nullable=False)

    building = relationship("Building", back_populates="floors")
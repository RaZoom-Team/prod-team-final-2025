from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, func, Boolean
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.db import Base


__all__ = ("PlaceVisit",)


class PlaceVisit(Base, AsyncAttrs):
    __tablename__ = "visitors"

    id: Mapped[int] = mapped_column(
        Integer,
        autoincrement=True,
        primary_key=True,
        index=True,
    )

    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), nullable=False)
    place_id: Mapped[int] = mapped_column(ForeignKey("places.id"), nullable=False)

    visit_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    visit_till: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    is_visited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_feedbacked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    client = relationship("Client", lazy="selectin")
    place = relationship("Place")
    feedback = relationship("Feedback", back_populates="visit", cascade="all,delete")
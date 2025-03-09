from datetime import datetime

from sqlalchemy import Integer, ForeignKey, String, DateTime, func
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.db import Base
from src.models import PlaceVisit


__all__ = ("Feedback",)


class Feedback(Base, AsyncAttrs):
    __tablename__ = "feedbacks"

    id: Mapped[int] = mapped_column(
        Integer,
        autoincrement=True,
        primary_key=True,
        index=True,
        nullable=False
    )
    visit_id: Mapped[int] = mapped_column(ForeignKey("visitors.id"), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(String, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    visit = relationship(PlaceVisit, back_populates="feedback")
    client = association_proxy("visit", "client")
from datetime import datetime
from typing import List

from pydantic import BaseModel


__all__ = ("LastBookingViewForMetrics", "PopularPlaceViewForMetrics", "MetricsDTO")


class LastBookingViewForMetrics(BaseModel):
    id: int
    client_name: str
    place_name: str
    building_name: str
    visit_from: datetime
    visit_till: datetime
    is_visited: bool
    duration_minutes: int


class PopularPlaceViewForMetrics(BaseModel):
    id: int
    name: str
    building_name: str
    visit_count: int


class MetricsDTO(BaseModel):
    average_visit_duration_minutes: float
    average_book_duration_minutes: float
    coworking_count: int
    user_count: int
    total_bookings: int
    last_bookings: List[LastBookingViewForMetrics]
    most_popular_places: List[PopularPlaceViewForMetrics]

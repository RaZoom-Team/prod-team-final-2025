from datetime import datetime, timedelta
from typing import Annotated, Any, Dict, List

from fastapi import Depends
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import extract

from src.core.db import SessionDep
from src.models import Building, Client, Place, PlaceVisit
from src.schemes.metrics import LastBookingViewForMetrics, MetricsDTO, PopularPlaceViewForMetrics


class MetricsService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_average_visit_duration_minutes(self) -> float:
        query = select(
            func.avg(
                extract('epoch', PlaceVisit.visit_till - PlaceVisit.visit_from) / 60
            )
        ).where(PlaceVisit.is_visited == True)

        result = await self.session.execute(query)
        avg_minutes = result.scalar()
        return round(avg_minutes if avg_minutes is not None else 0, 2)

    async def get_average_book_duration_minutes(self) -> float:
        query = select(
            func.avg(
                extract('epoch', PlaceVisit.visit_till - PlaceVisit.visit_from) / 60
            )
        )

        result = await self.session.execute(query)
        avg_minutes = result.scalar()
        return round(avg_minutes if avg_minutes is not None else 0, 2)

    async def get_coworking_count(self) -> int:
        query = select(func.count()).select_from(Place)
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def get_user_count(self) -> int:
        query = select(func.count()).select_from(Client)
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def get_total_bookings_count(self) -> int:
        query = select(func.count()).select_from(PlaceVisit)
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def get_last_five_bookings(self) -> List[LastBookingViewForMetrics]:
        query = select(
            PlaceVisit.id,
            Client.name.label("client_name"),
            Place.name.label("place_name"),
            Building.name.label("building_name"),
            PlaceVisit.visit_from,
            PlaceVisit.visit_till,
            PlaceVisit.is_visited
        ).join(
            Client, PlaceVisit.client_id == Client.id
        ).join(
            Place, PlaceVisit.place_id == Place.id
        ).join(
            Building, Place.building_id == Building.id
        ).order_by(
            desc(PlaceVisit.created_at)
        ).limit(5)

        result = await self.session.execute(query)
        bookings = []

        for booking in result:
            bookings.append(LastBookingViewForMetrics(
                id=booking.id,
                client_name=booking.client_name,
                place_name=booking.place_name,
                building_name=booking.building_name,
                visit_from=booking.visit_from,
                visit_till=booking.visit_till,
                is_visited=booking.is_visited,
                duration_minutes=round((booking.visit_till - booking.visit_from).total_seconds() / 60, 0)
            ))

        return bookings

    async def get_booking_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        query = select(
            PlaceVisit.id,
            Client.name.label("client_name"),
            Place.name.label("place_name"),
            Building.name.label("building_name"),
            PlaceVisit.visit_from,
            PlaceVisit.visit_till,
            PlaceVisit.is_visited,
            PlaceVisit.is_feedbacked
        ).join(
            Client, PlaceVisit.client_id == Client.id
        ).join(
            Place, PlaceVisit.place_id == Place.id
        ).join(
            Building, Place.building_id == Building.id
        ).order_by(
            desc(PlaceVisit.created_at)
        ).limit(limit)

        result = await self.session.execute(query)
        bookings = []

        for booking in result:
            bookings.append({
                "id": booking.id,
                "client_name": booking.client_name,
                "place_name": booking.place_name,
                "building_name": booking.building_name,
                "visit_from": booking.visit_from,
                "visit_till": booking.visit_till,
                "is_visited": booking.is_visited,
                "is_feedbacked": booking.is_feedbacked,
                "duration_minutes": round((booking.visit_till - booking.visit_from).total_seconds() / 60, 0)
            })

        return bookings

    async def get_most_popular_places(self, limit: int = 5) -> List[PopularPlaceViewForMetrics]:
        query = select(
            Place.id,
            Place.name,
            Building.name.label("building_name"),
            func.count(PlaceVisit.id).label("visit_count")
        ).join(
            PlaceVisit, Place.id == PlaceVisit.place_id
        ).join(
            Building, Place.building_id == Building.id
        ).group_by(
            Place.id, Building.name
        ).order_by(
            desc("visit_count")
        ).limit(limit)

        result = await self.session.execute(query)
        popular_places = []

        for place in result:
            popular_places.append(PopularPlaceViewForMetrics(
                id=place.id,
                name=place.name,
                building_name=place.building_name,
                visit_count=place.visit_count
            ))

        return popular_places

    async def get_dashboard_metrics(self) -> MetricsDTO:
        return MetricsDTO(
            average_visit_duration_minutes=await self.get_average_visit_duration_minutes(),
            average_book_duration_minutes=await self.get_average_book_duration_minutes(),
            coworking_count=await self.get_coworking_count(),
            user_count=await self.get_user_count(),
            total_bookings=await self.get_total_bookings_count(),
            last_bookings=await self.get_last_five_bookings(),
            most_popular_places=await self.get_most_popular_places()
        )

    async def get_booking_statistics_by_time(self, days: int = 30) -> Dict[str, Any]:
        start_date = datetime.now() - timedelta(days=days)

        query_total = select(func.count()).select_from(PlaceVisit).where(
            PlaceVisit.created_at >= start_date
        )
        result_total = await self.session.execute(query_total)
        total_bookings = result_total.scalar() or 0

        query_completed = select(func.count()).select_from(PlaceVisit).where(
            PlaceVisit.is_visited == True,
            PlaceVisit.visit_till >= start_date
        )
        result_completed = await self.session.execute(query_completed)
        completed_visits = result_completed.scalar() or 0

        query_feedback = select(func.count()).select_from(PlaceVisit).where(
            PlaceVisit.is_feedbacked == True,
            PlaceVisit.visit_till >= start_date
        )
        result_feedback = await self.session.execute(query_feedback)
        with_feedback = result_feedback.scalar() or 0

        return {
            "period_days": days,
            "total_bookings": total_bookings,
            "completed_visits": completed_visits,
            "with_feedback": with_feedback,
            "completion_rate": round((completed_visits / total_bookings * 100) if total_bookings > 0 else 0, 2),
            "feedback_rate": round((with_feedback / completed_visits * 100) if completed_visits > 0 else 0, 2)
        }


async def get_metrics_service(session: SessionDep) -> MetricsService:
    return MetricsService(session)


MetricsServiceDep = Annotated[MetricsService, Depends(get_metrics_service)]

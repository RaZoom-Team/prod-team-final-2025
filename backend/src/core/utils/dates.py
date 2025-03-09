from datetime import datetime


__all__ = ("get_seconds_from_begin_day",)


def get_seconds_from_begin_day(date: datetime) -> int:
    return date.hour * 3600 + date.minute * 60 + date.second
from src.models import Building, Place


async def test_get_by_id(place_repo, test_place_model):
    place = await place_repo.get_by_id(test_place_model.id)
    assert place is not None
    assert place.id == test_place_model.id


async def test_search_by_building_id(place_repo, test_place_model):
    place = await place_repo.search_by_building_id(test_place_model.building_id)
    assert place is not None
    assert len(place) == 1
    assert place[0].id == test_place_model.building_id


async def test_bulk_insert(place_repo, db_session):
    building = Building(
        name="Test Building",
        description="A test building",
        address="123 Test Street",
        images_id=["1"],
        x=0,
        y=0,
    )
    db_session.add(building)
    await db_session.flush()
    await db_session.refresh(building)

    place_create = lambda: Place(
        building_id=building.id,
        name="SomePLace!",
        floor=0,
        features=[],
        size=0,
        rotate=0,
        x=0,
        y=0,
        image_id="0",
    )
    k = 1000

    places = [place_create() for _ in range(k)]
    await place_repo.bulk_insert(places)
    result = await place_repo.search_by_building_id(building.id)

    assert len(result) == k


# async def test_is_unable_to_visit(place_repo, place_id: int, start: datetime, end: datetime) -> bool:
#     ...
#
#
# async def test_get_visit_by_id(place_repo, visit_id: int) -> PlaceVisit | None:
#     ...


async def test_insert_place(place_repo, db_session):
    building = Building(
        name="Test Building",
        description="A test building",
        address="123 Test Street",
        images_id=["1"],
        x=0,
        y=0,
    )
    db_session.add(building)
    await db_session.flush()
    await db_session.refresh(building)

    place = Place(
        building_id=building.id,
        name="SomePLace!",
        floor=0,
        features=[],
        size=0,
        rotate=0,
        x=0,
        y=0,
        image_id="0",
    )
    place = await place_repo.insert_place(place)
    result = await place_repo.get_by_id(place.id)
    assert result is not None
    assert place.id == result.id

# async def test_insert_visit(place_repo, place_id: int, client_id: int, start: datetime, end: datetime) -> PlaceVisit:
#     ...
#
#
# async def test_delete_visit(place_repo, visit_id: int) -> None:
#     ...
#
#
# async def test_is_place_floor_exists(place_repo, building_id: int, floor: int) -> bool:
#     ...
#
#
# async def test_insert_floor(place_repo, obj: BuildingFloorImage) -> None:
#     ...
#
#
# async def test_insert_feedback(place_repo, feedback: Feedback) -> None:
#     ...
#
#
# async def test_delete_floor(place_repo, building_id: int, floor: int) -> None:
#     ...
#
#
# async def test_get_visits_by_building_id(place_repo, building_id: int) -> List[PlaceVisit]:
#     ...
#
#
# async def test_get_visits_by_client_id(place_repo, client_id: int) -> List[PlaceVisit]:
#     ...
#
#
# async def test_delete(place_repo, place: Place) -> None:
#     ...

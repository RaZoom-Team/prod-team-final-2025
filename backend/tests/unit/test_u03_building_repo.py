import pytest

from src.models import Building


@pytest.fixture
async def test_building_model(db_session):
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
    return building


@pytest.fixture
async def test_buildings_batch(db_session):
    buildings = []
    for i in range(5):
        building = Building(
            name="Test Building",
            description="A test building",
            address="123 Test Street",
            images_id=["1"],
            x=0,
            y=0,
        )
        buildings.append(building)

    db_session.add_all(buildings)
    await db_session.flush()
    for building in buildings:
        await db_session.refresh(building)
    return buildings


async def test_get_by_id(building_repo, test_building_model):
    result = await building_repo.get_by_id(test_building_model.id)
    assert result is not None
    assert result.name == test_building_model.name
    assert result.address == test_building_model.address
    assert result.description == test_building_model.description


async def test_get_by_id_not_found(building_repo):
    result = await building_repo.get_by_id(999)
    assert result is None


async def test_insert(building_repo):
    new_building = Building(
        name="Test Building",
        description="A test building",
        address="123 Test Street",
        images_id=["1"],
        x=0,
        y=0,
    )

    result = await building_repo.insert(new_building)
    assert result is not None
    assert result.id is not None
    assert result.name == "Test Building"
    assert result.address == "123 Test Street"
    assert result.description == "A test building"


async def test_delete(building_repo, test_building_model):
    building_id = test_building_model.id
    await building_repo.delete(test_building_model)
    result = await building_repo.get_by_id(building_id)
    assert result is None


async def test_find_all(building_repo, test_buildings_batch):
    buildings, count = await building_repo.find_all(limit=10, offset=0)
    assert len(buildings) == 5
    assert count == 5

    buildings, count = await building_repo.find_all(limit=2, offset=0)
    assert len(buildings) == 2
    assert count == 5

    buildings, count = await building_repo.find_all(limit=10, offset=2)
    assert len(buildings) == 3
    assert count == 5

    buildings, count = await building_repo.find_all(limit=2, offset=2)
    assert len(buildings) == 2
    assert count == 5

import asyncio
import pathlib
from typing import Any, Optional

import aioboto3
import pytest
from asgi_lifespan import LifespanManager
from faker import Faker
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from testcontainers.minio import MinioContainer
from testcontainers.postgres import PostgresContainer

from src.config import settings
from src.core.db import Base
from src.core.db.engine import get_engine, engine
from src.enums import AccessLevel
from src.main import app
from src.models import Building, Client, Place
from src.repo.building import BuildingRepository
from src.repo.client import ClientRepository
from src.repo.place import PlaceRepository
from src.schemes import CreateClientDTO
from src.service.application_settings import ApplicationSettingsService
from src.service.client import ClientService
from src.service.smtp.service import SMTPService


fake = Faker()


@pytest.fixture(scope="session")
def db_container():
    container = PostgresContainer(image="postgres:alpine")
    container.start()
    print("PostgreSQL container started at:", container.get_connection_url())
    yield container
    container.stop()


@pytest.fixture(scope="session")
def minio_container():
    container = MinioContainer(image="minio/minio")
    yield container.start()
    container.stop()


@pytest.fixture(scope="function")
async def db_engine(db_container):
    postgres_conn_str = db_container.get_connection_url().replace('postgresql+psycopg2', 'postgresql+asyncpg')
    engine = create_async_engine(postgres_conn_str)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture(scope="function")
async def db_session(db_engine):
    async with AsyncSession(db_engine) as session:
        yield session


@pytest.fixture(scope="function")
async def s3_session(minio_container):
    session = aioboto3.Session()
    minio_config = minio_container.get_config()
    async with session.client(
        "s3",
        endpoint_url="http://" + minio_config['endpoint'],
        aws_access_key_id=minio_config['access_key'],
        aws_secret_access_key=minio_config['secret_key']
    ) as conn:
        yield conn


@pytest.fixture(scope="function")
async def test_client(db_engine, minio_container, monkeypatch):
    # app.dependency_overrides[get_engine] = lambda: db_engine
    monkeypatch.setattr("src.core.db.engine.engine", db_engine)
    minio_config = minio_container.get_config()
    settings.aws_url = "http://" + minio_config['endpoint']
    settings.aws_access_key_id = minio_config['access_key']
    settings.aws_secret_access_key = minio_config['secret_key']
    async with LifespanManager(app) as manager:
        async with AsyncClient(
            transport=ASGITransport(app=manager.app, client=("0.0.0.0", 5732)),
            base_url="http://test",
        ) as c:
            yield c


@pytest.fixture(scope='session')
def event_loop():
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def client_repo(db_session):
    return ClientRepository(db_session)


@pytest.fixture(scope="function")
def building_repo(db_session):
    return BuildingRepository(db_session)


@pytest.fixture(scope="function")
def place_repo(db_session):
    return PlaceRepository(db_session)


@pytest.fixture(scope="function")
def smtp_service():
    return SMTPService()


@pytest.fixture(scope="function")
def client_service(client_repo, smtp_service):
    return ClientService(client_repo, smtp_service)


@pytest.fixture(scope="function")
def application_settings_service(db_session):
    return ApplicationSettingsService(db_session)


@pytest.fixture
def faker():
    return fake


@pytest.fixture
def fake_client_data():
    return {
        "name": fake.name(),
        "email": fake.email(),
        "password": fake.password(length=12, special_chars=True, digits=True, upper_case=True, lower_case=True)
    }


@pytest.fixture
def fake_clients_batch():
    def _generate_batch(batch_size=5):
        return [
            {
                "name": fake.name(),
                "email": fake.email(),
                "password": fake.password(length=12, special_chars=True, digits=True, upper_case=True, lower_case=True)
            }
            for _ in range(batch_size)
        ]

    return _generate_batch


def create_fake_client_data():
    return {
        "name": fake.name(),
        "email": fake.email(),
        "password": fake.password(length=12, special_chars=True, digits=True, upper_case=True, lower_case=True)
    }


def create_fake_clients_batch(batch_size=5):
    return [
        {
            "name": fake.name(),
            "email": fake.email(),
            "password": fake.password(length=12, special_chars=True, digits=True, upper_case=True, lower_case=True)
        }
        for _ in range(batch_size)
    ]


async def create_client(
    cl: AsyncClient,
    client: Optional[CreateClientDTO | dict[str, Any]] = None,
    waiting_status_code: int = 200,
) -> dict[str, Any]:
    if not client:
        client = create_fake_client_data()
    response = await cl.post('/auth/register', json=client)
    assert response.status_code == waiting_status_code
    return response.json()


async def create_admin_client(
    cl: AsyncClient,
) -> dict[str, Any]:
    client = create_fake_client_data()
    response = await cl.post("/admin/create_for_tests", json=client)
    assert response.status_code == 200
    return response.json()


def generate_client_data(custom_attrs=None):
    data = {
        "name": fake.name(),
        "email": fake.email(),
        "password": fake.password(length=10, special_chars=True),
    }

    if custom_attrs:
        data.update(custom_attrs)

    return data


async def upload_test_image(test_client) -> str:
    admin_client = await create_admin_client(test_client)
    headers = {"Authorization": f"{admin_client['token']}"}

    file_path = pathlib.Path(
        __file__
    ).parent / "images" / "telegram-cloud-photo-size-2-5341787324847092916-y.jpg"

    with open(file_path, "rb") as file:
        files = {"file": ("test_image.png", file, "image/png")}
        img_response = await test_client.post("/files", files=files, headers=headers)

    assert img_response.status_code == 200
    assert "image_id" in img_response.json()
    assert "image_url" in img_response.json()

    return img_response.json()["image_id"]


@pytest.fixture
async def test_client_model(db_session):
    client = Client(
        email="test@example.com",
        name="Test User",
        password="hashed_password",
        access_level=AccessLevel.USER
    )
    db_session.add(client)
    await db_session.flush()
    await db_session.refresh(client)
    return client


@pytest.fixture
async def test_place_model(db_session) -> Place:
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
    db_session.add(place)
    await db_session.flush()
    await db_session.refresh(place)
    return place

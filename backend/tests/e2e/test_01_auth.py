import pytest

from tests.conftest import create_client


async def test_register_ok(test_client):
    client = {
        "name": "string",
        "email": "user@example.com",
        "password": "string"
    }

    response = await test_client.post('/auth/register', json=client)
    assert response.status_code == 200


@pytest.mark.parametrize("client_data", [
    {"name": "string", "email": "user@example.com"},  # Пропущен пароль
    {"email": "user@example.com", "password": "string"},  # Пропущено имя
    {"name": "string", "password": "string"},  # Пропущен email
    # {"name": "", "email": "user@example.com", "password": "string"},  # Пустое имя
    {"name": "string", "email": "invalid-email", "password": "string"},  # Невалидный email
    {"name": "string", "email": "email@a.", "password": "string"},  # Невалидный email
    {"name": "string", "email": "email@some", "password": "string"},  # Невалидный email
    # {"name": "string", "email": "user@se.com", "password": ""},  # Пустой пароль
    # TODO: maybe add data with unsafe password
])
async def test_register_unprocessable_entity(test_client, client_data):
    await create_client(test_client, client_data, waiting_status_code=422)


async def test_register_already_exists(test_client):
    client = {
        "name": "string",
        "email": "user@example.com",
        "password": "string"
    }
    await create_client(test_client, client, waiting_status_code=200)
    await create_client(test_client, client, waiting_status_code=409)


async def test_login_ok(test_client):
    client = {
        "name": "string",
        "email": "user@example.com",
        "password": "string"
    }

    await create_client(test_client, client)

    response = await test_client.post('/auth/login', json=client)
    assert response.status_code == 200


@pytest.mark.parametrize("client_data", [
    {"email": "user@example.com"},  # Пропущен пароль
    {"password": "string"},  # Пропущен email
])
async def test_login_unprocessable_entity(test_client, client_data):
    response = await test_client.post('/auth/login', json=client_data)
    assert response.status_code == 422


async def test_login_not_found(test_client):
    client = {
        "name": "string",
        "email": "user@example.com",
        "password": "string"
    }

    response = await test_client.post('/auth/login', json=client)
    assert response.status_code == 401  # unauthorized as not found

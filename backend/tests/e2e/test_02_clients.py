import pytest

from src.schemes import CreateClientDTO
from tests.conftest import create_admin_client, create_client, create_fake_client_data, create_fake_clients_batch


async def test_get_client_ok(test_client):
    client = {
        "name": "string",
        "email": "user@example.com",
        "password": "string"
    }

    response = await create_client(test_client, client)

    response = await test_client.get(f"/clients/@me", headers={"Authorization": response["token"]})
    assert response.status_code == 200


async def test_get_client_not_found(test_client):
    # Get admin with token - make sure to call this as a function
    admin_response = await create_admin_client(test_client)

    # User with id is not exist
    response = await test_client.get(f"/clients/10", headers={"Authorization": admin_response["token"]})
    assert response.status_code == 404


async def test_get_client_forbidden(test_client):
    # Get client with token - make sure to call this as a function
    client_response = await create_client(test_client)

    # User with id is not exist
    response = await test_client.get(f"/clients/10", headers={"Authorization": client_response["token"]})
    assert response.status_code == 403


@pytest.mark.parametrize("batch_size", [1, 5, 10])
async def test_valid_bulk(client_service, smtp_service, batch_size):
    admin_client = create_fake_client_data()
    client = create_fake_client_data()
    clients = create_fake_clients_batch(batch_size=batch_size)
    all_clients = [client] + clients

    for client_data in all_clients:
        await client_service.insert(CreateClientDTO(**client_data))

    await client_service.create_admin_for_tests(CreateClientDTO(**admin_client))

    fetched_clients = await client_service.get_all(limit=len(all_clients))

    assert len(fetched_clients) >= len(all_clients)

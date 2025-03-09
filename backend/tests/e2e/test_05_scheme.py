from tests.conftest import create_admin_client, upload_test_image


async def test_create_schema_ok(test_client):
    admin_client = await create_admin_client(test_client)
    headers = {"Authorization": f"{admin_client['token']}"}
    image_id = await upload_test_image(test_client)
    building_data = {
        "name": "Main Building",
        "description": "The main building of the company",
        "address": "123 Main St",
        "x": 10.5,
        "y": 20.5,
        "images_id": [image_id]
    }
    building_response = await test_client.post("/buildings", json=building_data, headers=headers)
    assert building_response.status_code == 200
    assert building_response.json()["name"] == "Main Building"

    scheme_create_data = {
        "floor": 0,
        "image_id": image_id
    }
    response = await test_client.post(
        f"/buildings/{building_response.json()["id"]}/schemes",
        json=scheme_create_data,
        headers=headers
    )
    assert response.status_code == 204


async def test_create_schema_building_not_found(test_client):
    admin_client = await create_admin_client(test_client)
    headers = {"Authorization": f"{admin_client['token']}"}
    image_id = await upload_test_image(test_client)

    scheme_create_data = {
        "floor": 0,
        "image_id": image_id
    }
    response = await test_client.post(
        f"/buildings/1/schemes",
        json=scheme_create_data,
        headers=headers
    )
    assert response.status_code == 404


async def test_create_schema_building_forbidden(test_client):
    image_id = await upload_test_image(test_client)

    scheme_create_data = {
        "floor": 0,
        "image_id": image_id
    }
    response = await test_client.post(
        f"/buildings/1/schemes",
        json=scheme_create_data,
    )
    assert response.status_code == 403


async def test_get_schema_ok(test_client):
    admin_client = await create_admin_client(test_client)
    headers = {"Authorization": f"{admin_client['token']}"}
    image_id = await upload_test_image(test_client)
    building_data = {
        "name": "Main Building",
        "description": "The main building of the company",
        "address": "123 Main St",
        "x": 10.5,
        "y": 20.5,
        "images_id": [image_id]
    }
    building_response = await test_client.post("/buildings", json=building_data, headers=headers)
    assert building_response.status_code == 200
    assert building_response.json()["name"] == "Main Building"

    scheme_create_data = {
        "floor": 0,
        "image_id": image_id
    }
    create_response = await test_client.post(
        f"/buildings/{building_response.json()["id"]}/schemes",
        json=scheme_create_data,
        headers=headers
    )
    assert create_response.status_code == 204

    response = await test_client.get(
        f"/buildings/{building_response.json()["id"]}/schemes"
    )

    assert response.status_code == 200


async def test_get_schema_not_found(test_client):
    admin_client = await create_admin_client(test_client)
    headers = {"Authorization": f"{admin_client['token']}"}
    image_id = await upload_test_image(test_client)
    response = await test_client.get(
        f"/buildings/123/schemes",
        headers=headers,
    )

    assert response.status_code == 404

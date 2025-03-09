from tests.conftest import create_admin_client, upload_test_image


async def test_create_floor_by_place_ok(test_client):
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
    create_scheme_response = await test_client.post(
        f"/buildings/{building_response.json()["id"]}/schemes",
        json=scheme_create_data,
        headers=headers
    )
    assert create_scheme_response.status_code == 204

    create_floor_data = {
        "name": "string",
        "features": [],
        "size": 1,
        "rotate": 0,
        "x": 0,
        "y": 0,
        "image_id": image_id
    }

    response = await test_client.post(
        f"/buildings/{building_response.json()["id"]}/schemes/{0}",
        json=create_floor_data,
        headers=headers
    )

    assert response.status_code == 200


async def test_delete_created_floor_ok(test_client):
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
    create_scheme_response = await test_client.post(
        f"/buildings/{building_response.json()["id"]}/schemes",
        json=scheme_create_data,
        headers=headers
    )
    assert create_scheme_response.status_code == 204

    create_floor_data = {
        "name": "string",
        "features": [],
        "size": 1,
        "rotate": 0,
        "x": 0,
        "y": 0,
        "image_id": image_id
    }

    response = await test_client.post(
        f"/buildings/{building_response.json()["id"]}/schemes/{0}",
        json=create_floor_data,
        headers=headers
    )

    assert response.status_code == 200

    response = await test_client.delete(
        f"/buildings/{building_response.json()["id"]}/schemes/{0}",
        headers=headers
    )

    assert response.status_code == 204

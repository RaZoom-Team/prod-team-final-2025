from tests.conftest import create_admin_client, upload_test_image


async def test_get_visits_by_place_ok(test_client):
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

    get_visits_response = await test_client.get(
        f"/buildings/{building_response.json()["id"]}/schemes/visits"
    )

    assert get_visits_response.status_code == 200


async def test_get_visits_by_place_not_found(test_client):
    admin_client = await create_admin_client(test_client)
    headers = {"Authorization": f"{admin_client['token']}"}
    get_visits_response = await test_client.get(
        f"/buildings/9999/schemes/visits",
        headers=headers
    )

    assert get_visits_response.status_code == 404


async def test_create_visit_ok(test_client):
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

    create_place_data = {
        "name": "string",
        "features": [],
        "size": 1,
        "rotate": 0,
        "x": 0,
        "y": 0,
        "image_id": image_id
    }
    create_place_response = await test_client.post(
        f"/buildings/{building_response.json()["id"]}/schemes/{0}",
        json=create_place_data,
        headers=headers
    )

    assert create_place_response.status_code == 200

    create_visit_data = {

        "visit_from": "2035-03-03T09:12:04.064Z",
        "visit_till": "2035-03-03T19:12:04.064Z"
    }

    create_visit_response = await test_client.post(
        f"/buildings/{building_response.json()["id"]}/places/{create_place_response.json()["id"]}/visits",
        json=create_visit_data,
        headers=headers
    )

    assert create_visit_response.status_code == 200


async def test_create_visit_place_not_found(test_client):
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

    create_visit_data = {

        "visit_from": "2035-03-03T09:12:04.064Z",
        "visit_till": "2035-03-03T19:12:04.064Z"
    }

    create_visit_response = await test_client.post(
        f"/buildings/{building_response.json()["id"]}/places/9999/visits",
        json=create_visit_data,
        headers=headers
    )

    assert create_visit_response.status_code == 404


async def test_create_visit_building_not_found(test_client):
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

    create_place_data = {
        "name": "string",
        "features": [],
        "size": 1,
        "rotate": 0,
        "x": 0,
        "y": 0,
        "image_id": image_id
    }
    create_place_response = await test_client.post(
        f"/buildings/{building_response.json()["id"]}/schemes/{0}",
        json=create_place_data,
        headers=headers
    )

    assert create_place_response.status_code == 200

    create_visit_data = {

        "visit_from": "2035-03-03T09:12:04.064Z",
        "visit_till": "2035-03-03T19:12:04.064Z"
    }

    create_visit_response = await test_client.post(
        f"/buildings/9999/places/{create_place_response.json()["id"]}/visits",
        json=create_visit_data,
        headers=headers
    )

    assert create_visit_response.status_code == 404

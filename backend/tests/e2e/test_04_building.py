from tests.conftest import create_admin_client, create_client, upload_test_image


async def test_get_all_buildings(test_client):
    admin_client = await create_admin_client(test_client)
    headers = {"Authorization": f"{admin_client['token']}"}

    response = await test_client.get("/buildings", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 0

    image_id = await upload_test_image(test_client)
    building_data = {
        "name": "Main Building",
        "description": "The main building of the company",
        "address": "123 Main St",
        "x": 10.5,
        "y": 20.5,
        "images_id": [image_id]
    }
    response = await test_client.post("/buildings", json=building_data, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Main Building"
    response = await test_client.get("/buildings", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 1


async def test_get_building_by_id(test_client):
    admin_client = await create_admin_client(test_client)
    headers = {"Authorization": f"{admin_client['token']}"}

    response = await test_client.get(f"/buildings/9999", headers=headers)
    assert response.status_code == 404

    image_id = await upload_test_image(test_client)
    building_data = {
        "name": "Main Building",
        "description": "The main building of the company",
        "address": "123 Main St",
        "x": 10.5,
        "y": 20.5,
        "images_id": [image_id]
    }
    response = await test_client.post("/buildings", json=building_data, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Main Building"
    response = await test_client.get(f"/buildings/{response.json()['id']}", headers=headers)
    assert response.status_code == 200


async def test_create_building(test_client):
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
    response = await test_client.post("/buildings", json=building_data, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Main Building"


async def test_patch_building_by_id(test_client):
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
    response = await test_client.post("/buildings", json=building_data, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Main Building"
    building_id = response.json()["id"]

    patch_data = {
        "name": "Other Building",
        "description": "The other building of this company",
        "address": "12333 Main St",
        "x": 105.5,
        "y": 210.5,
        "images_id": [image_id]
    }

    response = await test_client.patch(f"/buildings/{building_id}", json=patch_data, headers=headers)
    assert response.status_code == 200


async def test_patch_building_by_id_forbidden(test_client):
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
    response = await test_client.post("/buildings", json=building_data, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Main Building"
    building_id = response.json()["id"]

    patch_data = {
        "name": "Other Building",
        "description": "The other building of this company",
        "address": "12333 Main St",
        "x": 105.5,
        "y": 210.5,
        "images_id": [image_id]
    }

    default_client = await create_client(test_client)
    headers = {"Authorization": f"{default_client['token']}"}

    response = await test_client.patch(f"/buildings/{building_id}", json=patch_data, headers=headers)
    assert response.status_code == 403


async def test_patch_building_by_id_not_found(test_client):
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
    response = await test_client.post("/buildings", json=building_data, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Main Building"

    patch_data = {
        "name": "Other Building",
        "description": "The other building of this company",
        "address": "12333 Main St",
        "x": 105.5,
        "y": 210.5,
        "images_id": [image_id]
    }

    response = await test_client.patch(f"/buildings/999", json=patch_data, headers=headers)
    assert response.status_code == 404

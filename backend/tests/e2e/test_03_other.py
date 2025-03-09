# import pathlib
#
# from tests.conftest import create_admin_client
#
#
# # async def test_create_building(test_client):
# #     admin_client = await create_admin_client(test_client)
# #     headers = {"Authorization": f"{admin_client['token']}"}
# #     building_data = {
# #         "name": "Main Building",
# #         "description": "The main building of the company",
# #         "address": "123 Main St",
# #         "x": 10.5,
# #         "y": 20.5
# #     }
# #     response = await test_client.post("/buildings", json=building_data, headers=headers)
# #     assert response.status_code == 200
# #     assert response.json()["name"] == "Main Building"
# #
# #
# # async def test_upload_file(test_client):
# #     admin_client = await create_admin_client(test_client)
# #     headers = {"Authorization": f"Bearer {admin_client['token']}"}
# #
# #     file_path = pathlib.Path(
# #         __file__
# #     ).parent.parent / "images" / "telegram-cloud-photo-size-2-5341787324847092916-y.jpg"
# #
# #     with open(file_path, "rb") as file:
# #         files = {"file": ("test_image.png", file, "image/png")}
# #         response = await test_client.post("/files", files=files, headers=headers)
# #
# #     assert response.status_code == 200
# #     assert "image_id" in response.json()
# #     assert "image_url" in response.json()
# #
# #
# # async def test_create_scheme(test_client):
# #     admin_client = await create_admin_client(test_client)
# #     headers = {"Authorization": f"{admin_client['token']}"}
# #     building_data = {
# #         "name": "Secondary Building",
# #         "description": "The secondary building of the company",
# #         "address": "456 Secondary St",
# #         "x": 15.5,
# #         "y": 25.5
# #     }
# #     building_response = await test_client.post("/buildings", json=building_data, headers=headers)
# #     building_id = building_response.json()["id"]
# #
# #     file_path = pathlib.Path(
# #         __file__
# #     ).parent.parent / "images" / "telegram-cloud-photo-size-2-5341787324847092916-y.jpg"
# #
# #     with open(file_path, "rb") as file:
# #         files = {"file": ("test_image.png", file, "image/png")}
# #         response = await test_client.post("/files", files=files, headers=headers)
# #
# #     assert response.status_code == 200
# #     assert "image_id" in response.json()
# #     assert "image_url" in response.json()
# #
# #     scheme_data = {
# #         "floor": 1,
# #         "image_id": response.json()["image_id"],
# #         "places": [
# #             {
# #                 "name": "Place 1",
# #                 "features": ["feature1", "feature2"],
# #                 "size": 2,
# #                 "rotate": 0,
# #                 "x": 5.5,
# #                 "y": 10.5,
# #             }
# #         ]
# #     }
# #     response = await test_client.post(f"/buildings/{building_id}/schemes", json=scheme_data, headers=headers)
# #     assert response.status_code == 200
# #     assert len(response.json()) > 0
# #
# #
# async def test_book_place(test_client):
#     admin_client = await create_admin_client(test_client)
#     headers = {"Authorization": f"{admin_client['token']}"}
#
#     file_path = pathlib.Path(
#         __file__
#     ).parent.parent / "images" / "telegram-cloud-photo-size-2-5341787324847092916-y.jpg"
#
#     with open(file_path, "rb") as file:
#         files = {"file": ("test_image.png", file, "image/png")}
#         img_response = await test_client.post("/files", files=files, headers=headers)
#
#     assert img_response.status_code == 200
#     assert "image_id" in img_response.json()
#     assert "image_url" in img_response.json()
#
#     building_data = {
#         "name": "Tertiary Building",
#         "description": "The tertiary building of the company",
#         "address": "789 Tertiary St",
#         "x": 20.5,
#         "y": 30.5,
#         "images_id": [img_response.json()["image_id"]]
#     }
#     building_response = await test_client.post("/buildings", json=building_data, headers=headers)
#     building_id = building_response.json()["id"]
#
#     scheme_data = {
#         "floor": 1,
#         "image_id": img_response.json()["image_id"],
#         "places": [
#             {
#                 "name": "Place 2",
#                 "features": ["feature3", "feature4"],
#                 "size": 3,
#                 "rotate": 90,
#                 "x": 15.5,
#                 "y": 20.5,
#                 "image_id": img_response.json()["image_id"]
#             }
#         ]
#     }
#     scheme_response = await test_client.post(f"/buildings/{building_id}/schemes", json=scheme_data, headers=headers)
#     print(scheme_response.status_code)
#     place_id = scheme_response.json()[0]["id"]
#     #
#     # visit_data = {
#     #     "visit_from": "2030-10-01T10:00:00",
#     #     "visit_till": "2030-10-01T12:00:00"
#     # }
#     # response = await test_client.post(f"/buildings/{building_id}/places/{place_id}/visits", json=visit_data,
#     #                                   headers=headers)
#     # assert response.status_code == 200
# #
# #
# # async def test_cancel_booking(test_client):
# #     admin_client = await create_admin_client(test_client)
# #     headers = {"Authorization": f"{admin_client['token']}"}
# #     building_data = {
# #         "name": "Quaternary Building",
# #         "description": "The quaternary building of the company",
# #         "address": "101 Quaternary St",
# #         "x": 25.5,
# #         "y": 35.5
# #     }
# #     building_response = await test_client.post("/buildings", json=building_data, headers=headers)
# #     building_id = building_response.json()["id"]
# #
# #     file_path = pathlib.Path(
# #         __file__
# #     ).parent.parent / "images" / "telegram-cloud-photo-size-2-5341787324847092916-y.jpg"
# #
# #     with open(file_path, "rb") as file:
# #         files = {"file": ("test_image.png", file, "image/png")}
# #         response = await test_client.post("/files", files=files, headers=headers)
# #
# #     assert response.status_code == 200
# #     assert "image_id" in response.json()
# #     assert "image_url" in response.json()
# #
# #     scheme_data = {
# #         "floor": 1,
# #         "image_id": response.json()["image_id"],
# #         "places": [
# #             {
# #                 "name": "Place 3",
# #                 "features": ["feature5", "feature6"],
# #                 "size": 4,
# #                 "rotate": 180,
# #                 "x": 25.5,
# #                 "y": 30.5,
# #                 "image_id": response.json()["image_id"]
# #             }
# #         ]
# #     }
# #     scheme_response = await test_client.post(f"/buildings/{building_id}/schemes", json=scheme_data, headers=headers)
# #     place_id = scheme_response.json()[0]["id"]
# #
# #     visit_data = {
# #         "visit_from": "2030-10-02T10:00:00",
# #         "visit_till": "2030-10-02T12:00:00"
# #     }
# #     visit_response = await test_client.post(f"/buildings/{building_id}/places/{place_id}/visits", json=visit_data,
# #                                             headers=headers)
# #     visit_id = visit_response.json()["id"]
# #     response = await test_client.delete(f"/buildings/{building_id}/places/{place_id}/visits/{visit_id}",
# #                                         headers=headers)
# #     assert response.status_code == 204
# #
# #
# # async def test_get_client_info(test_client):
# #     client_data = {
# #         "name": "Alice Smith",
# #         "email": "alice.smith@example.com",
# #         "password": "securepassword123"
# #     }
# #     register_response = await test_client.post("/auth/register", json=client_data)
# #     token = register_response.json()["token"]
# #     headers = {"Authorization": f"{token}"}
# #
# #     response = await test_client.get("/clients/@me", headers=headers)
# #     assert response.status_code == 200
# #     assert response.json()["email"] == "alice.smith@example.com"
# #
# #
# # async def test_update_client_info(test_client):
# #     client_data = {
# #         "name": "Bob Johnson",
# #         "email": "bob.johnson@example.com",
# #         "password": "securepassword123"
# #     }
# #     register_response = await test_client.post("/auth/register", json=client_data)
# #     token = register_response.json()["token"]
# #     headers = {"Authorization": f"{token}"}
# #
# #     get_response = await test_client.get("/clients/@me", headers=headers)
# #
# #     update_data = {
# #         "name": "Robert Johnson"
# #     }
# #     response = await test_client.patch(f"/clients/{get_response.json()['id']}", json=update_data, headers=headers)
# #     print(response.json())
# #     assert response.status_code == 200
# #     assert response.json()["name"] == "Robert Johnson"
# #
# #
# # # async def test_get_all_buildings(test_client):
# # #     admin_client = await create_admin_client(test_client)
# # #     headers = {"Authorization": f"{admin_client['token']}"}
# # #
# # #     building_data = {
# # #         "name": "Building A",
# # #         "description": "Description of Building A",
# # #         "address": "123 Building A St",
# # #         "x": 10.0,
# # #         "y": 20.0
# # #     }
# # #     await test_client.post("/buildings", json=building_data, headers=headers)
# # #
# # #     response = await test_client.get("/buildings", headers=headers)
# # #     assert response.status_code == 200
# # #     assert len(response.json()) > 0
# #
# #
# # async def test_get_building_by_id(test_client):
# #     admin_client = await create_admin_client(test_client)
# #     headers = {"Authorization": f"{admin_client['token']}"}
# #
# #     building_data = {
# #         "name": "Building B",
# #         "description": "Description of Building B",
# #         "address": "456 Building B St",
# #         "x": 15.0,
# #         "y": 25.0
# #     }
# #     building_response = await test_client.post("/buildings", json=building_data, headers=headers)
# #     building_id = building_response.json()["id"]
# #
# #     response = await test_client.get(f"/buildings/{building_id}", headers=headers)
# #     assert response.status_code == 200
# #     assert response.json()["name"] == "Building B"
# #
# #
# # async def test_update_building(test_client):
# #     admin_client = await create_admin_client(test_client)
# #     headers = {"Authorization": f"{admin_client['token']}"}
# #
# #     building_data = {
# #         "name": "Building C",
# #         "description": "Description of Building C",
# #         "address": "789 Building C St",
# #         "x": 20.0,
# #         "y": 30.0
# #     }
# #     building_response = await test_client.post("/buildings", json=building_data, headers=headers)
# #     building_id = building_response.json()["id"]
# #
# #     update_data = {
# #         "name": "Updated Building C",
# #         "description": "Updated Description of Building C",
# #         "address": "Updated 789 Building C St",
# #         "x": 25.0,
# #         "y": 35.0
# #     }
# #     response = await test_client.patch(f"/buildings/{building_id}", json=update_data, headers=headers)
# #     assert response.status_code == 200
# #     assert response.json()["name"] == "Updated Building C"
# #
# #
# # # async def test_get_client_visits(test_client):
# # #     client_data = {
# # #         "name": "Charlie Brown",
# # #         "email": "charlie.brown@example.com",
# # #         "password": "securepassword123"
# # #     }
# # #     register_response = await test_client.post("/auth/register", json=client_data)
# # #     token = register_response.json()["token"]
# # #     headers = {"Authorization": f"{token}"}
# # #
# # #     response = await test_client.get("/clients/@me/visits", headers=headers)
# # #     assert response.status_code == 200
# # #     assert isinstance(response.json(), dict)
# #
# #
# # async def test_upload_file(test_client):  # noqa
# #     admin_client = await create_admin_client(test_client)
# #     headers = {"Authorization": f"{admin_client['token']}"}
# #
# #     file_path = pathlib.Path(
# #         __file__
# #     ).parent.parent / "images" / "telegram-cloud-photo-size-2-5341787324847092916-y.jpg"
# #
# #     with open(file_path, "rb") as file:
# #         files = {"file": ("test_image.png", file, "image/png")}
# #         img_response = await test_client.post("/files", files=files, headers=headers)
# #
# #     assert img_response.status_code == 200
# #     assert "image_id" in img_response.json()
# #     assert "image_url" in img_response.json()
# #
# #
# # async def test_create_scheme_with_multiple_places(test_client):
# #     admin_client = await create_admin_client(test_client)
# #     headers = {"Authorization": f"{admin_client['token']}"}
# #
# #     building_data = {
# #         "name": "Building D",
# #         "description": "Description of Building D",
# #         "address": "101 Building D St",
# #         "x": 30.0,
# #         "y": 40.0
# #     }
# #     building_response = await test_client.post("/buildings", json=building_data, headers=headers)
# #     building_id = building_response.json()["id"]
# #
# #     file_path = pathlib.Path(
# #         __file__
# #     ).parent.parent / "images" / "telegram-cloud-photo-size-2-5341787324847092916-y.jpg"
# #
# #     with open(file_path, "rb") as file:
# #         files = {"file": ("test_image.png", file, "image/png")}
# #         img_response = await test_client.post("/files", files=files, headers=headers)
# #
# #     assert img_response.status_code == 200
# #     assert "image_id" in img_response.json()
# #     assert "image_url" in img_response.json()
# #
# #     scheme_data = {
# #         "floor": 2,
# #         "image_id": img_response.json()["image_id"],
# #         "places": [
# #             {
# #                 "name": "Place 4",
# #                 "features": ["feature7", "feature8"],
# #                 "size": 5,
# #                 "rotate": 270,
# #                 "x": 35.0,
# #                 "y": 45.0,
# #                 "image_id": img_response.json()["image_id"]
# #             },
# #             {
# #                 "name": "Place 5",
# #                 "features": ["feature9", "feature10"],
# #                 "size": 6,
# #                 "rotate": 0,
# #                 "x": 40.0,
# #                 "y": 50.0,
# #                 "image_id": img_response.json()["image_id"]
# #             }
# #         ]
# #     }
# #     response = await test_client.post(f"/buildings/{building_id}/schemes", json=scheme_data, headers=headers)
# #     assert response.status_code == 200
# #     assert len(response.json()) == 2
# #
# #
# # async def test_get_all_places_by_building(test_client):
# #     admin_client = await create_admin_client(test_client)
# #     headers = {"Authorization": f"{admin_client['token']}"}
# #
# #     building_data = {
# #         "name": "Building E",
# #         "description": "Description of Building E",
# #         "address": "202 Building E St",
# #         "x": 50.0,
# #         "y": 60.0
# #     }
# #     building_response = await test_client.post("/buildings", json=building_data, headers=headers)
# #     building_id = building_response.json()["id"]
# #
# #     file_path = pathlib.Path(
# #         __file__
# #     ).parent.parent / "images" / "telegram-cloud-photo-size-2-5341787324847092916-y.jpg"
# #
# #     with open(file_path, "rb") as file:
# #         files = {"file": ("test_image.png", file, "image/png")}
# #         img_response = await test_client.post("/files", files=files, headers=headers)
# #
# #     assert img_response.status_code == 200
# #     assert "image_id" in img_response.json()
# #     assert "image_url" in img_response.json()
# #
# #     scheme_data = {
# #         "floor": 3,
# #         "image_id": img_response.json()["image_id"],
# #         "places": [
# #             {
# #                 "name": "Place 6",
# #                 "features": ["feature11", "feature12"],
# #                 "size": 7,
# #                 "rotate": 90,
# #                 "x": 55.0,
# #                 "y": 65.0,
# #                 "image_id": img_response.json()["image_id"]
# #             }
# #         ]
# #     }
# #     await test_client.post(f"/buildings/{building_id}/schemes", json=scheme_data, headers=headers)
# #
# #     response = await test_client.get(
# #         f"/buildings/{building_id}/schemes?start_time=2030-10-01T00:00:00&end_time=2030-10-02T00:00:00",
# #         headers=headers)
# #     assert response.status_code == 200
# #     assert len(response.json()) > 0
# #
# #
# # async def test_create_visit_outside_working_hours(test_client):
# #     admin_client = await create_admin_client(test_client)
# #     headers = {"Authorization": f"{admin_client['token']}"}
# #
# #     building_data = {
# #         "name": "Building F",
# #         "description": "Description of Building F",
# #         "address": "303 Building F St",
# #         "x": 60.0,
# #         "y": 70.0,
# #         "open_from": 9 * 3600,
# #         "open_till": 18 * 3600
# #     }
# #     building_response = await test_client.post("/buildings", json=building_data, headers=headers)
# #     building_id = building_response.json()["id"]
# #
# #     file_path = pathlib.Path(
# #         __file__
# #     ).parent.parent / "images" / "telegram-cloud-photo-size-2-5341787324847092916-y.jpg"
# #
# #     with open(file_path, "rb") as file:
# #         files = {"file": ("test_image.png", file, "image/png")}
# #         img_response = await test_client.post("/files", files=files, headers=headers)
# #
# #     assert img_response.status_code == 200
# #     assert "image_id" in img_response.json()
# #     assert "image_url" in img_response.json()
# #
# #     scheme_data = {
# #         "floor": 4,
# #         "image_id": img_response.json()["image_id"],
# #         "places": [
# #             {
# #                 "name": "Place 7",
# #                 "features": ["feature13", "feature14"],
# #                 "size": 8,
# #                 "rotate": 180,
# #                 "x": 65.0,
# #                 "y": 75.0,
# #                 "image_id": img_response.json()["image_id"]
# #             }
# #         ]
# #     }
# #     scheme_response = await test_client.post(f"/buildings/{building_id}/schemes", json=scheme_data, headers=headers)
# #     place_id = scheme_response.json()[0]["id"]
# #
# #     visit_data = {
# #         "visit_from": "2030-10-01T19:00:00",
# #         "visit_till": "2030-10-01T20:00:00"
# #     }
# #     response = await test_client.post(f"/buildings/{building_id}/places/{place_id}/visits", json=visit_data,
# #                                       headers=headers)
# #
# #     assert response.status_code == 400

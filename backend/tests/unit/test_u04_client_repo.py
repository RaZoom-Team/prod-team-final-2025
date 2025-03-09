from src.enums import AccessLevel


async def test_get_by_id(client_repo, test_client_model):
    result = await client_repo.get_by_id(test_client_model.id)
    assert result is not None
    assert result.email == test_client_model.email


async def test_get_by_email(client_repo, test_client_model):
    client = await client_repo.get_by_email(test_client_model.email)
    assert client is not None
    assert client.email == test_client_model.email


async def test_is_exists_by_email(client_repo, test_client_model):
    client = await client_repo.is_exists_by_email(test_client_model.email)
    assert client


async def test_get_by_auth(): ...


async def test_insert(client_repo, test_client_model):
    result = await client_repo.insert(
        email=test_client_model.email,
        hashed_password=test_client_model.password,
        name=test_client_model.name,
        access_level=test_client_model.access_level,
    )
    assert result is not None


async def test_find_all(client_repo, test_client_model):
    result = await client_repo.find_all()
    assert result is not None
    assert len(result) == 1


async def test_find_all_access_level_filter_found(client_repo, test_client_model):
    result = await client_repo.find_all_access_level_filter(test_client_model.access_level)
    assert result is not None
    assert len(result) == 1


async def test_find_all_access_level_filter_not_found(client_repo, test_client_model):
    result = await client_repo.find_all_access_level_filter(AccessLevel.OWNER)
    assert len(result) == 0


async def test_set_access_level(client_repo, test_client_model):
    await client_repo.set_access_level_by_id(id=test_client_model.id, access_level=AccessLevel.OWNER)
    result = await client_repo.get_by_id(test_client_model.id)
    assert result is not None
    assert result.access_level == AccessLevel.OWNER

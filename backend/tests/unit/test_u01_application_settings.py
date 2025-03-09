from src.core.exc import NotFoundError


async def test_application_settings_set_ok(application_settings_service):
    await application_settings_service.set("accent_color", "some")


async def test_application_settings_set_invalid(application_settings_service):
    try:
        await application_settings_service.set("unknown_setting", "some")
    except NotFoundError:
        pass  # ok!

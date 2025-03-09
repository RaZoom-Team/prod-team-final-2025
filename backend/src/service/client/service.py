import hashlib
from typing import Annotated, List

from fastapi import BackgroundTasks, Depends

from src.core.exc import EmailConflictError, UnauthorizedError
from src.enums import AccessLevel
from src.models import Client
from src.repo.client import ClientRepoDep, ClientRepository
from src.schemes import CreateClientDTO, UpdateClientDTO, ClientCurrentVisitDTO, CreateAdminDTO
from src.service.smtp import SMTPServiceDep, SMTPService
from src.core.utils.jwt import create_token


__all__ = ("ClientService", "ClientServiceDep")




class ClientService:

    def __init__(self, repo: ClientRepository, smtp_service: SMTPService):
        self.repo = repo
        self.smtp_service = smtp_service

    async def get_by_id(self, user_id: int) -> Client | None:
        return await self.repo.get_by_id(user_id)

    async def login(self, email: str, password: str) -> str:
        client = await self.repo.get_by_auth(email, hashlib.sha256(password.encode()).hexdigest())
        if not client:
            raise UnauthorizedError("Invalid email or password")
        return create_token(client)

    async def insert(self, client: CreateClientDTO) -> Client:
        if await self.repo.is_exists_by_email(str(client.email)):
            raise EmailConflictError
        return await self.repo.insert(
            str(client.email),
            hashlib.sha256(client.password.encode()).hexdigest(),
            client.name
        )

    async def update(self, client: Client, data: UpdateClientDTO):
        client.name = data.name

    async def create_admin(self, admin: CreateAdminDTO, background_tasks: BackgroundTasks):
        if await self.repo.is_exists_by_email(str(admin.email)):
            await self.repo.set_access_level_by_email(email=str(admin.email), access_level=AccessLevel.ADMIN)
        else:
            await self.repo.insert(
                email=str(admin.email),
                hashed_password=None,
                name="",
                access_level=AccessLevel.ADMIN,
            )
        background_tasks.add_task(self.smtp_service.send_admin_register_email, admin)

    async def create_admin_for_tests(self, client: CreateClientDTO) -> Client:
        if await self.repo.is_exists_by_email(str(client.email)):
            raise EmailConflictError

        return await self.repo.insert(
            str(client.email),
            hashlib.sha256(client.password.encode()).hexdigest(),
            client.name,
            access_level=AccessLevel.ADMIN,
        )

    async def get_all(self, limit: int = 100, offset: int = 0, order_by: str = "id") -> list[Client]:
        return await self.repo.find_all(limit=limit, offset=offset, order_by=order_by)

    async def get_all_admins(self) -> list[Client]:
        return await self.repo.find_all_access_level_filter(
            access_level=AccessLevel.ADMIN
        )

    async def remove_admin(self, admin_id: int) -> None:
        await self.repo.set_access_level_by_id(id=admin_id, access_level=AccessLevel.USER)

    async def get_currently_visiting_clients_with_places(self) -> List[ClientCurrentVisitDTO]:
        return await self.repo.get_currently_visiting_clients_with_places()


def create_client_service(repo: ClientRepoDep, smtp_service: SMTPServiceDep) -> ClientService:
    return ClientService(repo, smtp_service)


ClientServiceDep = Annotated[ClientService, Depends(create_client_service)]

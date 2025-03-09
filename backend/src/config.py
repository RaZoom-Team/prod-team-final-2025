from dotenv import load_dotenv
from pydantic.v1 import BaseSettings


class Settings(BaseSettings):
    database_host: str = "localhost"
    database_port: int = 5432
    database_user: str = ""
    database_password: str = ""
    database_name: str = ""

    aws_url: str = ""
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_images_bucket: str = "images"

    api_url: str = "http://localhost:8000"

    jwt_secret: str = "jwt_secret"
    jwt_algorithm: str = "HS256"
    jwt_expires: int = 3600 * 24

    root_path: str = ""

    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""

    super_user_email: str = "admin@gmail.com"
    super_user_password: str = "admin"
    super_user_name: str = "Владелец"

    application_settings: dict[str, str] = {}

    host_url: str = "http://localhost:8000"

    @property
    def database_url(self):
        return f"postgresql+asyncpg://{self.database_user}:{self.database_password}@{self.database_host}:{self.database_port}/{self.database_name}"


load_dotenv()
settings = Settings()

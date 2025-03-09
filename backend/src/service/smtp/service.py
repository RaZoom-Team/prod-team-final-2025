import smtplib
from email.mime.text import MIMEText
from typing import Annotated

from fastapi.params import Depends
from pydantic import EmailStr

from src.config import settings
from src.schemes.admin import CreateAdminDTO


__all__ = ("SMTPService", "SMTPServiceDep")


class SMTPService:
    async def send_admin_register_email(self, admin: CreateAdminDTO):
        msg = self.__create_email_message(
            receiver=admin.email,
            subject="Приглашение в BookIT",
            text=f"""\
            Привет!<br><br>
            Тебя назначили администратором в сервисе BookIT.<br><br>
            <a href="{settings.host_url}/register?email={admin.email}">
            Нажми здесь, чтобы зарегистрироваться</a>.
            """,  # TODO: добавить base_url на котором захосчено приложение
        )
        self.__send_email_message(msg)

    @staticmethod
    def __create_email_message(receiver: EmailStr, subject: str, text: str) -> MIMEText:
        msg = MIMEText(text, "html")
        msg["Subject"] = subject
        msg["From"] = settings.smtp_user
        msg["To"] = receiver
        return msg

    @staticmethod
    def __send_email_message(msg: MIMEText):
        with smtplib.SMTP(settings.smtp_server, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)

        print("Письмо отправлено успешно!")


SMTPServiceDep = Annotated[SMTPService, Depends(lambda: SMTPService())]

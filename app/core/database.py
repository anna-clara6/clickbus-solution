from collections.abc import Generator
from urllib.parse import unquote, urlsplit

import pymysql
from pymysql.connections import Connection
from pymysql.cursors import DictCursor

from app.core.config import get_settings


settings = get_settings()


def database_name() -> str:
    parsed = urlsplit(settings.database_url.replace("mysql+pymysql://", "mysql://", 1))
    if parsed.scheme != "mysql":
        raise ValueError("DATABASE_URL deve usar MySQL")
    name = unquote(parsed.path.lstrip("/"))
    if not name or not name.replace("_", "").isalnum():
        raise ValueError("DATABASE_URL deve incluir um nome de banco MySQL válido")
    return name


def connect_database(*, select_database: bool = True) -> Connection:
    parsed = urlsplit(settings.database_url.replace("mysql+pymysql://", "mysql://", 1))
    if parsed.scheme != "mysql":
        raise ValueError("DATABASE_URL deve usar MySQL")
    options: dict[str, object] = {
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 3306,
        "user": unquote(parsed.username or ""),
        "password": unquote(parsed.password or ""),
        "charset": "utf8mb4",
        "cursorclass": DictCursor,
        "autocommit": False,
    }
    if select_database:
        options["database"] = database_name()
    return pymysql.connect(**options)


class DatabaseSession:
    def __init__(self, connection: Connection) -> None:
        self.connection = connection

    def cursor(self) -> DictCursor:
        return self.connection.cursor()

    def commit(self) -> None:
        self.connection.commit()

    def rollback(self) -> None:
        self.connection.rollback()

    def close(self) -> None:
        self.connection.close()


def get_db() -> Generator[DatabaseSession, None, None]:
    session = DatabaseSession(connect_database())
    try:
        yield session
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

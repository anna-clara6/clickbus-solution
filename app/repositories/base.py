from dataclasses import fields
from typing import Generic, TypeVar

from app.core.database import DatabaseSession

ModelT = TypeVar("ModelT")


class Repository(Generic[ModelT]):
    def __init__(self, session: DatabaseSession, model: type[ModelT], table: str) -> None:
        self._session = session
        self._model = model
        self._table = table

    def get(self, entity_id: int) -> ModelT | None:
        with self._session.cursor() as cursor:
            cursor.execute(f"SELECT * FROM {self._table} WHERE id = %s", (entity_id,))
            row = cursor.fetchone()
        return self._model(**row) if row else None

    def list(self, *, offset: int = 0, limit: int = 100) -> list[ModelT]:
        with self._session.cursor() as cursor:
            cursor.execute(
                f"SELECT * FROM {self._table} ORDER BY id LIMIT %s OFFSET %s",
                (limit, offset),
            )
            rows = cursor.fetchall()
        return [self._model(**row) for row in rows]

    def add(self, entity: ModelT) -> ModelT:
        values = {
            field.name: getattr(entity, field.name)
            for field in fields(entity)
            if field.name != "id" and getattr(entity, field.name) is not None
        }
        columns = ", ".join(values)
        placeholders = ", ".join(["%s"] * len(values))
        with self._session.cursor() as cursor:
            cursor.execute(
                f"INSERT INTO {self._table} ({columns}) VALUES ({placeholders})",
                tuple(values.values()),
            )
            entity.id = cursor.lastrowid
        return entity

    def delete(self, entity: ModelT) -> None:
        with self._session.cursor() as cursor:
            cursor.execute(f"DELETE FROM {self._table} WHERE id = %s", (entity.id,))

    def update(self, entity: ModelT) -> ModelT:
        values = {
            field.name: getattr(entity, field.name)
            for field in fields(entity)
            if field.name not in {"id", "viacao", "passagem"}
        }
        assignments = ", ".join(f"{column} = %s" for column in values)
        with self._session.cursor() as cursor:
            cursor.execute(
                f"UPDATE {self._table} SET {assignments} WHERE id = %s",
                (*values.values(), entity.id),
            )
        return entity

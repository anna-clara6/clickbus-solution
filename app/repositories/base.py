from typing import Generic, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import Base

ModelT = TypeVar("ModelT", bound=Base)


class Repository(Generic[ModelT]):
    def __init__(self, session: Session, model: type[ModelT]) -> None:
        self._session = session
        self._model = model

    def get(self, entity_id: int) -> ModelT | None:
        return self._session.get(self._model, entity_id)

    def list(self, *, offset: int = 0, limit: int = 100) -> list[ModelT]:
        statement = select(self._model).offset(offset).limit(limit)
        return list(self._session.scalars(statement).all())

    def add(self, entity: ModelT) -> ModelT:
        self._session.add(entity)
        self._session.flush()
        return entity

    def delete(self, entity: ModelT) -> None:
        self._session.delete(entity)

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Reembolso
from app.repositories.base import Repository


class ReembolsoRepository(Repository[Reembolso]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Reembolso)

    def by_passagem(self, passagem_id: int) -> list[Reembolso]:
        statement = select(Reembolso).where(Reembolso.passagem_id == passagem_id)
        return list(self._session.scalars(statement).all())

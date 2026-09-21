from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Viacao
from app.repositories.base import Repository


class ViacaoRepository(Repository[Viacao]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Viacao)

    def by_cnpj(self, cnpj: str) -> Viacao | None:
        statement = select(Viacao).where(Viacao.cnpj == cnpj)
        return self._session.scalar(statement)

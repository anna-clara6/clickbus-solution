from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Passagem
from app.repositories.base import Repository


class PassagemRepository(Repository[Passagem]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Passagem)

    def by_usuario(self, usuario_id: str) -> list[Passagem]:
        statement = select(Passagem).where(Passagem.usuario_id == usuario_id)
        return list(self._session.scalars(statement).all())
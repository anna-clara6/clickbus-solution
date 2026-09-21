from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Conexao
from app.repositories.base import Repository


class ConexaoRepository(Repository[Conexao]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Conexao)

    def by_passagem(self, passagem_id: int) -> list[Conexao]:
        statement = select(Conexao).where(Conexao.passagem_id == passagem_id).order_by(Conexao.ordem)
        return list(self._session.scalars(statement).all())

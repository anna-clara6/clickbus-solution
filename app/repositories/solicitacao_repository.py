from sqlalchemy.orm import Session

from app.models import Solicitacao
from app.repositories.base import Repository


class SolicitacaoRepository(Repository[Solicitacao]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Solicitacao)

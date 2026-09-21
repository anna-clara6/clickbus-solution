from sqlalchemy.orm import Session

from app.models import Solicitacao, SolicitacaoPassagem, SolicitacaoReembolso
from app.models.schemas import SolicitacaoCreate
from app.repositories.solicitacao_repository import SolicitacaoRepository


class SolicitacaoService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._repository = SolicitacaoRepository(session)

    def create(self, data: SolicitacaoCreate) -> Solicitacao:
        if data.tipo == "passagem":
            entity = SolicitacaoPassagem(passagem_id=data.passagem_id)
        elif data.tipo == "reembolso":
            entity = SolicitacaoReembolso(reembolso_id=data.reembolso_id)
        else:
            raise ValueError("Tipo de solicitação inválido")
        if entity.passagem_id is None and entity.reembolso_id is None:
            raise ValueError("A solicitação precisa referenciar uma entidade")
        self._repository.add(entity)
        self._session.commit()
        self._session.refresh(entity)
        return entity

    def get(self, solicitacao_id: int) -> Solicitacao:
        entity = self._repository.get(solicitacao_id)
        if entity is None:
            raise LookupError("Solicitação não encontrada")
        return entity

    def list(self) -> list[Solicitacao]:
        return self._repository.list()

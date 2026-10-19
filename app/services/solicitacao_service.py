from app.core.database import DatabaseSession
from app.models import Solicitacao
from app.models.schemas import SolicitacaoCreate
from app.repositories.passagem_repository import PassagemRepository
from app.repositories.reembolso_repository import ReembolsoRepository
from app.repositories.solicitacao_repository import SolicitacaoRepository


class SolicitacaoService:
    def __init__(self, session: DatabaseSession) -> None:
        self._session = session
        self._repository = SolicitacaoRepository(session)
        self._passagem_repository = PassagemRepository(session)
        self._reembolso_repository = ReembolsoRepository(session)

    def create(self, data: SolicitacaoCreate) -> Solicitacao:
        if data.tipo == "passagem":
            if data.passagem_id is None:
                raise ValueError("A solicitação precisa referenciar uma passagem")
            if self._passagem_repository.get(data.passagem_id) is None:
                raise LookupError("Passagem não encontrada")
            referencia_id = data.passagem_id
        elif data.tipo == "reembolso":
            if data.reembolso_id is None:
                raise ValueError("A solicitação precisa referenciar um reembolso")
            if self._reembolso_repository.get(data.reembolso_id) is None:
                raise LookupError("Reembolso não encontrado")
            referencia_id = data.reembolso_id
        else:
            raise ValueError("Tipo de solicitação inválido")
        entity = self._repository.create(data.tipo, referencia_id)
        self._session.commit()
        return entity

    def get(self, solicitacao_id: int) -> Solicitacao:
        entity = self._repository.get(solicitacao_id)
        if entity is None:
            raise LookupError("Solicitação não encontrada")
        return entity

    def list(self) -> list[Solicitacao]:
        return self._repository.list()

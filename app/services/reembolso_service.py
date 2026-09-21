from sqlalchemy.orm import Session

from app.models import Reembolso, StatusPassagem, StatusReembolso
from app.models.schemas import ReembolsoCreate
from app.repositories.passagem_repository import PassagemRepository
from app.repositories.reembolso_repository import ReembolsoRepository


class ReembolsoService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._repository = ReembolsoRepository(session)
        self._passagem_repository = PassagemRepository(session)

    def create(self, data: ReembolsoCreate) -> Reembolso:
        passagem = self._passagem_repository.get(data.passagem_id)
        if passagem is None:
            raise LookupError("Passagem não encontrada")
        if passagem.status == StatusPassagem.CANCELADA:
            raise ValueError("Não é possível reembolsar uma passagem já cancelada")
        if data.valor > passagem.valor:
            raise ValueError("O reembolso não pode exceder o valor da passagem")
        entity = self._repository.add(Reembolso(**data.model_dump(), status=StatusReembolso.SOLICITADO))
        self._session.commit()
        self._session.refresh(entity)
        return entity

    def list_by_passagem(self, passagem_id: int) -> list[Reembolso]:
        return self._repository.by_passagem(passagem_id)

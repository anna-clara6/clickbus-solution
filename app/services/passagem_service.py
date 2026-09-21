from sqlalchemy.orm import Session

from app.models import Passagem, StatusPassagem
from app.models.schemas import PassagemCreate
from app.repositories.passagem_repository import PassagemRepository
from app.repositories.viacao_repository import ViacaoRepository


class PassagemService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._repository = PassagemRepository(session)
        self._viacao_repository = ViacaoRepository(session)

    def create(self, data: PassagemCreate) -> Passagem:
        if data.data_volta and data.data_volta < data.data_ida:
            raise ValueError("A data de volta não pode anteceder a data de ida")
        viacao = self._viacao_repository.get(data.viacao_id)
        if viacao is None or not viacao.ativo:
            raise ValueError("A viação informada não está disponível")
        entity = self._repository.add(Passagem(**data.model_dump(), status=StatusPassagem.RESERVADA))
        self._session.commit()
        self._session.refresh(entity)
        return entity

    def get(self, passagem_id: int) -> Passagem:
        entity = self._repository.get(passagem_id)
        if entity is None:
            raise LookupError("Passagem não encontrada")
        return entity

    def list_by_usuario(self, usuario_id: str) -> list[Passagem]:
        return self._repository.by_usuario(usuario_id)

    def cancel(self, passagem_id: int) -> Passagem:
        entity = self.get(passagem_id)
        if entity.status == StatusPassagem.CANCELADA:
            raise ValueError("A passagem já está cancelada")
        entity.status = StatusPassagem.CANCELADA
        self._session.commit()
        self._session.refresh(entity)
        return entity

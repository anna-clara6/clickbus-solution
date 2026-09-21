from sqlalchemy.orm import Session

from app.models import Viacao
from app.models.schemas import ViacaoCreate
from app.repositories.viacao_repository import ViacaoRepository


class ViacaoService:
    def __init__(self, session: Session) -> None:
        self._repository = ViacaoRepository(session)
        self._session = session

    def create(self, data: ViacaoCreate) -> Viacao:
        if self._repository.by_cnpj(data.cnpj):
            raise ValueError("Já existe uma viação com este CNPJ")
        entity = self._repository.add(Viacao(nome=data.nome, cnpj=data.cnpj))
        self._session.commit()
        self._session.refresh(entity)
        return entity

    def list(self) -> list[Viacao]:
        return self._repository.list()

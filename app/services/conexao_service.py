from sqlalchemy.orm import Session

from app.models import Conexao
from app.models.schemas import ConexaoCreate
from app.repositories.conexao_repository import ConexaoRepository
from app.repositories.passagem_repository import PassagemRepository


class ConexaoService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._repository = ConexaoRepository(session)
        self._passagem_repository = PassagemRepository(session)

    def create(self, data: ConexaoCreate) -> Conexao:
        if data.horario_chegada <= data.horario_saida:
            raise ValueError("O horário de chegada deve ser posterior à saída")
        if self._passagem_repository.get(data.passagem_id) is None:
            raise LookupError("Passagem não encontrada")
        entity = self._repository.add(Conexao(**data.model_dump()))
        self._session.commit()
        self._session.refresh(entity)
        return entity

    def list_by_passagem(self, passagem_id: int) -> list[Conexao]:
        return self._repository.by_passagem(passagem_id)

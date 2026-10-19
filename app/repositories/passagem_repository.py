from app.core.database import DatabaseSession
from app.models import Passagem
from app.repositories.base import Repository
from app.repositories.viacao_repository import ViacaoRepository


class PassagemRepository(Repository[Passagem]):
    def __init__(self, session: DatabaseSession) -> None:
        super().__init__(session, Passagem, "passagens")

    def by_usuario(self, usuario_id: str) -> list[Passagem]:
        with self._session.cursor() as cursor:
            cursor.execute("SELECT * FROM passagens WHERE usuario_id = %s", (usuario_id,))
            rows = cursor.fetchall()
        return [Passagem(**row) for row in rows]

    def get(self, entity_id: int) -> Passagem | None:
        passagem = super().get(entity_id)
        if passagem is not None:
            passagem.viacao = ViacaoRepository(self._session).get(passagem.viacao_id)
        return passagem
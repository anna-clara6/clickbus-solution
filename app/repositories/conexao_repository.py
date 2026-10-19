from app.core.database import DatabaseSession
from app.models import Conexao
from app.repositories.base import Repository


class ConexaoRepository(Repository[Conexao]):
    def __init__(self, session: DatabaseSession) -> None:
        super().__init__(session, Conexao, "conexoes")

    def by_passagem(self, passagem_id: int) -> list[Conexao]:
        with self._session.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM conexoes WHERE passagem_id = %s ORDER BY ordem",
                (passagem_id,),
            )
            rows = cursor.fetchall()
        return [Conexao(**row) for row in rows]

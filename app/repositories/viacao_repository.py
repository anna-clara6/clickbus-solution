from app.core.database import DatabaseSession
from app.models import Viacao
from app.repositories.base import Repository


class ViacaoRepository(Repository[Viacao]):
    def __init__(self, session: DatabaseSession) -> None:
        super().__init__(session, Viacao, "viacoes")

    def by_cnpj(self, cnpj: str) -> Viacao | None:
        with self._session.cursor() as cursor:
            cursor.execute("SELECT * FROM viacoes WHERE cnpj = %s", (cnpj,))
            row = cursor.fetchone()
        return Viacao(**row) if row else None

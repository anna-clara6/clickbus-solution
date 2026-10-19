from app.core.database import DatabaseSession
from app.models import Reembolso
from app.repositories.base import Repository


class ReembolsoRepository(Repository[Reembolso]):
    def __init__(self, session: DatabaseSession) -> None:
        super().__init__(session, Reembolso, "reembolsos")

    def by_passagem(self, passagem_id: int) -> list[Reembolso]:
        with self._session.cursor() as cursor:
            cursor.execute("SELECT * FROM reembolsos WHERE passagem_id = %s", (passagem_id,))
            rows = cursor.fetchall()
        return [Reembolso(**row) for row in rows]

    def get(self, entity_id: int) -> Reembolso | None:
        with self._session.cursor() as cursor:
            cursor.execute("SELECT * FROM reembolsos WHERE id = %s", (entity_id,))
            row = cursor.fetchone()
        return Reembolso(**row) if row else None

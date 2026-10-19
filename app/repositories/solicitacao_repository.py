from app.core.database import DatabaseSession
from app.models import Solicitacao
from app.repositories.base import Repository


class SolicitacaoRepository(Repository[Solicitacao]):
    def __init__(self, session: DatabaseSession) -> None:
        super().__init__(session, Solicitacao, "solicitacoes")

    def create(self, tipo: str, referencia_id: int) -> Solicitacao:
        with self._session.cursor() as cursor:
            cursor.execute("INSERT INTO solicitacoes (tipo) VALUES (%s)", (tipo,))
            solicitacao_id = cursor.lastrowid
            table, column = (
                ("solicitacoes_passagem", "passagem_id")
                if tipo == "passagem"
                else ("solicitacoes_reembolso", "reembolso_id")
            )
            cursor.execute(
                f"INSERT INTO {table} (id, {column}) VALUES (%s, %s)",
                (solicitacao_id, referencia_id),
            )
        return self.get(solicitacao_id)

    def get(self, entity_id: int) -> Solicitacao | None:
        with self._session.cursor() as cursor:
            cursor.execute(
                """SELECT s.*, sp.passagem_id, sr.reembolso_id
                   FROM solicitacoes AS s
                   LEFT JOIN solicitacoes_passagem AS sp ON sp.id = s.id
                   LEFT JOIN solicitacoes_reembolso AS sr ON sr.id = s.id
                   WHERE s.id = %s""",
                (entity_id,),
            )
            row = cursor.fetchone()
        return Solicitacao(**row) if row else None

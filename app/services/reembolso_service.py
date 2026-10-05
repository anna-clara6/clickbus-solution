from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.orm import Session

from app.models import Reembolso, StatusPassagem, StatusReembolso
from app.models.schemas import ReembolsoCreate, ReembolsoSimulacaoRequest
from app.repositories.passagem_repository import PassagemRepository
from app.repositories.reembolso_repository import ReembolsoRepository


class ReembolsoService:
    TAXA_SERVICO = Decimal("0.18")
    DIAS_REEMBOLSO_INTEGRAL = 3
    PERCENTUAL_REEMBOLSO_INTEGRAL = Decimal("1.0")
    PERCENTUAL_REEMBOLSO_PARCIAL = Decimal("0.7")
    CENTAVO = Decimal("0.01")

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

    def get(self, reembolso_id: int) -> Reembolso:
        entity = self._repository.get(reembolso_id)
        if entity is None:
            raise LookupError("Reembolso não encontrado")
        return entity

    @classmethod
    def simulate(cls, data: ReembolsoSimulacaoRequest) -> dict[str, object]:
        dias_restantes = (data.data_viagem - date.today()).days
        resultado: dict[str, object] = {
            "elegivel": dias_restantes >= 0,
            "dias_restantes": dias_restantes,
            "valor_passagem": data.valor_passagem,
        }
        if dias_restantes < 0:
            resultado["motivo"] = "A data da viagem já passou."
            return resultado

        valor_taxa = (data.valor_passagem * cls.TAXA_SERVICO).quantize(
            cls.CENTAVO, rounding=ROUND_HALF_UP
        )
        percentual = (
            cls.PERCENTUAL_REEMBOLSO_INTEGRAL
            if dias_restantes >= cls.DIAS_REEMBOLSO_INTEGRAL
            else cls.PERCENTUAL_REEMBOLSO_PARCIAL
        )
        valor_reembolso = ((data.valor_passagem - valor_taxa) * percentual).quantize(
            cls.CENTAVO, rounding=ROUND_HALF_UP
        )
        resultado.update(
            valor_taxa=valor_taxa,
            percentual_aplicado=percentual,
            valor_reembolso=valor_reembolso,
        )
        return resultado

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from enum import StrEnum


class StatusPassagem(StrEnum):
    RESERVADA = "reservada"
    CONFIRMADA = "confirmada"
    CANCELADA = "cancelada"


class StatusReembolso(StrEnum):
    SOLICITADO = "solicitado"
    APROVADO = "aprovado"
    REJEITADO = "rejeitado"
    PAGO = "pago"


class StatusSolicitacao(StrEnum):
    ABERTA = "aberta"
    PROCESSANDO = "processando"
    CONCLUIDA = "concluida"
    CANCELADA = "cancelada"


@dataclass
class Viacao:
    nome: str
    cnpj: str
    id: int | None = None
    ativo: bool = True


@dataclass
class Passagem:
    origem: str
    destino: str
    data_ida: datetime
    data_volta: datetime | None
    usuario_id: str
    valor: Decimal
    viacao_id: int
    id: int | None = None
    status: str = StatusPassagem.RESERVADA
    viacao: Viacao | None = None


@dataclass
class Conexao:
    passagem_id: int
    origem: str
    destino: str
    horario_saida: datetime
    horario_chegada: datetime
    ordem: int
    id: int | None = None


@dataclass
class Reembolso:
    passagem_id: int
    motivo: str
    valor: Decimal
    id: int | None = None
    status: str = StatusReembolso.SOLICITADO
    solicitado_em: datetime | None = None
    processado_em: datetime | None = None
    passagem: Passagem | None = None


@dataclass
class Solicitacao:
    tipo: str
    id: int | None = None
    status: str = StatusSolicitacao.ABERTA
    criada_em: datetime | None = None
    atualizada_em: datetime | None = None
    passagem_id: int | None = None
    reembolso_id: int | None = None


class SolicitacaoPassagem(Solicitacao):
    pass


class SolicitacaoReembolso(Solicitacao):
    pass

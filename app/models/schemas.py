from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ViacaoCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    cnpj: str = Field(min_length=11, max_length=18)


class ViacaoResponse(ViacaoCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ativo: bool


class PassagemCreate(BaseModel):
    origem: str = Field(min_length=2, max_length=120)
    destino: str = Field(min_length=2, max_length=120)
    data_ida: datetime
    data_volta: datetime | None = None
    usuario_id: str = Field(min_length=1, max_length=120)
    valor: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    viacao_id: int


class PassagemResponse(PassagemCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str


class ReembolsoCreate(BaseModel):
    passagem_id: int
    motivo: str = Field(min_length=3)
    valor: Decimal = Field(gt=0, max_digits=10, decimal_places=2)


class ReembolsoResponse(ReembolsoCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str


class ConexaoCreate(BaseModel):
    passagem_id: int
    origem: str = Field(min_length=2, max_length=120)
    destino: str = Field(min_length=2, max_length=120)
    horario_saida: datetime
    horario_chegada: datetime
    ordem: int = Field(ge=1)


class ConexaoResponse(ConexaoCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class SolicitacaoCreate(BaseModel):
    tipo: str = Field(pattern="^(passagem|reembolso)$")
    passagem_id: int | None = None
    reembolso_id: int | None = None


class SolicitacaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tipo: str
    status: str

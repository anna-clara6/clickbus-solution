from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


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


class Viacao(Base):
    __tablename__ = "viacoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    cnpj: Mapped[str] = mapped_column(String(18), unique=True, index=True, nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    passagens: Mapped[list["Passagem"]] = relationship(back_populates="viacao")


class Passagem(Base):
    __tablename__ = "passagens"

    id: Mapped[int] = mapped_column(primary_key=True)
    origem: Mapped[str] = mapped_column(String(120), nullable=False)
    destino: Mapped[str] = mapped_column(String(120), nullable=False)
    data_ida: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    data_volta: Mapped[datetime | None] = mapped_column(DateTime)
    usuario_id: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    valor: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[StatusPassagem] = mapped_column(String(20), default=StatusPassagem.RESERVADA, nullable=False)
    viacao_id: Mapped[int] = mapped_column(ForeignKey("viacoes.id"), nullable=False)
    viacao: Mapped[Viacao] = relationship(back_populates="passagens")
    conexoes: Mapped[list["Conexao"]] = relationship(back_populates="passagem", cascade="all, delete-orphan")
    reembolsos: Mapped[list["Reembolso"]] = relationship(back_populates="passagem", cascade="all, delete-orphan")


class Conexao(Base):
    __tablename__ = "conexoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    passagem_id: Mapped[int] = mapped_column(ForeignKey("passagens.id"), nullable=False, index=True)
    origem: Mapped[str] = mapped_column(String(120), nullable=False)
    destino: Mapped[str] = mapped_column(String(120), nullable=False)
    horario_saida: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    horario_chegada: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    ordem: Mapped[int] = mapped_column(Integer, nullable=False)
    passagem: Mapped[Passagem] = relationship(back_populates="conexoes")


class Reembolso(Base):
    __tablename__ = "reembolsos"

    id: Mapped[int] = mapped_column(primary_key=True)
    passagem_id: Mapped[int] = mapped_column(ForeignKey("passagens.id"), nullable=False, index=True)
    motivo: Mapped[str] = mapped_column(Text, nullable=False)
    valor: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[StatusReembolso] = mapped_column(String(20), default=StatusReembolso.SOLICITADO, nullable=False)
    solicitado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    processado_em: Mapped[datetime | None] = mapped_column(DateTime)
    passagem: Mapped[Passagem] = relationship(back_populates="reembolsos")


class Solicitacao(Base):
    __tablename__ = "solicitacoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    tipo: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[StatusSolicitacao] = mapped_column(String(20), default=StatusSolicitacao.ABERTA, nullable=False)
    criada_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    atualizada_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    __mapper_args__ = {"polymorphic_on": tipo, "polymorphic_identity": "base"}


class SolicitacaoPassagem(Solicitacao):
    __tablename__ = "solicitacoes_passagem"

    id: Mapped[int] = mapped_column(ForeignKey("solicitacoes.id"), primary_key=True)
    passagem_id: Mapped[int | None] = mapped_column(ForeignKey("passagens.id"))
    __mapper_args__ = {"polymorphic_identity": "passagem"}


class SolicitacaoReembolso(Solicitacao):
    __tablename__ = "solicitacoes_reembolso"

    id: Mapped[int] = mapped_column(ForeignKey("solicitacoes.id"), primary_key=True)
    reembolso_id: Mapped[int | None] = mapped_column(ForeignKey("reembolsos.id"))
    __mapper_args__ = {"polymorphic_identity": "reembolso"}

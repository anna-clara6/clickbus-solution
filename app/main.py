from collections.abc import Generator
import os
import re
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models import (
    ConexaoCreate,
    ConexaoDetalheResponse,
    ConexaoResponse,
    PassagemCreate,
    PassagemResponse,
    ReembolsoCreate,
    ReembolsoDetalheResponse,
    ReembolsoResponse,
    ReembolsoSimulacaoRequest,
    ReembolsoSimulacaoResponse,
    SolicitacaoCreate,
    SolicitacaoResponse,
    ViacaoCreate,
    ViacaoResponse,
)
from app.services import (
    ConexaoService,
    PassagemService,
    ReembolsoService,
    SolicitacaoService,
    ViacaoService,
)

settings = get_settings()
app = FastAPI(title=settings.app_name, version=settings.app_version)
forwarding_domain = os.getenv("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=(
        rf"https://.*\.{re.escape(forwarding_domain)}" if forwarding_domain else None
    ),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["system"])
def read_root() -> dict[str, str]:
    return {"message": "ClickBus API is running"}


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


def database_session() -> Generator[Session, None, None]:
    yield from get_db()


def service_error(error: ValueError | LookupError) -> HTTPException:
    error_status = status.HTTP_404_NOT_FOUND if isinstance(error, LookupError) else status.HTTP_400_BAD_REQUEST
    return HTTPException(status_code=error_status, detail=str(error))


@app.post("/viacoes", response_model=ViacaoResponse, status_code=status.HTTP_201_CREATED, tags=["viacoes"])
def create_viacao(data: ViacaoCreate, session: Session = Depends(database_session)) -> ViacaoResponse:
    try:
        return ViacaoService(session).create(data)
    except ValueError as error:
        raise service_error(error) from error


@app.get("/viacoes", response_model=list[ViacaoResponse], tags=["viacoes"])
def list_viacoes(session: Session = Depends(database_session)) -> list[ViacaoResponse]:
    return ViacaoService(session).list()


@app.post("/passagens", response_model=PassagemResponse, status_code=status.HTTP_201_CREATED, tags=["passagens"])
def create_passagem(data: PassagemCreate, session: Session = Depends(database_session)) -> PassagemResponse:
    try:
        return PassagemService(session).create(data)
    except (ValueError, LookupError) as error:
        raise service_error(error) from error


@app.post("/reembolsos", response_model=ReembolsoResponse, status_code=status.HTTP_201_CREATED, tags=["reembolsos"])
def create_reembolso(data: ReembolsoCreate, session: Session = Depends(database_session)) -> ReembolsoResponse:
    try:
        return ReembolsoService(session).create(data)
    except (ValueError, LookupError) as error:
        raise service_error(error) from error


@app.get("/reembolsos/{reembolso_id}", response_model=ReembolsoDetalheResponse, tags=["reembolsos"])
def get_reembolso(reembolso_id: int, session: Session = Depends(database_session)) -> ReembolsoDetalheResponse:
    try:
        return ReembolsoService(session).get(reembolso_id)
    except LookupError as error:
        raise service_error(error) from error


@app.post("/reembolsos/simular", response_model=ReembolsoSimulacaoResponse, tags=["reembolsos"])
def simulate_reembolso(data: ReembolsoSimulacaoRequest) -> ReembolsoSimulacaoResponse:
    return ReembolsoService.simulate(data)


@app.post("/conexoes", response_model=ConexaoResponse, status_code=status.HTTP_201_CREATED, tags=["conexoes"])
def create_conexao(data: ConexaoCreate, session: Session = Depends(database_session)) -> ConexaoResponse:
    try:
        return ConexaoService(session).create(data)
    except (ValueError, LookupError) as error:
        raise service_error(error) from error


@app.get(
    "/passagens/{passagem_id}/conexoes",
    response_model=list[ConexaoDetalheResponse],
    tags=["conexoes"],
)
def list_conexoes(passagem_id: int, session: Session = Depends(database_session)) -> list[ConexaoDetalheResponse]:
    try:
        passagem = PassagemService(session).get(passagem_id)
    except LookupError as error:
        raise service_error(error) from error
    conexoes = ConexaoService(session).list_by_passagem(passagem_id)
    return [
        ConexaoDetalheResponse.model_validate(
            {
                "id": conexao.id,
                "passagem_id": conexao.passagem_id,
                "origem": conexao.origem,
                "destino": conexao.destino,
                "horario_saida": conexao.horario_saida,
                "horario_chegada": conexao.horario_chegada,
                "ordem": conexao.ordem,
                "viacao_nome": passagem.viacao.nome,
            }
        )
        for conexao in conexoes
    ]


@app.post("/solicitacoes", response_model=SolicitacaoResponse, status_code=status.HTTP_201_CREATED, tags=["solicitacoes"])
def create_solicitacao(data: SolicitacaoCreate, session: Session = Depends(database_session)) -> SolicitacaoResponse:
    try:
        return SolicitacaoService(session).create(data)
    except (ValueError, LookupError) as error:
        raise service_error(error) from error


@app.get("/solicitacoes/{solicitacao_id}", response_model=SolicitacaoResponse, tags=["solicitacoes"])
def get_solicitacao(solicitacao_id: int, session: Session = Depends(database_session)) -> SolicitacaoResponse:
    try:
        return SolicitacaoService(session).get(solicitacao_id)
    except LookupError as error:
        raise service_error(error) from error


app.mount(
    "/ui",
    StaticFiles(directory=Path(__file__).resolve().parent.parent / "front", html=True),
    name="front",
)

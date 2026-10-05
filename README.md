# ClickBus

Aplicação de passagens rodoviárias com API FastAPI, SQLAlchemy e interface web
estática. O FastAPI serve a API e o front-end pelo mesmo host.

## Pré-requisitos

- Python 3.11 ou superior.
- MySQL disponível, ou use o modo SQLite para desenvolvimento local.

## Instalação

Na raiz do projeto:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

Configure `DATABASE_URL` no `.env` antes de inicializar o banco. O valor padrão
usa `mysql+pymysql` com o banco `clickbus`; confirme que o banco existe e que o
usuário configurado tem permissão para criar tabelas.

## Executar com MySQL

Com o MySQL iniciado e o `.env` configurado:

```bash
python -m app.core.init_db
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Executar sem MySQL (SQLite)

No Linux/macOS, use um banco temporário em `/tmp`:

```bash
export DATABASE_URL=sqlite:////tmp/clickbus-dev.db
python -m app.core.init_db
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Execute o comando de inicialização e o servidor no mesmo terminal para manter a
mesma configuração de banco.

## Abrir a aplicação

Com o servidor ativo, abra:

- Interface: `http://127.0.0.1:8000/ui/`
- Documentação interativa da API: `http://127.0.0.1:8000/docs`
- Verificação de saúde: `http://127.0.0.1:8000/health`

No Codespaces, encaminhe a porta `8000` e abra `/ui/` pela URL encaminhada. A
interface usa a mesma origem da API, sem depender do `localhost` do navegador.

As páginas também podem ser abertas diretamente:

- Status do reembolso: `/ui/?reembolso=<id>` ou informe o ID na página.
- Simulador: `/ui/simulador.html`.
- Conexões da passagem: `/ui/conexao.html?passagem=<id>` ou informe o ID na página.

Para consultar status ou conexões, crie os registros correspondentes pela API e
use os IDs retornados. Por exemplo, crie uma viação antes de criar uma passagem;
uma solicitação de reembolso sempre referencia uma passagem existente.

## Endpoints usados pelo front

- `GET /reembolsos/{id}`: consulta o reembolso e os dados da passagem.
- `POST /reembolsos/simular`: calcula a estimativa de reembolso.
- `GET /passagens/{id}/conexoes`: lista os trechos programados da passagem.
- `POST /viacoes`, `/passagens`, `/reembolsos` e `/conexoes`: cria os registros.

## Organização

- `app/models`: entidades SQLAlchemy e schemas de entrada/saída.
- `app/repositories`: consultas ao banco de dados.
- `app/services`: regras de negócio e transações.
- `app/core`: configurações, conexão e inicialização do banco.
- `front`: páginas, estilos e scripts do navegador.
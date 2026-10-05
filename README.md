# ClickBus API

Backend base em FastAPI, SQLAlchemy e MySQL para passagens rodoviárias.

## Executar localmente

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m app.core.init_db
uvicorn app.main:app --reload
```

Configure `DATABASE_URL` no `.env` antes de criar as tabelas. O padrão usa
`mysql+pymysql` e o schema `clickbus`.

Documentação interativa: `http://127.0.0.1:8000/docs`.

Em outro terminal, sirva o front com `python3 -m http.server 5500 --directory front`
e abra `http://127.0.0.1:5500`. O front consome a API em `http://localhost:8000`.
As telas de status e conexão recebem, respectivamente, o ID do reembolso e da
passagem pela URL (`?reembolso=1` e `?passagem=1`) ou pelos formulários.

## Organização

- `app/models`: entidades SQLAlchemy, schemas de entrada/saída e herança polimórfica de solicitações.
- `app/repositories`: acesso encapsulado à sessão e consultas específicas.
- `app/services`: regras de negócio, validações e transações.
- `app/core`: configurações e ciclo de vida do banco.

Rotas principais: `/viacoes`, `/passagens`, `/reembolsos`, `/conexoes` e `/solicitacoes`.
O front usa `GET /reembolsos/{id}`, `POST /reembolsos/simular` e
`GET /passagens/{id}/conexoes`, além das rotas de criação existentes.
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

## Organização

- `app/models`: entidades SQLAlchemy, schemas de entrada/saída e herança polimórfica de solicitações.
- `app/repositories`: acesso encapsulado à sessão e consultas específicas.
- `app/services`: regras de negócio, validações e transações.
- `app/core`: configurações e ciclo de vida do banco.

Rotas principais: `/viacoes`, `/passagens`, `/reembolsos`, `/conexoes` e `/solicitacoes`.
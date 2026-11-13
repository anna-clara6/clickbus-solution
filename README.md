# ClickBus

Aplicação de passagens rodoviárias com API FastAPI, SQL MySQL parametrizado e
interface web estática. O FastAPI serve a API e o front-end pelo mesmo host.

## Pré-requisitos

- Python 3.11 ou superior.
- Node.js 20.6 ou superior, para carregar `.env` e executar `npm start`.
- Docker em execução, para iniciar o MySQL local automaticamente.
- MySQL 8.0.16 ou superior disponível.
- Tesseract OCR instalado, incluindo os idiomas português (`por`) e inglês
  (`eng`), para sugerir o ID da passagem a partir da foto.

## Instalação

Na raiz do projeto:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

No Debian/Ubuntu, instale o mecanismo OCR antes de iniciar a aplicação:

```bash
sudo apt-get install tesseract-ocr tesseract-ocr-por
```

Configure `DATABASE_URL` no `.env` antes de inicializar o banco. O valor padrão
usa `mysql+pymysql` com o banco `clickbus`; o usuário configurado precisa ter
permissão para criar o banco e as tabelas. A inicialização cria as tabelas e
insere dados de demonstração (passagens e reembolsos com IDs de 1 a 5, além
das conexões correspondentes) sem apagar dados existentes.

## Iniciar a aplicação

`npm start` inicia um MySQL 8.4 local em Docker quando `DATABASE_URL` aponta
para `localhost` (ou `127.0.0.1`), aguarda o banco ficar pronto, cria as tabelas
e os dados iniciais e, em seguida, inicia a API e o frontend. O banco usa o
volume Docker `clickbus-mysql-data`, preservado entre reinicializações.

```bash
npm start
```

É necessário ter Docker em execução, Node.js, dependências Python instaladas e
`DATABASE_URL` configurada no `.env`. A URL padrão usa o usuário e senha locais
`clickbus`; defina `MYSQL_ROOT_PASSWORD` no ambiente para substituir a senha
local inicial do root do container. Se `DATABASE_URL` apontar para outro host,
o script usa esse banco externo sem iniciar um container MySQL.

Mantenha esse terminal aberto enquanto usa a aplicação. O `--reload` reinicia
o servidor automaticamente quando arquivos Python são alterados. Para parar,
use `Ctrl+C`.

Para preparar o ambiente pela primeira vez, siga os passos da seção
[Instalação](#instalação). O banco e suas tabelas são inicializados pelo próprio
`npm start`.

## Abrir a aplicação

Com o servidor ativo, abra:

- Interface: `http://127.0.0.1:8000/ui/`
- Documentação interativa da API: `http://127.0.0.1:8000/docs`
- Verificação de saúde: `http://127.0.0.1:8000/health`

No Codespaces, encaminhe a porta `8000` e abra `/ui/` pela URL encaminhada. A
interface usa a mesma origem da API, sem depender do `localhost` do navegador.

As páginas também podem ser abertas diretamente:

- Status do reembolso: `/ui/?reembolso=<id>` ou informe o ID na página.
- Administração de reembolsos: `/ui/admin/`.
- Simulador: `/ui/simulador.html`.
- Conexões da passagem: `/ui/conexao.html?passagem=<id>` ou informe o ID na página.

Na tela de administração é possível listar todos os reembolsos e alterar o
status para solicitado, aprovado, rejeitado ou pago. Os endpoints administrativos
`GET /admin/reembolsos` e `PATCH /admin/reembolsos/{id}` não têm autenticação;
use-os somente em uma demonstração ou ambiente local controlado.

Para consultar status ou conexões, crie os registros correspondentes pela API e
use os IDs retornados. Por exemplo, crie uma viação antes de criar uma passagem;
uma solicitação de reembolso sempre referencia uma passagem existente.

## Endpoints usados pelo front

- `GET /reembolsos/{id}`: consulta o reembolso e os dados da passagem.
- `POST /reembolsos/simular`: calcula a estimativa de reembolso.
- `GET /passagens/{id}/conexoes`: lista os trechos programados da passagem.
- `POST /passagens/identificar-foto`: tenta sugerir um ID a partir de uma foto
  JPEG, PNG ou WebP de até 5 MB. A imagem não é salva pela aplicação; o ID
  é sugerido quando a imagem contém uma única sequência distinta de exatamente
  cinco dígitos, e precisa ser conferido e consultado manualmente.
- `POST /verificacoes`: recebe selfie e documento em JPEG de até 5 MB cada,
  exige consentimento e valida o reembolso informado, se houver. As imagens são
  validadas durante a requisição e descartadas; o recibo retornado não representa
  uma análise de identidade nem é persistido.
- `POST /viacoes`, `/passagens`, `/reembolsos` e `/conexoes`: cria os registros.

## Organização

- `app/models`: entidades e schemas de entrada/saída.
- `app/repositories`: consultas ao banco de dados.
- `app/services`: regras de negócio e transações.
- `app/core`: configurações, conexão MySQL e inicialização do banco.
- `front`: páginas, estilos e scripts do navegador.
const { spawn } = require("node:child_process");
const { existsSync } = require("node:fs");
const { setTimeout: delay } = require("node:timers/promises");

if (existsSync(".env")) process.loadEnvFile(".env");

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "mysql+pymysql://clickbus:clickbus@localhost:3306/clickbus";
const MYSQL_CONTAINER = "clickbus-mysql";
const MYSQL_IMAGE = "mysql:8.4";
const MYSQL_ROOT_PASSWORD =
  process.env.MYSQL_ROOT_PASSWORD ?? "clickbus-root-dev-only";

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      ...options,
    });
    let stdout = "";
    if (Array.isArray(options.stdio) && options.stdio[1] === "pipe") {
      child.stdout.setEncoding("utf8");
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
      });
    }
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(
          new Error(
            `${command} terminou com ${signal ? `sinal ${signal}` : `código ${code}`}`
          )
        );
      }
    });
  });
}

function databaseSettings() {
  let url;
  try {
    url = new URL(DATABASE_URL.replace(/^mysql\+pymysql:/, "mysql:"));
  } catch {
    throw new Error("DATABASE_URL inválida. Configure uma URL mysql+pymysql://...");
  }
  if (url.protocol !== "mysql:") {
    throw new Error("DATABASE_URL deve usar o driver MySQL");
  }
  return {
    host: url.hostname || "localhost",
    port: Number(url.port || 3306),
    database: decodeURIComponent(url.pathname.slice(1)),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  };
}

function rootDatabaseUrl() {
  const url = new URL(DATABASE_URL.replace(/^mysql\+pymysql:/, "mysql:"));
  url.username = "root";
  url.password = MYSQL_ROOT_PASSWORD;
  return url.href.replace(/^mysql:/, "mysql+pymysql:");
}

async function ensureLocalMysql(database) {
  if (!["localhost", "127.0.0.1", "::1"].includes(database.host)) {
    console.log(`Usando MySQL externo em ${database.host}:${database.port}.`);
    return;
  }
  if (!database.database || !database.user || !database.password) {
    throw new Error(
      "Para iniciar o MySQL local, DATABASE_URL precisa informar banco, usuário e senha."
    );
  }

  await run("docker", ["info", "--format", "{{.ServerVersion}}"], {
    stdio: "ignore",
  }).catch(() => {
    throw new Error(
      "Docker não está disponível. Inicie o Docker ou configure DATABASE_URL para um MySQL externo."
    );
  });

  process.env.MYSQL_DATABASE = database.database;
  process.env.MYSQL_USER = database.user;
  process.env.MYSQL_PASSWORD = database.password;
  process.env.MYSQL_ROOT_PASSWORD = MYSQL_ROOT_PASSWORD;

  const found = await run(
    "docker",
    ["container", "inspect", MYSQL_CONTAINER],
    { stdio: ["ignore", "ignore", "ignore"] }
  ).then(
    () => true,
    () => false
  );

  if (found) {
    const running = await run(
      "docker",
      ["container", "inspect", "--format", "{{.State.Running}}", MYSQL_CONTAINER],
      { stdio: ["ignore", "pipe", "ignore"] }
    ).then((output) => output === "true", () => false);
    if (!running) await run("docker", ["start", MYSQL_CONTAINER]);
  } else {
    await run("docker", [
      "run",
      "--detach",
      "--name",
      MYSQL_CONTAINER,
      "--restart",
      "unless-stopped",
      "--publish",
      `${database.port}:3306`,
      "--volume",
      "clickbus-mysql-data:/var/lib/mysql",
      "--env",
      "MYSQL_DATABASE",
      "--env",
      "MYSQL_USER",
      "--env",
      "MYSQL_PASSWORD",
      "--env",
      "MYSQL_ROOT_PASSWORD",
      "--health-cmd",
      'mysqladmin ping --host=127.0.0.1 --user=root --password="$MYSQL_ROOT_PASSWORD" --silent',
      "--health-interval",
      "2s",
      "--health-timeout",
      "5s",
      "--health-retries",
      "60",
      MYSQL_IMAGE,
    ]);
  }

  console.log("Aguardando o MySQL ficar pronto...");
  for (let attempt = 0; attempt < 180; attempt += 1) {
    const health = await run(
      "docker",
      [
        "container",
        "inspect",
        "--format",
        "{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}",
        MYSQL_CONTAINER,
      ],
      { stdio: ["ignore", "pipe", "ignore"] }
    );
    if (health === "healthy") return;
    if (health === "unhealthy") break;
    await delay(1000);
  }

  await run("docker", ["logs", "--tail", "50", MYSQL_CONTAINER]).catch(() => {});
  throw new Error(
    "O MySQL não ficou pronto. Verifique os logs acima e a configuração DATABASE_URL."
  );
}

async function main() {
  const database = databaseSettings();
  await ensureLocalMysql(database);

  const localPython =
    process.platform === "win32"
      ? ".venv\\Scripts\\python.exe"
      : ".venv/bin/python";
  const python = process.env.PYTHON || (existsSync(localPython) ? localPython : "python");

  console.log("Criando/verificando tabelas e dados iniciais...");
  const initEnvironment = { ...process.env };
  if (["localhost", "127.0.0.1", "::1"].includes(database.host)) {
    initEnvironment.DATABASE_URL = rootDatabaseUrl();
  }
  await run(python, ["-m", "app.core.init_db"], { env: initEnvironment });

  const port = process.env.PORT || "8000";
  console.log(`Iniciando ClickBus em http://localhost:${port}/ui/`);
  await run(python, [
    "-m",
    "uvicorn",
    "app.main:app",
    "--reload",
    "--host",
    "0.0.0.0",
    "--port",
    port,
  ]);
}

main().catch((error) => {
  console.error(`Falha ao iniciar ClickBus: ${error.message}`);
  process.exitCode = 1;
});

const ETAPAS = [
  { chave: "solicitado", rotulo: "Solicitado" },
  { chave: "aprovado", rotulo: "Aprovado" },
  { chave: "pago", rotulo: "Pago" },
];

let ultimoStatus = null;

function renderStatus(dados) {
  document.getElementById("pedido-titulo").textContent = `Reembolso #${dados.id}`;
  document.getElementById("trecho").textContent =
    `${dados.passagem.origem} → ${dados.passagem.destino}`;
  document.getElementById("valor").textContent = formatarMoeda(Number(dados.valor));
  document.getElementById("status-atual").textContent = dados.status;
  renderTimeline(dados.status);

  if (ultimoStatus !== null && ultimoStatus !== dados.status) {
    notificarMudancaStatus(dados.status);
  }
  ultimoStatus = dados.status;
}

function renderTimeline(statusAtual) {
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";
  if (statusAtual === "rejeitado") {
    const item = document.createElement("li");
    item.className = "timeline__step is-current";
    const marcador = document.createElement("span");
    marcador.className = "timeline__marker";
    marcador.textContent = "!";
    const rotulo = document.createElement("span");
    rotulo.className = "timeline__label";
    rotulo.textContent = "Rejeitado";
    item.append(marcador, rotulo);
    timeline.appendChild(item);
    return;
  }
  const indiceAtual = ETAPAS.findIndex((etapa) => etapa.chave === statusAtual);

  ETAPAS.forEach((etapa, i) => {
    const item = document.createElement("li");
    item.className = "timeline__step";
    if (i < indiceAtual) item.classList.add("is-done");
    if (i === indiceAtual) item.classList.add("is-current");

    const marcador = document.createElement("span");
    marcador.className = "timeline__marker";
    marcador.textContent = i < indiceAtual ? "✓" : String(i + 1);

    const rotulo = document.createElement("span");
    rotulo.className = "timeline__label";
    rotulo.textContent = etapa.rotulo;

    item.append(marcador, rotulo);
    timeline.appendChild(item);
  });
}

async function carregarStatus(reembolsoId) {
  const erro = document.getElementById("erro");
  erro.hidden = true;
  try {
    const dados = await buscarStatusReembolso(reembolsoId);
    renderStatus(dados);
  } catch (error) {
    erro.textContent = error.message;
    erro.hidden = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.getElementById("form-status");
  const campoId = document.getElementById("reembolso-id");
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    carregarStatus(campoId.value);
  });

  const reembolsoId = new URLSearchParams(window.location.search).get("reembolso");
  if (reembolsoId) {
    campoId.value = reembolsoId;
    carregarStatus(reembolsoId);
  }
});
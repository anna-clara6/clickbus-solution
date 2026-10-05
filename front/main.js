const ETAPAS = [
  { chave: "solicitado", rotulo: "Solicitado" },
  { chave: "em_analise", rotulo: "Em análise" },
  { chave: "aprovado", rotulo: "Aprovado" },
  { chave: "devolvido", rotulo: "Dinheiro devolvido" },
];

let ultimoStatus = null;

function renderStatus(dados) {
  document.getElementById("pedido-titulo").textContent = `Pedido ${dados.pedidoId}`;
  document.getElementById("trecho").textContent = dados.passagem;
  document.getElementById("valor").textContent = formatarMoeda(dados.valorReembolso);
  document.getElementById("previsao").textContent = formatarData(dados.dataPrevista);
  renderTimeline(dados.status);

  if (ultimoStatus !== null && ultimoStatus !== dados.status) {
    notificarMudancaStatus(dados.status);
  }
  ultimoStatus = dados.status;
}

function renderTimeline(statusAtual) {
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";
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

document.addEventListener("DOMContentLoaded", async () => {
  // Depois isso vem da URL (ex: ?pedido=CB-58231) ou do login do usuário.
  const pedidoId = "CB-58231";
  const dados = await buscarStatusReembolso(pedidoId);
  renderStatus(dados);
});

// Botão só pra demonstração: como o mock não muda sozinho, isso simula
// o back avisando que o pedido passou pra próxima etapa — é o gatilho
// que, no sistema real, dispararia a notificação sozinho.
document.getElementById("botao-avancar")?.addEventListener("click", async () => {
  const indiceAtual = ETAPAS.findIndex((etapa) => etapa.chave === MOCK_REEMBOLSO.status);
  const proximoIndice = Math.min(indiceAtual + 1, ETAPAS.length - 1);
  MOCK_REEMBOLSO.status = ETAPAS[proximoIndice].chave;

  const dados = await buscarStatusReembolso(MOCK_REEMBOLSO.pedidoId);
  renderStatus(dados);
});
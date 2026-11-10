// Etapas mostradas na linha do tempo, na ordem em que acontecem.
const ETAPAS = [
  { chave: "solicitado", rotulo: "Solicitado" },
  { chave: "em_analise", rotulo: "Em análise" },
  { chave: "aprovado", rotulo: "Aprovado" },
  { chave: "devolvido", rotulo: "Dinheiro devolvido" },
];

// Tradução dos status do back-end para as etapas da tela.
// "solicitado" no back = pedido feito e aguardando análise, então a tela
// marca "Solicitado" como concluído e "Em análise" como etapa atual.
const STATUS_DO_BACK = {
  solicitado: "em_analise",
  em_analise: "em_analise",
  aprovado: "aprovado",
  pago: "devolvido",
  devolvido: "devolvido",
  rejeitado: "rejeitado",
};

const ROTULO_STATUS = {
  em_analise: "Em análise",
  aprovado: "Aprovado",
  devolvido: "Dinheiro devolvido",
  rejeitado: "Rejeitado",
};

// A tela confere o status de novo a cada 10 segundos e avisa quando muda.
const INTERVALO_ATUALIZACAO_MS = 10000;

let ultimoStatus = null;
let ultimoReembolsoId = null;
let temporizador = null;

function renderStatus(dados) {
  const status = STATUS_DO_BACK[dados.status] ?? dados.status;

  document.getElementById("pedido-titulo").textContent = `Reembolso #${dados.id}`;
  document.getElementById("trecho").textContent =
    `${dados.passagem.origem} → ${dados.passagem.destino}`;
  document.getElementById("valor").textContent = formatarMoeda(Number(dados.valor));
  document.getElementById("status-atual").textContent = ROTULO_STATUS[status] ?? dados.status;
  document.getElementById("link-verificacao").href =
    `verificacao.html?reembolso=${encodeURIComponent(dados.id)}`;
  renderTimeline(status);

  if (ultimoStatus !== null && ultimoStatus !== status) {
    notificarMudancaStatus(status);
  }
  ultimoStatus = status;
}

function criarEtapa(rotulo, marcador, classes) {
  const item = document.createElement("li");
  item.className = ["timeline__step", ...classes].join(" ");

  const marcadorEl = document.createElement("span");
  marcadorEl.className = "timeline__marker";
  marcadorEl.textContent = marcador;

  const rotuloEl = document.createElement("span");
  rotuloEl.className = "timeline__label";
  rotuloEl.textContent = rotulo;

  item.append(marcadorEl, rotuloEl);
  return item;
}

function renderTimeline(statusAtual) {
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";

  // Rejeitado: passou por "Solicitado" e "Em análise" e parou aí.
  if (statusAtual === "rejeitado") {
    timeline.append(
      criarEtapa("Solicitado", "✓", ["is-done"]),
      criarEtapa("Em análise", "✓", ["is-done"]),
      criarEtapa("Rejeitado", "!", ["is-current", "timeline__step--rejeitado"])
    );
    return;
  }

  let indiceAtual = ETAPAS.findIndex((etapa) => etapa.chave === statusAtual);
  // Dinheiro devolvido é o fim do caminho: marca todas as etapas como concluídas.
  if (indiceAtual === ETAPAS.length - 1) indiceAtual = ETAPAS.length;

  ETAPAS.forEach((etapa, i) => {
    const classes = [];
    if (i < indiceAtual) classes.push("is-done");
    if (i === indiceAtual) classes.push("is-current");
    timeline.appendChild(
      criarEtapa(etapa.rotulo, i < indiceAtual ? "✓" : String(i + 1), classes)
    );
  });
}

async function carregarStatus(reembolsoId) {
  const erro = document.getElementById("erro");
  erro.hidden = true;

  // Outro pedido: zera o histórico para não avisar "mudança" que não houve.
  if (reembolsoId !== ultimoReembolsoId) {
    ultimoStatus = null;
    ultimoReembolsoId = reembolsoId;
  }

  try {
    const dados = await buscarStatusReembolso(reembolsoId);
    renderStatus(dados);
  } catch (error) {
    erro.textContent = error.message;
    erro.hidden = false;
    return;
  }

  clearInterval(temporizador);
  temporizador = setInterval(async () => {
    try {
      renderStatus(await buscarStatusReembolso(reembolsoId));
      erro.hidden = true;
    } catch {
      // tenta de novo no próximo ciclo
    }
  }, INTERVALO_ATUALIZACAO_MS);
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

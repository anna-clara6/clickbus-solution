// Linha do tempo do status do reembolso.
// - Sem ?reembolso=ID na URL: usa os dados de demonstração (mock), como antes.
// - Com ?reembolso=1 (por exemplo): busca o pedido de verdade no back-end e
//   atualiza sozinho a cada 10 segundos, disparando as notificações.

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

const INTERVALO_ATUALIZACAO_MS = 10000;

let ultimoStatus = null;

function urlDaApi() {
  if (typeof API_BASE_URL !== "undefined") return API_BASE_URL;
  if (window.CLICKBUS_API_URL) return window.CLICKBUS_API_URL;
  const codespaces = window.location.hostname.match(/^(.*)-\d+(\.app\.github\.dev)$/);
  return codespaces
    ? `${window.location.protocol}//${codespaces[1]}-8000${codespaces[2]}`
    : "http://localhost:8000";
}

// Busca o reembolso no back-end e converte para o formato que a tela usa.
async function buscarReembolsoReal(id) {
  let resposta;
  try {
    resposta = await fetch(`${urlDaApi()}/reembolsos/${encodeURIComponent(id)}`);
  } catch {
    throw new Error("Não foi possível falar com o servidor. Confira se o back-end está rodando.");
  }
  if (!resposta.ok) {
    let mensagem = `Erro na API (${resposta.status})`;
    try {
      const erro = await resposta.json();
      mensagem = erro.detail || mensagem;
    } catch {
      // mantém a mensagem padrão
    }
    throw new Error(mensagem);
  }
  const dados = await resposta.json();
  return {
    pedidoId: `#${dados.id}`,
    passagem: `${dados.passagem.origem} → ${dados.passagem.destino}`,
    valorReembolso: Number(dados.valor),
    dataPrevista: null, // o back ainda não informa a previsão
    status: STATUS_DO_BACK[dados.status] ?? dados.status,
  };
}

function mostrarErro(mensagem) {
  let erro = document.getElementById("erro");
  if (!erro) {
    erro = document.createElement("p");
    erro.id = "erro";
    erro.className = "resultado__aviso";
    erro.setAttribute("role", "alert");
    document.querySelector(".card__header").after(erro);
  }
  erro.textContent = mensagem;
  erro.hidden = false;
}

function limparErro() {
  const erro = document.getElementById("erro");
  if (erro) erro.hidden = true;
}

function renderStatus(dados) {
  document.getElementById("pedido-titulo").textContent = `Pedido ${dados.pedidoId}`;
  document.getElementById("trecho").textContent = dados.passagem;
  document.getElementById("valor").textContent = formatarMoeda(dados.valorReembolso);
  document.getElementById("previsao").textContent = dados.dataPrevista
    ? formatarData(dados.dataPrevista)
    : "—";
  renderTimeline(dados.status);

  if (ultimoStatus !== null && ultimoStatus !== dados.status) {
    notificarMudancaStatus(dados.status);
  }
  ultimoStatus = dados.status;
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

  const ultimaEtapa = ETAPAS.length - 1;
  let indiceAtual = ETAPAS.findIndex((etapa) => etapa.chave === statusAtual);
  // Dinheiro devolvido é o fim do caminho: marca todas as etapas como concluídas.
  if (indiceAtual === ultimaEtapa) indiceAtual = ETAPAS.length;

  ETAPAS.forEach((etapa, i) => {
    const classes = [];
    if (i < indiceAtual) classes.push("is-done");
    if (i === indiceAtual) classes.push("is-current");
    timeline.appendChild(
      criarEtapa(etapa.rotulo, i < indiceAtual ? "✓" : String(i + 1), classes)
    );
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const reembolsoId = new URLSearchParams(window.location.search).get("reembolso");

  if (reembolsoId) {
    // Modo real: dados do back-end, atualizando sozinho.
    const botao = document.getElementById("botao-avancar");
    if (botao) botao.style.display = "none";

    try {
      renderStatus(await buscarReembolsoReal(reembolsoId));
    } catch (erro) {
      mostrarErro(erro.message);
      return;
    }
    setInterval(async () => {
      try {
        renderStatus(await buscarReembolsoReal(reembolsoId));
        limparErro();
      } catch {
        // tenta de novo no próximo ciclo
      }
    }, INTERVALO_ATUALIZACAO_MS);
    return;
  }

  // Modo demonstração (sem ?reembolso= na URL).
  const dados = await buscarStatusReembolso("CB-58231");
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

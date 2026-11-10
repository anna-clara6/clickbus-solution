document.addEventListener("DOMContentLoaded", async () => {
  const pedidoId = "CB-58231";
  const dados = await buscarConexao(pedidoId);
  const analise = analisarConexao(dados.trechos);

  renderTrechos(dados.trechos, analise);
  renderResponsavel(analise);
});

function renderTrechos(trechos, analise) {
  const lista = document.getElementById("trechos");
  lista.innerHTML = "";

  trechos.forEach((trecho) => {
    const item = document.createElement("li");
    item.className = "trecho-item";

    if (analise.conexaoPerdida && trecho === analise.trechoResponsavel) {
      item.classList.add("trecho-item--responsavel");
    }
    if (analise.conexaoPerdida && trecho === analise.trechoAfetado) {
      item.classList.add("trecho-item--afetado");
    }

    const empresa = document.createElement("p");
    empresa.className = "trecho-item__empresa";
    empresa.textContent = trecho.viacao;

    const rota = document.createElement("p");
    rota.className = "trecho-item__rota";
    rota.textContent = `${trecho.origem} → ${trecho.destino}`;

    const horarios = document.createElement("p");
    horarios.className = "trecho-item__horarios";
    const previsto = `Previsto: ${formatarDataHora(trecho.partida)} – ${formatarDataHora(trecho.chegadaPrevista)}`;
    horarios.textContent = trecho.chegadaReal
      ? `${previsto} · Chegou: ${formatarDataHora(trecho.chegadaReal)}`
      : previsto;

    item.append(empresa, rota, horarios);

    if (analise.conexaoPerdida && trecho === analise.trechoResponsavel) {
      const selo = document.createElement("span");
      selo.className = "selo-alerta";
      selo.textContent = `${analise.atrasoMinutos} min de atraso`;
      item.appendChild(selo);
    }

    lista.appendChild(item);
  });
}

function renderResponsavel(analise) {
  const painel = document.getElementById("responsavel");
  painel.innerHTML = "";
  painel.hidden = false;

  if (!analise.conexaoPerdida) {
    painel.className = "responsavel responsavel--ok";
    const texto = document.createElement("p");
    texto.textContent = "Sua conexão está dentro do previsto. Nenhuma ação necessária.";
    painel.appendChild(texto);
    return;
  }

  painel.className = "responsavel responsavel--alerta";

  const titulo = document.createElement("p");
  titulo.className = "responsavel__titulo";
  titulo.textContent = `Responsável: ${analise.trechoResponsavel.viacao}`;
  painel.appendChild(titulo);

  const descricao = document.createElement("p");
  descricao.className = "responsavel__descricao";
  descricao.textContent =
    `O atraso de ${analise.atrasoMinutos} min no trecho ${analise.trechoResponsavel.origem} → ` +
    `${analise.trechoResponsavel.destino} fez você perder a conexão para ${analise.trechoAfetado.destino}.`;
  painel.appendChild(descricao);

  const acoes = document.createElement("ul");
  acoes.className = "responsavel__acoes";
  ["Reembolso automático do trecho perdido", "Prioridade no próximo ônibus disponível"].forEach((acao) => {
    const item = document.createElement("li");
    item.textContent = acao;
    acoes.appendChild(item);
  });
  painel.appendChild(acoes);
}
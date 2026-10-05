async function carregarConexao(passagemId) {
  const erro = document.getElementById("erro");
  erro.hidden = true;
  try {
    const trechos = await buscarConexao(passagemId);
    const analise = analisarConexao(trechos);
    renderTrechos(trechos, analise);
    renderResponsavel(analise, trechos.length > 0);
  } catch (error) {
    erro.textContent = error.message;
    erro.hidden = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.getElementById("form-conexao");
  const campoId = document.getElementById("passagem-id");
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    carregarConexao(campoId.value);
  });

  const passagemId = new URLSearchParams(window.location.search).get("passagem");
  if (passagemId) {
    campoId.value = passagemId;
    carregarConexao(passagemId);
  }
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
    empresa.textContent = trecho.viacao_nome;

    const rota = document.createElement("p");
    rota.className = "trecho-item__rota";
    rota.textContent = `${trecho.origem} → ${trecho.destino}`;

    const horarios = document.createElement("p");
    horarios.className = "trecho-item__horarios";
    horarios.textContent =
      `${formatarDataHora(trecho.horario_saida)} – ${formatarDataHora(trecho.horario_chegada)}`;

    item.append(empresa, rota, horarios);

    if (analise.conexaoPerdida && trecho === analise.trechoResponsavel) {
      const selo = document.createElement("span");
      selo.className = "selo-alerta";
      selo.textContent = `${analise.atrasoMinutos} min de conflito`;
      item.appendChild(selo);
    }

    lista.appendChild(item);
  });
}

function renderResponsavel(analise, temTrechos) {
  const painel = document.getElementById("responsavel");
  painel.innerHTML = "";
  painel.hidden = false;

  if (!temTrechos) {
    painel.className = "responsavel responsavel--ok";
    const texto = document.createElement("p");
    texto.textContent = "Nenhum trecho foi cadastrado para esta passagem.";
    painel.appendChild(texto);
    return;
  }

  if (!analise.conexaoPerdida) {
    painel.className = "responsavel responsavel--ok";
    const texto = document.createElement("p");
    texto.textContent = "Os horários programados permitem a conexão.";
    painel.appendChild(texto);
    return;
  }

  painel.className = "responsavel responsavel--alerta";

  const titulo = document.createElement("p");
  titulo.className = "responsavel__titulo";
  titulo.textContent = `Atenção: ${analise.trechoResponsavel.viacao_nome}`;
  painel.appendChild(titulo);

  const descricao = document.createElement("p");
  descricao.className = "responsavel__descricao";
  descricao.textContent =
    `A chegada programada do trecho ${analise.trechoResponsavel.origem} → ` +
    `${analise.trechoResponsavel.destino} ultrapassa a partida seguinte em ` +
    `${analise.atrasoMinutos} min. A conexão segue para ${analise.trechoAfetado.destino}.`;
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
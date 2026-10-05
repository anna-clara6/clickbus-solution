const API_BASE_URL = window.CLICKBUS_API_URL || "http://localhost:8000";

async function requisitarApi(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_BASE_URL}${caminho}`, opcoes);
  if (!resposta.ok) {
    let mensagem = `Erro na API (${resposta.status})`;
    try {
      const erro = await resposta.json();
      mensagem = erro.detail || mensagem;
    } catch {
      // Mantém a mensagem HTTP quando a resposta não contém JSON.
    }
    throw new Error(mensagem);
  }
  return resposta.json();
}

function buscarStatusReembolso(reembolsoId) {
  return requisitarApi(`/reembolsos/${encodeURIComponent(reembolsoId)}`);
}

function simularReembolso(valorPassagem, dataViagem) {
  return requisitarApi("/reembolsos/simular", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ valor_passagem: valorPassagem, data_viagem: dataViagem }),
  });
}

function buscarConexao(passagemId) {
  return requisitarApi(`/passagens/${encodeURIComponent(passagemId)}/conexoes`);
}

// Hoje calculado aqui no front; no sistema real isso é a classe Conexão
// do back, comparando o horário de chegada de um trecho com o horário
// de partida do próximo.
function analisarConexao(trechos) {
  for (let i = 0; i < trechos.length - 1; i++) {
    const trechoAtual = trechos[i];
    const proximoTrecho = trechos[i + 1];
    const chegada = new Date(trechoAtual.horario_chegada);
    const partidaProximo = new Date(proximoTrecho.horario_saida);

    if (chegada > partidaProximo) {
      return {
        conexaoPerdida: true,
        trechoResponsavel: trechoAtual,
        trechoAfetado: proximoTrecho,
        atrasoMinutos: Math.round((chegada - partidaProximo) / 60000),
      };
    }
  }
  return { conexaoPerdida: false };
}
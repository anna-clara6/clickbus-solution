// Camada de "API". Por enquanto só devolve o mock com um atraso simulado.
// Quando o back passar os endpoints, troquem o CORPO desta função por um
// fetch() de verdade — quem chama buscarStatusReembolso() não precisa mudar.
function buscarStatusReembolso(pedidoId) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_REEMBOLSO), 500);
  });
}

// Versão futura, com a API real:
//
// async function buscarStatusReembolso(pedidoId) {
//   const resposta = await fetch(`/api/reembolsos/${pedidoId}`);
//   if (!resposta.ok) throw new Error("Erro ao buscar status do reembolso");
//   return resposta.json();
// }

// Calcula o valor do reembolso ANTES do cliente cancelar (tela do simulador).
// Hoje a conta é feita aqui no front com REGRAS_REEMBOLSO; quando o back
// tiver um endpoint pra isso, troquem o corpo por um fetch() — quem chama
// simularReembolso() continua igual.
function simularReembolso(valorPassagem, dataViagemISO) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const hoje = new Date();
      const dataViagem = new Date(`${dataViagemISO}T00:00:00`);
      const umDiaEmMs = 1000 * 60 * 60 * 24;
      const diasRestantes = Math.ceil((dataViagem - hoje) / umDiaEmMs);

      if (diasRestantes < 0) {
        resolve({ elegivel: false, motivo: "A data da viagem já passou." });
        return;
      }

      const valorTaxa = valorPassagem * REGRAS_REEMBOLSO.taxaServico;
      const valorBase = valorPassagem - valorTaxa;
      const percentualAplicado =
        diasRestantes >= REGRAS_REEMBOLSO.diasParaReembolsoIntegral
          ? REGRAS_REEMBOLSO.percentualReembolsoIntegral
          : REGRAS_REEMBOLSO.percentualReembolsoParcial;

      resolve({
        elegivel: true,
        diasRestantes,
        valorPassagem,
        valorTaxa,
        percentualAplicado,
        valorReembolso: valorBase * percentualAplicado,
      });
    }, 500);
  });
}

// Versão futura, com a API real:
//
// async function simularReembolso(valorPassagem, dataViagemISO) {
//   const resposta = await fetch("/api/reembolsos/simular", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ valorPassagem, dataViagem: dataViagemISO }),
//   });
//   if (!resposta.ok) throw new Error("Erro ao simular reembolso");
//   return resposta.json();
// }

function buscarConexao(pedidoId) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_CONEXAO), 500);
  });
}

// Hoje calculado aqui no front; no sistema real isso é a classe Conexão
// do back, comparando o horário de chegada de um trecho com o horário
// de partida do próximo.
function analisarConexao(trechos) {
  for (let i = 0; i < trechos.length - 1; i++) {
    const trechoAtual = trechos[i];
    const proximoTrecho = trechos[i + 1];
    const chegada = new Date(trechoAtual.chegadaReal ?? trechoAtual.chegadaPrevista);
    const partidaProximo = new Date(proximoTrecho.partida);

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
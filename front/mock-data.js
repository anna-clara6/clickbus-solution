// Dado falso simulando o que a API do back deve devolver.
// Quando o back mandar o formato real do JSON, ajustem os campos aqui
// (e no HTML/CSS, se os nomes mudarem) — o resto do código não muda.
const MOCK_REEMBOLSO = {
  pedidoId: "CB-58231",
  passagem: "Brasília → Franca",
  status: "em_analise", // um de: solicitado | em_analise | aprovado | devolvido
  valorReembolso: 156.4,
  dataPrevista: "2026-09-25",
};

// Regras usadas pelo simulador. São um exemplo pra prototipar a tela —
// confirmem com o time de back quais são as regras reais antes da entrega.
const REGRAS_REEMBOLSO = {
  taxaServico: 0.18, // 18% retido, não é devolvido em nenhum cenário
  diasParaReembolsoIntegral: 3, // cancelar com 3+ dias de antecedência
  percentualReembolsoIntegral: 1.0, // devolve 100% do valor (menos a taxa)
  percentualReembolsoParcial: 0.7, // com menos de 3 dias, devolve só 70%
};

// Pedido com dois trechos (uma conexão). O primeiro trecho atrasa e faz
// o passageiro perder o ônibus do segundo trecho — é esse cenário que a
// tela de "conexão perdida" mostra.
const MOCK_CONEXAO = {
  pedidoId: "CB-58231",
  trechos: [
    {
      viacao: "Viação Cometa",
      origem: "Brasília",
      destino: "Franca",
      partida: "2026-09-19T22:00:00",
      chegadaPrevista: "2026-09-20T06:30:00",
      chegadaReal: "2026-09-20T07:10:00",
    },
    {
      viacao: "Expresso Ouro",
      origem: "Franca",
      destino: "Ribeirão Preto",
      partida: "2026-09-20T06:45:00",
      chegadaPrevista: "2026-09-20T07:40:00",
      chegadaReal: null,
    },
  ],
};
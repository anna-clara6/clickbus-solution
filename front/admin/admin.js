const STATUS_REEMBOLSO = [
  { valor: "solicitado", rotulo: "Solicitado" },
  { valor: "aprovado", rotulo: "Aprovado" },
  { valor: "rejeitado", rotulo: "Rejeitado" },
  { valor: "pago", rotulo: "Pago" },
];

const elemento = (id) => document.getElementById(id);

function criarCelula(texto) {
  const celula = document.createElement("td");
  celula.textContent = texto;
  return celula;
}

function criarLinha(reembolso) {
  const linha = document.createElement("tr");
  linha.append(
    criarCelula(`#${reembolso.id}`),
    criarCelula(`#${reembolso.passagem_id}`),
    criarCelula(reembolso.motivo),
    criarCelula(formatarMoeda(Number(reembolso.valor))),
    criarCelula(formatarDataHora(reembolso.solicitado_em))
  );

  const celulaStatus = document.createElement("td");
  const seletor = document.createElement("select");
  seletor.setAttribute("aria-label", `Status do reembolso ${reembolso.id}`);
  STATUS_REEMBOLSO.forEach(({ valor, rotulo }) => {
    const opcao = document.createElement("option");
    opcao.value = valor;
    opcao.textContent = rotulo;
    seletor.appendChild(opcao);
  });
  seletor.value = reembolso.status;
  celulaStatus.appendChild(seletor);

  const celulaAcao = document.createElement("td");
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "btn-primary admin-save";
  botao.textContent = "Salvar";
  botao.disabled = seletor.value === reembolso.status;
  seletor.addEventListener("change", () => {
    botao.disabled = seletor.value === reembolso.status;
  });
  botao.addEventListener("click", async () => {
    botao.disabled = true;
    try {
      await atualizarStatusReembolsoAdmin(reembolso.id, seletor.value);
      elemento("erro").hidden = true;
      elemento("mensagem").textContent = `Reembolso #${reembolso.id} atualizado.`;
      await carregarReembolsos();
    } catch (error) {
      elemento("erro").textContent = error.message;
      elemento("erro").hidden = false;
      botao.disabled = seletor.value === reembolso.status;
    }
  });
  celulaAcao.appendChild(botao);
  linha.append(celulaStatus, celulaAcao);
  return linha;
}

async function carregarReembolsos() {
  const mensagem = elemento("mensagem");
  const erro = elemento("erro");
  const tabela = elemento("reembolsos");
  mensagem.textContent = "Carregando reembolsos…";
  erro.hidden = true;
  try {
    const reembolsos = await listarReembolsosAdmin();
    tabela.replaceChildren(...reembolsos.map(criarLinha));
    mensagem.textContent = reembolsos.length
      ? `${reembolsos.length} reembolso(s) encontrado(s).`
      : "Nenhum reembolso encontrado.";
  } catch (error) {
    mensagem.textContent = "";
    erro.textContent = error.message;
    erro.hidden = false;
  }
}

document.addEventListener("DOMContentLoaded", carregarReembolsos);

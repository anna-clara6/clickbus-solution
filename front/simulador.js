document.getElementById("form-simulador").addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const valorPassagem = Number(document.getElementById("valor-passagem").value);
  const dataViagem = document.getElementById("data-viagem").value;
  const botao = evento.target.querySelector("button[type=submit]");

  botao.disabled = true;
  botao.textContent = "Calculando…";

  const resultado = await simularReembolso(valorPassagem, dataViagem);
  renderResultado(resultado);

  botao.disabled = false;
  botao.textContent = "Calcular reembolso";
});

function renderResultado(dados) {
  const painel = document.getElementById("resultado");
  painel.innerHTML = "";
  painel.hidden = false;

  if (!dados.elegivel) {
    const aviso = document.createElement("p");
    aviso.className = "resultado__aviso";
    aviso.textContent = dados.motivo;
    painel.appendChild(aviso);
    return;
  }

  const valorGrande = document.createElement("p");
  valorGrande.className = "resultado__valor";
  valorGrande.textContent = formatarMoeda(dados.valorReembolso);
  painel.appendChild(valorGrande);

  const linhas = [
    ["Valor da passagem", formatarMoeda(dados.valorPassagem)],
    ["Taxa de serviço retida", formatarMoeda(dados.valorTaxa)],
    ["Dias até a viagem", `${dados.diasRestantes} dia(s)`],
    ["Percentual devolvido", `${Math.round(dados.percentualAplicado * 100)}%`],
  ];

  linhas.forEach(([rotulo, valor]) => {
    const linha = document.createElement("p");
    linha.className = "resultado__linha";

    const spanRotulo = document.createElement("span");
    spanRotulo.textContent = rotulo;

    const spanValor = document.createElement("strong");
    spanValor.textContent = valor;

    linha.append(spanRotulo, spanValor);
    painel.appendChild(linha);
  });
}
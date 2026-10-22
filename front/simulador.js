const campoValorPassagem = document.getElementById("valor-passagem");

function validarValorPassagem(digitos) {
  campoValorPassagem.setCustomValidity(
    digitos.length > 10
      ? "O valor máximo é R$ 99.999.999,99."
      : Number(digitos.padStart(3, "0")) === 0
        ? "Informe um valor maior que R$ 0,00."
        : "",
  );
}

campoValorPassagem.addEventListener("focus", () => {
  campoValorPassagem.select();
});

campoValorPassagem.addEventListener("input", () => {
  const digitos = campoValorPassagem.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  const centavos = digitos.padStart(3, "0");
  const reais = centavos.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  campoValorPassagem.value = `${reais},${centavos.slice(-2)}`;
  validarValorPassagem(digitos);
  campoValorPassagem.setSelectionRange(campoValorPassagem.value.length, campoValorPassagem.value.length);
});

validarValorPassagem(campoValorPassagem.value.replace(/\D/g, ""));

document.getElementById("form-simulador").addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const valorPassagem = Number(
    campoValorPassagem.value.replace(/\./g, "").replace(",", "."),
  );
  const dataViagem = document.getElementById("data-viagem").value;
  const botao = evento.target.querySelector("button[type=submit]");

  botao.disabled = true;
  botao.textContent = "Calculando...";
  try {
    const resultado = await simularReembolso(valorPassagem, dataViagem);
    renderResultado(resultado);
  } catch (erro) {
    renderResultado({ elegivel: false, motivo: erro.message });
  } finally {
    botao.disabled = false;
    botao.textContent = "Calcular reembolso";
  }
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
  valorGrande.textContent = formatarMoeda(Number(dados.valor_reembolso));
  painel.appendChild(valorGrande);

  const linhas = [
    ["Valor da passagem", formatarMoeda(Number(dados.valor_passagem))],
    ["Taxa de serviço retida", formatarMoeda(Number(dados.valor_taxa))],
    ["Dias até a viagem", `${dados.dias_restantes} dia(s)`],
    ["Percentual devolvido", `${Math.round(Number(dados.percentual_aplicado) * 100)}%`],
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
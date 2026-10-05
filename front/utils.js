function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(dataISO) {
  const data = new Date(`${dataISO}T00:00:00`);
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

function formatarDataHora(dataISO) {
  const data = new Date(dataISO);
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
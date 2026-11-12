// Verificação de identidade antes do reembolso: selfie + foto do documento.
//
// IMPORTANTE (para explicar na apresentação): o front só captura e envia as fotos.
// Comparar o rosto com o documento precisa ser feito no back-end ou por um serviço
// próprio de verificação. Aqui a tela deixa o fluxo pronto para essa integração.
//
// Contrato do back:
//   POST /verificacoes  (multipart/form-data)
//     selfie, documento  -> arquivos JPEG
//     consentimento      -> "true"
//     reembolso_id       -> opcional
//   201 -> { "id": "<recibo>", "status": "recebido" }
// Se a rota ainda não existir (404/405), a tela roda em modo demonstração.

const PASSOS = [
  {
    chave: "selfie",
    titulo: "Tire uma selfie",
    dica: "Rosto inteiro, de frente, com boa luz e sem óculos escuros ou boné.",
    camera: "user",
    espelhar: true,
  },
  {
    chave: "documento",
    titulo: "Foto do documento",
    dica: "RG ou CNH aberto, sobre uma superfície plana, com os quatro cantos visíveis e sem reflexo.",
    camera: "environment",
    espelhar: false,
  },
];

const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB, igual à foto do bilhete
const LADO_MAXIMO = 1280; // reduz a foto antes de enviar
const QUALIDADE_JPEG = 0.85;

const estado = {
  passo: 0, // 0 = selfie, 1 = documento, 2 = revisar e enviar
  fotos: { selfie: null, documento: null }, // { blob, url }
  stream: null,
  reembolsoId: null,
};

const el = (id) => document.getElementById(id);

/* ---------- Mensagens ---------- */

function mostrarErro(texto) {
  const erro = el("erro");
  erro.textContent = texto;
  erro.hidden = false;
}

function mostrarStatus(texto) {
  const status = el("status");
  status.textContent = texto;
  status.hidden = !texto;
}

function limparMensagens() {
  el("erro").hidden = true;
  mostrarStatus("");
}

function mensagemErroCamera(erro) {
  switch (erro && erro.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "A permissão da câmera foi negada. Libere o acesso no cadeado do navegador ou use \"Enviar arquivo\".";
    case "NotFoundError":
    case "OverconstrainedError":
      return "Nenhuma câmera foi encontrada neste aparelho. Use \"Enviar arquivo\".";
    case "NotReadableError":
      return "A câmera está sendo usada por outro programa. Feche-o e tente de novo.";
    default:
      return "Não foi possível abrir a câmera. Use \"Enviar arquivo\".";
  }
}

/* ---------- Câmera ---------- */

function desligarCamera() {
  if (estado.stream) {
    estado.stream.getTracks().forEach((faixa) => faixa.stop());
    estado.stream = null;
  }
  const video = el("video");
  video.srcObject = null;
}

async function ligarCamera() {
  limparMensagens();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    mostrarErro(
      "Este navegador ou endereço não permite usar a câmera (é preciso abrir por https ou localhost). Use \"Enviar arquivo\"."
    );
    return;
  }
  const passo = PASSOS[estado.passo];
  try {
    desligarCamera();
    estado.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: passo.camera },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
    el("video").srcObject = estado.stream;
    renderCaptura();
  } catch (erro) {
    mostrarErro(mensagemErroCamera(erro));
    renderCaptura();
  }
}

/* ---------- Fotos ---------- */

function canvasParaBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Não foi possível gerar a foto."))),
      "image/jpeg",
      QUALIDADE_JPEG
    );
  });
}

// Desenha a imagem num canvas reduzido (lado máximo) e devolve um JPEG.
async function reduzirImagem(origem, largura, altura) {
  const escala = Math.min(1, LADO_MAXIMO / Math.max(largura, altura));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(largura * escala);
  canvas.height = Math.round(altura * escala);
  canvas.getContext("2d").drawImage(origem, 0, 0, canvas.width, canvas.height);
  return canvasParaBlob(canvas);
}

function definirFoto(chave, blob) {
  const antiga = estado.fotos[chave];
  if (antiga) URL.revokeObjectURL(antiga.url);
  estado.fotos[chave] = { blob, url: URL.createObjectURL(blob) };
  desligarCamera();
  renderCaptura();
}

function removerFoto(chave) {
  const foto = estado.fotos[chave];
  if (foto) URL.revokeObjectURL(foto.url);
  estado.fotos[chave] = null;
}

async function tirarFoto() {
  limparMensagens();
  const video = el("video");
  if (!video.videoWidth || !video.videoHeight) {
    mostrarErro("A câmera ainda está iniciando. Espere um instante e tente de novo.");
    return;
  }
  try {
    const blob = await reduzirImagem(video, video.videoWidth, video.videoHeight);
    definirFoto(PASSOS[estado.passo].chave, blob);
  } catch (erro) {
    mostrarErro(erro.message);
  }
}

async function receberArquivo(arquivo) {
  limparMensagens();
  if (!arquivo) return;
  if (!TIPOS_ACEITOS.includes(arquivo.type)) {
    mostrarErro("Use uma imagem JPEG, PNG ou WebP.");
    return;
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    mostrarErro("A imagem passa de 5 MB. Escolha uma menor.");
    return;
  }
  try {
    const imagem = await createImageBitmap(arquivo);
    const blob = await reduzirImagem(imagem, imagem.width, imagem.height);
    imagem.close();
    definirFoto(PASSOS[estado.passo].chave, blob);
  } catch {
    mostrarErro("Não foi possível ler essa imagem. Tente outro arquivo.");
  }
}

/* ---------- Tela ---------- */

function renderPassos() {
  document.querySelectorAll("#passos .timeline__step").forEach((item) => {
    const indice = Number(item.dataset.passo);
    item.classList.toggle("is-done", indice < estado.passo);
    item.classList.toggle("is-current", indice === estado.passo);
    item.querySelector(".timeline__marker").textContent =
      indice < estado.passo ? "✓" : String(indice + 1);
  });
}

function renderCaptura() {
  const passo = PASSOS[estado.passo];
  if (!passo) return;
  const foto = estado.fotos[passo.chave];
  const cameraLigada = Boolean(estado.stream);

  el("captura-titulo").textContent = passo.titulo;
  el("captura-dica").textContent = passo.dica;

  const video = el("video");
  video.classList.toggle("is-espelhado", passo.espelhar);
  video.hidden = !cameraLigada || Boolean(foto);

  const previa = el("previa");
  previa.hidden = !foto;
  if (foto) previa.src = foto.url;
  previa.alt = foto ? `${passo.titulo} (foto tirada)` : "";

  el("palco-vazio").hidden = Boolean(foto) || cameraLigada;

  el("btn-camera").hidden = Boolean(foto) || cameraLigada;
  el("btn-foto").hidden = !cameraLigada || Boolean(foto);
  el("btn-refazer").hidden = !foto;
  el("btn-arquivo").hidden = Boolean(foto);

  el("btn-continuar").disabled = !foto;
  el("btn-continuar").textContent =
    estado.passo === PASSOS.length - 1 ? "Revisar" : "Continuar";
}

function renderRevisao() {
  el("revisao-selfie").src = estado.fotos.selfie.url;
  el("revisao-documento").src = estado.fotos.documento.url;
}

function irParaPasso(indice) {
  limparMensagens();
  desligarCamera();
  estado.passo = indice;
  renderPassos();

  const revisando = indice >= PASSOS.length;
  el("area-captura").hidden = revisando;
  el("form-revisao").hidden = !revisando;
  if (revisando) {
    renderRevisao();
  } else {
    renderCaptura();
  }
}

/* ---------- Envio ---------- */

async function enviarVerificacao({ selfie, documento, reembolsoId }) {
  const corpo = new FormData();
  corpo.append("selfie", selfie, "selfie.jpg");
  corpo.append("documento", documento, "documento.jpg");
  corpo.append("consentimento", "true");
  if (reembolsoId) corpo.append("reembolso_id", reembolsoId);

  let resposta;
  try {
    resposta = await fetch(`${API_BASE_URL}/verificacoes`, { method: "POST", body: corpo });
  } catch {
    throw new Error("Não foi possível falar com o servidor. Confira se o back-end está rodando.");
  }

  // Rota ainda não criada no back: segue em modo demonstração.
  if (resposta.status === 404 || resposta.status === 405) return { demo: true };

  if (!resposta.ok) {
    let mensagem = `Erro na API (${resposta.status})`;
    try {
      const detalhe = await resposta.json();
      if (typeof detalhe.detail === "string") mensagem = detalhe.detail;
    } catch {
      // mantém a mensagem HTTP
    }
    throw new Error(mensagem);
  }
  return { demo: false, ...(await resposta.json()) };
}

function mostrarSucesso(resultado) {
  el("area-captura").hidden = true;
  el("form-revisao").hidden = true;
  mostrarStatus("");

  // Marca as três etapas como concluídas.
  document.querySelectorAll("#passos .timeline__step").forEach((item) => {
    item.classList.remove("is-current");
    item.classList.add("is-done");
    item.querySelector(".timeline__marker").textContent = "✓";
  });

  el("sucesso-texto").textContent = resultado.demo
    ? "Seguimos com o pedido para a próxima etapa."
    : `Recebemos as imagens (recibo ${resultado.id}). Este protótipo ainda não realiza a análise de identidade.`;
  el("aviso-demo").textContent = resultado.demo
    ? "Modo demonstração: o back-end ainda não recebe nem guarda as imagens. Nenhuma foto foi enviada."
    : "As imagens foram validadas durante o envio e descartadas; este protótipo não armazena as fotos.";
  el("aviso-demo").hidden = false;
  if (estado.reembolsoId) {
    el("link-status").href = `index.html?reembolso=${encodeURIComponent(estado.reembolsoId)}`;
  }
  el("sucesso").hidden = false;

  // Não mantém as imagens na memória depois do envio.
  removerFoto("selfie");
  removerFoto("documento");
}

async function aoEnviar(evento) {
  evento.preventDefault();
  limparMensagens();
  if (!el("consentimento").checked) {
    mostrarErro("Marque a autorização para continuar.");
    return;
  }
  const botao = el("btn-enviar");
  botao.disabled = true;
  mostrarStatus("Enviando…");
  try {
    const resultado = await enviarVerificacao({
      selfie: estado.fotos.selfie.blob,
      documento: estado.fotos.documento.blob,
      reembolsoId: estado.reembolsoId,
    });
    mostrarSucesso(resultado);
  } catch (erro) {
    mostrarStatus("");
    mostrarErro(erro.message);
    botao.disabled = false;
  }
}

/* ---------- Início ---------- */

document.addEventListener("DOMContentLoaded", () => {
  const parametro = new URLSearchParams(window.location.search).get("reembolso");
  if (parametro && /^\d+$/.test(parametro)) {
    estado.reembolsoId = parametro;
    el("pedido-ref").textContent =
      `Reembolso #${parametro}: antes de liberar o valor, precisamos de uma selfie e de uma foto do seu documento.`;
  }

  el("btn-camera").addEventListener("click", ligarCamera);
  el("btn-foto").addEventListener("click", tirarFoto);
  el("btn-refazer").addEventListener("click", () => {
    removerFoto(PASSOS[estado.passo].chave);
    renderCaptura();
    ligarCamera();
  });

  const campoArquivo = el("arquivo");
  el("btn-arquivo").addEventListener("click", () => {
    campoArquivo.setAttribute("capture", PASSOS[estado.passo].camera);
    campoArquivo.click();
  });
  campoArquivo.addEventListener("change", async () => {
    await receberArquivo(campoArquivo.files[0]);
    campoArquivo.value = "";
  });

  el("btn-continuar").addEventListener("click", () => irParaPasso(estado.passo + 1));
  document.querySelectorAll("[data-refazer]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const indice = Number(botao.dataset.refazer);
      removerFoto(PASSOS[indice].chave);
      irParaPasso(indice);
    });
  });
  el("form-revisao").addEventListener("submit", aoEnviar);

  // Desliga a câmera ao sair da página.
  window.addEventListener("pagehide", desligarCamera);

  irParaPasso(0);
});

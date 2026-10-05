// Notificações automáticas a cada mudança de status.
//
// "E-mail" a gente não consegue mandar de verdade só com JS no navegador
// (precisa de servidor com SMTP), então aqui simulamos com um registro
// na tela — igual fizemos com o mock da API.
//
// "Push" a gente CONSEGUE mandar de verdade: a Notification API do
// navegador mostra uma notificação real do sistema operacional, sem
// precisar de back-end nenhum.

const ROTULOS_NOTIFICACAO = {
  solicitado: "Recebemos sua solicitação de cancelamento",
  aprovado: "Seu reembolso foi aprovado",
  rejeitado: "Sua solicitação de reembolso foi rejeitada",
  pago: "O valor do reembolso foi pago",
};

function notificarMudancaStatus(statusNovo) {
  const mensagem = ROTULOS_NOTIFICACAO[statusNovo] ?? `Status atualizado: ${statusNovo}`;

  registrarNotificacaoNaTela(mensagem);
  mostrarToast(mensagem);
  mostrarNotificacaoPush(mensagem);
}

// Simula o "e-mail": guarda um histórico visível na própria tela.
function registrarNotificacaoNaTela(mensagem) {
  const lista = document.getElementById("notificacoes");
  if (!lista) return;

  const vazio = lista.querySelector(".notificacoes__vazio");
  if (vazio) vazio.remove();

  const item = document.createElement("li");

  const hora = document.createElement("span");
  hora.className = "notificacoes__hora";
  hora.textContent = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const texto = document.createElement("span");
  texto.textContent = mensagem;

  item.append(hora, texto);
  lista.prepend(item);
}

// Um aviso rápido que aparece e some sozinho.
function mostrarToast(mensagem) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = mensagem;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("toast--visivel"));

  setTimeout(() => {
    toast.classList.remove("toast--visivel");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Notificação de verdade do sistema operacional (push), via API nativa
// do navegador. Pede permissão na primeira vez.
function mostrarNotificacaoPush(mensagem) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification("ClickBus", { body: mensagem });
    return;
  }

  if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permissao) => {
      if (permissao === "granted") {
        new Notification("ClickBus", { body: mensagem });
      }
    });
  }
}
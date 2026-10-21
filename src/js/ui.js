const $ = (seletor, raiz = document) => raiz.querySelector(seletor);

const esc = (texto) =>
  String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function lerJSON(chave, padrao) {
  try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; } catch (e) { return padrao; }
}
const salvarJSON = (chave, valor) => localStorage.setItem(chave, JSON.stringify(valor));

const formatarPreco = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const parcela = (v) => `10x de ${formatarPreco(v / 10)} sem juros`;

// Toast
function toast(mensagem, tipo = "ok") {
  let caixa = $("#toasts");
  if (!caixa) {
    caixa = document.createElement("div");
    caixa.id = "toasts";
    caixa.setAttribute("role", "status");
    document.body.appendChild(caixa);
  }
  const aviso = document.createElement("div");
  aviso.className = "toast " + tipo;
  aviso.textContent = mensagem;
  caixa.appendChild(aviso);
  setTimeout(() => aviso.remove(), 3500);
}

// Aviso para a próxima página
const avisarDepois = (mensagem, tipo = "ok") =>
  sessionStorage.setItem("techstore_flash", JSON.stringify({ mensagem, tipo }));

function mostrarAvisoPendente() {
  let aviso = null;
  try { aviso = JSON.parse(sessionStorage.getItem("techstore_flash")); } catch (e) {}
  sessionStorage.removeItem("techstore_flash");
  if (aviso) toast(aviso.mensagem || aviso.msg, aviso.tipo);
}

document.addEventListener("DOMContentLoaded", () => {
  mostrarAvisoPendente();
  carregarUsuario();
  iniciarLogin();
  iniciarCadastro();
  carregarHome();
  renderizarListagem();
  renderizarDetalhe();
  iniciarBanner();
  inicializarCarrosseisProdutos();
  atualizarContador();
  renderizarCarrinho();
});

document.addEventListener("click", (e) => {
  const alvo = e.target.closest("[data-add],[data-remover],[data-finalizar],#btn-sair");
  if (!alvo) return;
  if (alvo.dataset.add) adicionarAoCarrinho(Number(alvo.dataset.add));
  else if (alvo.dataset.remover) removerUmDoCarrinho(Number(alvo.dataset.remover));
  else if ("finalizar" in alvo.dataset) finalizarCompra();
  else {
    e.preventDefault();
    localStorage.removeItem("usuarioLogado");
    location.href = "index.html";
  }
});

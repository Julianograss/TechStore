// Carrinho (guarda só id e quantidade)
const lerCarrinho = () => lerJSON("techstore_carrinho", []).map((i) => ({ id: i.id, quantidade: i.quantidade }));

function salvarCarrinho(carrinho) {
  salvarJSON("techstore_carrinho", carrinho);
  atualizarContador();
}

function detalharCarrinho() {
  const lista = produtos();
  return lerCarrinho().flatMap((i) => {
    const p = lista.find((x) => x.id === i.id);
    return p ? [{ ...p, quantidade: i.quantidade }] : [];
  });
}

function adicionarAoCarrinho(id) {
  const produto = produtos().find((p) => p.id === id);
  if (!produto) return toast("Produto não encontrado.", "erro");
  const carrinho = lerCarrinho();
  const item = carrinho.find((i) => i.id === id);
  if (item) item.quantidade += 1;
  else carrinho.push({ id, quantidade: 1 });
  salvarCarrinho(carrinho);
  const procura = lerJSON("techstore_procura", {});
  procura[id] = (procura[id] || 0) + 1;
  salvarJSON("techstore_procura", procura);
  toast(`${produto.nome} foi adicionado ao carrinho.`);
}

function removerUmDoCarrinho(id) {
  const carrinho = lerCarrinho();
  const i = carrinho.findIndex((x) => x.id === id);
  if (i === -1) return;
  if (carrinho[i].quantidade > 1) carrinho[i].quantidade -= 1;
  else carrinho.splice(i, 1);
  salvarCarrinho(carrinho);
  renderizarCarrinho();
}

function atualizarContador() {
  const el = $("#contador-carrinho");
  if (!el) return;
  const total = lerCarrinho().reduce((t, i) => t + i.quantidade, 0);
  el.textContent = total;
  el.style.display = total ? "grid" : "none";
}

function renderizarCarrinho() {
  const tabela = $(".tabela-produtos"), rodape = $(".footer-carrinho");
  if (!tabela || !rodape) return;
  const itens = detalharCarrinho();
  if (!itens.length) {
    tabela.innerHTML = '<div class="carrinho-vazio" style="padding:30px;text-align:center;font-size:1.1rem;color:#555">Nenhum produto adicionado ao carrinho.</div>';
    rodape.innerHTML = "";
    return;
  }
  tabela.innerHTML = itens
    .map((i) => `
      <div class="carrinho-item">
        <img src="${esc(i.imagem)}" alt="${esc(i.nome)}" />
        <div class="carrinho-item-info">
          <h3>${esc(i.nome)}</h3>
          <p class="preco">${formatarPreco(i.preco)}</p>
          <p class="preco-parcelado">${parcela(i.preco)}</p>
          <p>Quantidade: ${i.quantidade}</p>
          <button class="btn-remover-item" data-remover="${i.id}">Remover 1</button>
        </div>
      </div>`)
    .join("");
  const total = itens.reduce((t, i) => t + i.preco * i.quantidade, 0);
  rodape.innerHTML = `<div class="total">Total: ${formatarPreco(total)}</div><button class="btn-finalizar" data-finalizar>Finalizar Compra</button>`;
}

function finalizarCompra() {
  const usuario = usuarioLogado();
  if (!usuario) {
    sessionStorage.setItem("techstore_voltar", "carrinho.html");
    avisarDepois("Faça login para finalizar a compra.", "erro");
    location.href = "entrar.html";
    return;
  }
  const itens = detalharCarrinho();
  if (!itens.length) return;
  const pedidos = lerJSON("techstore_pedidos", []);
  pedidos.push({
    id: Date.now(), cliente: usuario.nome, email: usuario.email, status: "pendente", pagamento: "pix",
    data: new Date().toISOString(),
    itens: itens.map((i) => ({ id: i.id, nome: i.nome, preco: i.preco, qtd: i.quantidade, categoria: i.categoria })),
    total: itens.reduce((t, i) => t + i.preco * i.quantidade, 0),
  });
  salvarJSON("techstore_pedidos", pedidos);
  salvarCarrinho([]);
  renderizarCarrinho();
  toast("Compra finalizada! Seu pedido foi registrado.");
}

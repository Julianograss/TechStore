const produtos = () => lerJSON("techstore_produtos", produtosIniciais);
const salvarProdutos = (lista) => salvarJSON("techstore_produtos", lista);

const cardProduto = (p) => `
  <div class="produto">
    <a class="produto-link" href="produto.html?id=${p.id}">
      <img src="${esc(p.imagem)}" alt="${esc(p.nome)}">
      <p>${esc(p.nome)}</p>
    </a>
    <p>${formatarPreco(p.preco)}</p>
    <p>${parcela(p.preco)}</p>
    <button class="btn-buscar" data-add="${p.id}">Comprar</button>
  </div>`;

function renderTrack(idDoElemento, lista) {
  const el = document.getElementById(idDoElemento);
  if (el) el.innerHTML = lista.map(cardProduto).join("");
}

// Seções da home (critérios na RN06)
function selecionarSecoes(lista) {
  const vendidos = {};
  lerJSON("techstore_pedidos", [])
    .filter((o) => o.status !== "cancelado")
    .forEach((o) => o.itens.forEach((i) => (vendidos[i.id] = (vendidos[i.id] || 0) + i.qtd)));
  const procurados = lerJSON("techstore_procura", {});
  const usados = new Set();
  const pegar = (ordenada, n) => {
    const r = ordenada.filter((p) => !usados.has(p.id)).slice(0, n);
    r.forEach((p) => usados.add(p.id));
    return r;
  };
  const ranking = (m) => [...lista].sort((a, b) => (m[b.id] || 0) - (m[a.id] || 0));
  const categoriasCarrinho = new Set(detalharCarrinho().map((p) => p.categoria));
  const recomendados = [...lista].sort(
    (a, b) => categoriasCarrinho.has(b.categoria) - categoriasCarrinho.has(a.categoria) || a.preco - b.preco,
  );
  const recentes = [...lista].reverse();
  return {
    populares: pegar(ranking(vendidos), 5),
    procurados: pegar(ranking(procurados), 5),
    recomendacoes: pegar(recomendados, 5),
    lancamentos: pegar(recentes, 12),
    novidades: pegar(recentes, 15),
  };
}

function carregarHome() {
  if (!$("#track-populares")) return;
  const s = selecionarSecoes(produtos());
  renderTrack("track-populares", s.populares);
  renderTrack("track-recomendacoes", s.recomendacoes);
  renderTrack("track-mais-procurados", s.procurados);
  renderTrack("track-novidades", s.novidades);
  document.querySelectorAll("#banner-lancamentos .grade-produtos-banner").forEach((grade, i) => {
    grade.innerHTML = s.lancamentos
      .slice(i * 6, i * 6 + 6)
      .map((p) => `<a class="produto-banner" href="produto.html?id=${p.id}" style="background-image:url('${esc(p.imagem)}')"><div><p>${esc(p.nome)}</p><p>${formatarPreco(p.preco)}</p></div></a>`)
      .join("");
  });
}

let slideAtualBanner = 0;
function mudarSlideBanner(direcao) {
  const slides = document.querySelectorAll("#banner-lancamentos .slide");
  if (!slides.length) return;
  slides[slideAtualBanner].classList.remove("ativo");
  slideAtualBanner = (slideAtualBanner + direcao + slides.length) % slides.length;
  slides[slideAtualBanner].classList.add("ativo");
}
function iniciarBanner() {
  if (!$("#banner-lancamentos")) return;
}

function renderizarListagem() {
  const grade = document.getElementById("grade-produtos");
  if (!grade) return;
  const url = new URLSearchParams(location.search);
  const busca = url.get("q") || "", cat = url.get("cat") || "";
  const norm = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const todos = produtos();
  const lista = todos.filter((p) => (!cat || p.categoria === cat) && norm(`${p.nome} ${p.categoria}`).includes(norm(busca.trim())));
  $("#campo-busca").value = busca;
  $("#titulo-listagem").textContent = cat || (busca ? `Resultados para "${busca}"` : "Todos os produtos");
  $("#contagem-listagem").textContent = `${lista.length} produto(s)`;
  $("#filtro-categorias").innerHTML = ["", ...new Set(todos.map((p) => p.categoria))]
    .map((c) => `<a class="${c === cat ? "ativa" : ""}" href="produtos.html${c ? "?cat=" + encodeURIComponent(c) : ""}">${esc(c) || "Todas"}</a>`)
    .join("");
  grade.innerHTML = lista.length ? lista.map(cardProduto).join("") : '<p class="vazio-listagem">Nenhum produto encontrado.</p>';
}

function renderizarDetalhe() {
  const alvo = document.getElementById("detalhe-produto");
  if (!alvo) return;
  const id = Number(new URLSearchParams(location.search).get("id"));
  const p = produtos().find((x) => x.id === id);
  if (!p) {
    alvo.innerHTML = '<p class="vazio-listagem">Produto não encontrado.</p><a class="voltar" href="produtos.html">Ver todos os produtos</a>';
    return;
  }
  document.title = `${p.nome} - TechStore Brasil`;
  const specs = (p.especificacoes || []).map((e) => `<tr><th>${esc(e.nome)}</th><td>${esc(e.valor)}</td></tr>`).join("");
  alvo.innerHTML = `
    <a class="voltar" href="produtos.html?cat=${encodeURIComponent(p.categoria)}">← ${esc(p.categoria)}</a>
    <div class="detalhe">
      <img src="${esc(p.imagem)}" alt="${esc(p.nome)}">
      <div class="detalhe-info">
        <h1>${esc(p.nome)}</h1>
        <p class="detalhe-preco">${formatarPreco(p.preco)}</p>
        <p>${parcela(p.preco)}</p>
        <button class="btn-buscar" data-add="${p.id}">Comprar</button>
      </div>
    </div>
    <section class="detalhe-texto"><h2>Sobre o produto</h2><p>${esc(p.descricao || "Descrição em breve.")}</p></section>
    ${specs ? `<section class="detalhe-texto"><h2>Especificações</h2><table>${specs}</table></section>` : ""}`;
}

function inicializarCarrosseisProdutos() {
  document
    .querySelectorAll(".carrossel:not(#banner-lancamentos)")
    .forEach((carrossel) => {
      const track = carrossel.querySelector(".track");
      const produtos = carrossel.querySelectorAll(".produto");
      const anterior = carrossel.querySelector(".anterior");
      const proximo = carrossel.querySelector(".proximo");
      if (!track || !produtos.length) return;
      let indice = 0;
      function getLarguraCarrinho() {
        const card = produtos[0];
        const style = window.getComputedStyle(card);
        const marginRight = parseInt(style.marginRight) || 25;
        return card.offsetWidth + marginRight;
      }
      function atualizarScroll() {
        const cardWidth = getLarguraCarrinho();
        track.style.transform = `translateX(-${indice * cardWidth}px)`;
      }
      if (proximo) {
        const novoProximo = proximo.cloneNode(true);
        proximo.parentNode.replaceChild(novoProximo, proximo);
        novoProximo.addEventListener("click", () => {
          const cardWidth = getLarguraCarrinho();
          const containerWidth = carrossel.clientWidth - 100;
          const visibleCards = Math.max(
            1,
            Math.floor(containerWidth / cardWidth),
          );
          const maxIndex = Math.max(0, produtos.length - visibleCards);
          if (indice < maxIndex) {
            indice++;
          } else {
            indice = 0;
          }
          atualizarScroll();
        });
      }
      if (anterior) {
        const novoAnterior = anterior.cloneNode(true);
        anterior.parentNode.replaceChild(novoAnterior, anterior);
        novoAnterior.addEventListener("click", () => {
          const cardWidth = getLarguraCarrinho();
          const containerWidth = carrossel.clientWidth - 100;
          const visibleCards = Math.max(
            1,
            Math.floor(containerWidth / cardWidth),
          );
          const maxIndex = Math.max(0, produtos.length - visibleCards);
          if (indice > 0) {
            indice--;
          } else {
            indice = maxIndex;
          }
          atualizarScroll();
        });
      }
    });
}

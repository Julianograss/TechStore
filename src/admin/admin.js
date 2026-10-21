(() => {
const $ = (s) => document.querySelector(s);
const R = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const J = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const S = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Acesso restrito
const user = J("usuarioLogado", null);
if (!user || user.tipo !== "admin") { location.href = "entrar.html"; return; }

// ---- Dados ----
const prods = () => J("techstore_produtos", produtosIniciais);
const cats = () => J("techstore_categorias", [...new Set(prods().map((p) => p.categoria))]);
const all = () => J("techstore_pedidos", []);
let hide = J("adm_hide", false);
const m = (v) => (hide ? "R$ •••" : R(v));

if (!J("techstore_demo", 0)) {
  let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const P = prods(), nomes = ["Ana", "Bruno", "Carla", "Diego", "Elisa", "Fábio"], out = [];
  for (let i = 0; i < 30; i++) {
    const itens = [...Array(1 + ((r() * 3) | 0))].map(() => { const p = P[(r() * P.length) | 0]; return { id: p.id, nome: p.nome, preco: p.preco, qtd: 1 + ((r() * 2) | 0), categoria: p.categoria }; });
    out.push({ id: 1000 + i, demo: 1, cliente: nomes[(r() * 6) | 0] + " Souza", status: r() < 0.75 ? "pago" : r() < 0.5 ? "pendente" : "cancelado", pagamento: ["pix", "cartao", "boleto"][(r() * 3) | 0], data: new Date(Date.now() - r() * 60 * 864e5).toISOString(), itens, total: itens.reduce((t, x) => t + x.preco * x.qtd, 0) });
  }
  S("techstore_pedidos", [...all(), ...out]); S("techstore_demo", 1);
}

// ---- Componentes ----
const COL = ["#f39c12", "#162d5f", "#43A047", "#E53935", "#1E88E5", "#8e44ad", "#16a085", "#d35400", "#7f8c8d", "#c0392b", "#2980b9", "#27ae60", "#e67e22", "#34495e"];
const dl = (d) => { const x = new Date(d), f = (a) => a.toDateString(); return f(x) === f(new Date()) ? "Hoje" : f(x) === f(new Date(Date.now() - 864e5)) ? "Ontem" : x.toLocaleDateString("pt-BR"); };
const byCat = (os) => { const o = {}; os.forEach((p) => p.itens.forEach((i) => (o[i.categoria] = (o[i.categoria] || 0) + i.preco * i.qtd))); return Object.entries(o).sort((a, b) => b[1] - a[1]); };
const donut = (os) => {
  const d = byCat(os), t = d.reduce((s, x) => s + x[1], 0);
  if (!t) return '<p class="vazio">Sem vendas no período.</p>';
  let a = 0;
  const g = d.map((x, i) => { const p = a + (x[1] / t) * 100, c = `${COL[i % 14]} ${a}% ${p}%`; a = p; return c; }).join(",");
  return `<div class="donut-box"><div class="donut" style="background:conic-gradient(${g})"><span>${m(t)}</span></div><ul class="leg">${d.map((x, i) => `<li><i style="background:${COL[i % 14]}"></i>${esc(x[0])}<b>${Math.round((x[1] / t) * 100)}%</b></li>`).join("")}</ul></div>`;
};
const row = (o, ed) => `<div class="row"><span class="ic ${o.status}"><i class="fa-solid fa-bag-shopping"></i></span><div><b>#${o.id} · ${esc(o.cliente)}</b><small>${o.itens.length} item(ns) às ${new Date(o.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</small></div><div class="r"><b>${m(o.total)}</b>${ed ? `<select class="sel" data-oid="${o.id}" aria-label="Status do pedido">${["pendente", "pago", "cancelado"].map((s) => `<option ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}</select>` : `<span class="tag ${o.status}">${o.status}</span>`}</div></div>`;
const byDate = (a, b) => b.data.localeCompare(a.data);

// ---- Telas ----
function dash() {
  const os = all(), pg = os.filter((o) => o.status === "pago"), rec = pg.reduce((s, o) => s + o.total, 0);
  return `<section class="hero"><small>Receita bruta (pedidos pagos)</small><h2>${m(rec)}</h2></section>
<div class="cards"><div class="card"><i class="fa-solid fa-bag-shopping"></i><small>Pedidos</small><b>${os.length}</b></div>
<div class="card"><i class="fa-solid fa-receipt"></i><small>Ticket médio</small><b>${m(pg.length ? rec / pg.length : 0)}</b></div>
<div class="card"><i class="fa-solid fa-clock"></i><small>Pendentes</small><b>${os.filter((o) => o.status === "pendente").length}</b></div>
<div class="card"><i class="fa-solid fa-box"></i><small>Produtos</small><b>${prods().length}</b></div></div>
<div class="grid2"><div class="painel"><h3>Últimos pedidos</h3>${[...os].sort(byDate).slice(0, 5).map((o) => row(o)).join("") || '<p class="vazio">Nenhum pedido ainda.</p>'}</div>
<div class="painel"><h3>Vendas por categoria</h3>${donut(pg)}</div></div>`;
}

let q = "", st = "todos", q2 = "", mes = new Date().toISOString().slice(0, 7);
const listaPed = () => {
  const g = {};
  all().filter((o) => (st === "todos" || o.status === st) && `${o.id} ${o.cliente} ${o.itens.map((i) => i.nome).join(" ")}`.toLowerCase().includes(q)).sort(byDate).forEach((o) => (g[dl(o.data)] ??= []).push(o));
  const k = Object.keys(g);
  return k.length ? k.map((d) => `<h4 class="grp">${d}</h4>` + g[d].map((o) => row(o, 1)).join("")).join("") : '<p class="vazio">Nenhum pedido encontrado.</p>';
};
const pedidos = () => `<input id="busca" class="inp" placeholder="Busque por pedido, cliente ou produto" value="${esc(q)}">
<div class="chips">${["todos", "pago", "pendente", "cancelado"].map((s) => `<button class="chip ${s === st ? "on" : ""}" data-st="${s}">${s}</button>`).join("")}</div>
<div class="painel" id="lista">${listaPed()}</div>`;

const linhas = () => prods().filter((p) => p.nome.toLowerCase().includes(q2)).map((p) => `<tr><td><img src="${esc(p.imagem)}" alt=""></td><td>${esc(p.nome)}</td><td>${esc(p.categoria)}</td><td>${R(p.preco)}</td><td><button class="ib" data-a="edit" data-id="${p.id}" aria-label="Editar"><i class="fa-solid fa-pen"></i></button><button class="ib red" data-a="del" data-id="${p.id}" aria-label="Excluir"><i class="fa-solid fa-trash"></i></button></td></tr>`).join("");
const produtos = () => `<div class="barra"><input id="busca2" class="inp" placeholder="Buscar produto" value="${esc(q2)}"><button class="btn" data-a="novo">Novo produto</button></div>
<div class="painel tw"><table><thead><tr><th></th><th>Nome</th><th>Categoria</th><th>Preço</th><th></th></tr></thead><tbody id="tb">${linhas()}</tbody></table></div>`;

function modal(id) {
  const p = prods().find((x) => x.id == id) || {}, imgs = [...new Set([...prods().map((x) => x.imagem), "src/res/placeholder.jpg"])], d = $("#dlg");
  d.innerHTML = `<form id="fp"><h3>${id ? "Editar" : "Novo"} produto</h3>
<label>Nome<input name="nome" required value="${esc(p.nome)}"></label>
<label>Preço (R$)<input name="preco" type="number" step="0.01" min="0.01" required value="${p.preco || ""}"></label>
<label>Categoria<select name="categoria">${cats().map((c) => `<option ${c === p.categoria ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label>
<label>Imagem<select name="imagem" required>${imgs.map((i) => `<option value="${esc(i)}" ${i === p.imagem ? "selected" : ""}>${esc(i.split("/").pop())}</option>`).join("")}</select></label>
<label>Descrição detalhada<textarea name="descricao" rows="4" required>${esc(p.descricao)}</textarea></label>
<label>Especificações (uma por linha, no formato Nome: valor)<textarea name="especificacoes" rows="4">${esc((p.especificacoes || []).map((e) => e.nome + ": " + e.valor).join("\n"))}</textarea></label>
<div class="acts"><button type="button" class="btn ghost" data-a="x">Cancelar</button><button class="btn">Salvar produto</button></div></form>`;
  d.dataset.id = id || ""; d.showModal();
}

function relatorios() {
  const os = all().filter((o) => o.status === "pago" && o.data.slice(0, 7) === mes), t = os.reduce((s, o) => s + o.total, 0), c = byCat(os), pr = {};
  os.forEach((o) => o.itens.forEach((i) => (pr[i.nome] = (pr[i.nome] || 0) + i.qtd)));
  return `<div class="barra"><input type="month" id="mes" class="inp" value="${mes}" style="flex:0 0 auto"><b>Total vendido: ${m(t)}</b></div>
<div class="grid2"><div class="painel"><h3>Vendas por categoria</h3>${donut(os)}</div>
<div class="painel"><h3>Receita por categoria</h3>${c.map((x, i) => `<div class="pb"><span>${esc(x[0])}<b>${m(x[1])}</b></span><div><i style="width:${(x[1] / t) * 100}%;background:${COL[i % 14]}"></i></div></div>`).join("") || '<p class="vazio">Sem dados neste mês.</p>'}
<h3 style="margin-top:18px">Mais vendidos</h3>${Object.entries(pr).sort((a, b) => b[1] - a[1]).slice(0, 5).map((x) => `<div class="pb"><span>${esc(x[0])}<b>${x[1]} un.</b></span></div>`).join("") || '<p class="vazio">Sem dados neste mês.</p>'}</div></div>`;
}

const config = () => `<div class="painel"><h3>Aparência</h3>
<label class="sw"><input type="checkbox" id="tema" ${document.documentElement.dataset.theme === "dark" ? "checked" : ""}> Modo escuro</label>
<label class="sw"><input type="checkbox" id="hide" ${hide ? "checked" : ""}> Ocultar valores</label></div>
<div class="painel"><h3>Categorias de produto</h3><div class="chips">${cats().map((c) => `<span class="chip">${esc(c)}<a data-a="rc" data-c="${esc(c)}" aria-label="Remover ${esc(c)}">×</a></span>`).join("")}</div>
<div class="barra" style="margin-top:12px"><input id="nc" class="inp" placeholder="Nova categoria"><button class="btn" data-a="ac">Adicionar categoria</button></div></div>
<div class="painel"><h3>Dados</h3><div class="barra"><button class="btn ghost" data-a="csv">Exportar pedidos (CSV)</button><button class="btn red" data-a="reset">Gerar novos pedidos de demonstração</button></div></div>`;

// ---- Rotas ----
const V = { dash, pedidos, produtos, relatorios, config };
const T = { dash: "Dashboard", pedidos: "Pedidos", produtos: "Produtos", relatorios: "Relatórios", config: "Configurações" };
function go() {
  const k = V[location.hash.slice(2)] ? location.hash.slice(2) : "dash";
  document.querySelectorAll(".nav a[data-v]").forEach((a) => a.classList.toggle("on", a.dataset.v === k));
  $("#titulo").textContent = T[k]; $("#view").innerHTML = V[k](); document.body.classList.remove("menu");
}
const tema = (t) => { document.documentElement.dataset.theme = t; localStorage.setItem("adm_tema", t); };
tema(localStorage.getItem("adm_tema") || "light");
$("#ola").textContent = "Olá, " + user.nome.split(" ")[0];

// ---- Eventos ----
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-a],[data-st]"); if (!t) return;
  const a = t.dataset.a, id = t.dataset.id;
  if (t.dataset.st) { st = t.dataset.st; return go(); }
  if (a === "menu") document.body.classList.toggle("menu");
  if (a === "novo") modal();
  if (a === "edit") modal(id);
  if (a === "x") $("#dlg").close();
  if (a === "del" && confirm("Excluir este produto?")) { S("techstore_produtos", prods().filter((p) => p.id != id)); go(); }
  if (a === "ac") { const v = $("#nc").value.trim(); if (v && !cats().includes(v)) { S("techstore_categorias", [...cats(), v]); go(); } }
  if (a === "rc") { S("techstore_categorias", cats().filter((c) => c !== t.dataset.c)); go(); }
  if (a === "csv") {
    const l = ["id;cliente;status;pagamento;data;total", ...all().sort(byDate).map((o) => [o.id, o.cliente, o.status, o.pagamento, o.data, o.total.toFixed(2).replace(".", ",")].join(";"))];
    const b = document.createElement("a"); b.href = URL.createObjectURL(new Blob(["\ufeff" + l.join("\n")], { type: "text/csv" })); b.download = "pedidos-techstore.csv"; b.click();
  }
  if (a === "reset" && confirm("Apagar os pedidos de demonstração e gerar novos?")) { S("techstore_pedidos", all().filter((o) => !o.demo)); localStorage.removeItem("techstore_demo"); location.reload(); }
  if (a === "sair") { localStorage.removeItem("usuarioLogado"); location.href = "index.html"; }
});
document.addEventListener("input", (e) => {
  const i = e.target.id;
  if (i === "busca") { q = e.target.value.toLowerCase(); $("#lista").innerHTML = listaPed(); }
  if (i === "busca2") { q2 = e.target.value.toLowerCase(); $("#tb").innerHTML = linhas(); }
  if (i === "mes" && e.target.value) { mes = e.target.value; go(); }
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.oid) { const l = all(); l.find((o) => o.id == t.dataset.oid).status = t.value; S("techstore_pedidos", l); go(); }
  if (t.id === "tema") tema(t.checked ? "dark" : "light");
  if (t.id === "hide") { hide = t.checked; S("adm_hide", hide); }
});
document.addEventListener("submit", (e) => {
  if (e.target.id !== "fp") return;
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target)), l = prods(), id = $("#dlg").dataset.id, p = { nome: f.nome.trim(), preco: +f.preco, categoria: f.categoria, imagem: f.imagem, descricao: f.descricao.trim(), especificacoes: f.especificacoes.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { const i = l.indexOf(":"); return i > 0 ? { nome: l.slice(0, i).trim(), valor: l.slice(i + 1).trim() } : { nome: l, valor: "" }; }) };
  if (id) Object.assign(l.find((x) => x.id == id), p); else l.push({ id: Math.max(0, ...l.map((x) => x.id)) + 1, ...p });
  S("techstore_produtos", l); $("#dlg").close(); go();
});
addEventListener("hashchange", go);
go();
})();

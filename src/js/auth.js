const USUARIOS_PADRAO = [
  { nome: "Administrador Chefe", email: "admin@techstore.com.br", senha: "123", tipo: "admin" },
  { nome: "João Cliente", email: "joao@email.com", senha: "123", tipo: "cliente" },
];
const usuarios = () => lerJSON("techstore_usuarios", USUARIOS_PADRAO);
const usuarioLogado = () => lerJSON("usuarioLogado", null);

function carregarUsuario() {
  const usuario = usuarioLogado();
  const botoes = $(".botoes");
  if (!usuario || !botoes) return;
  botoes.innerHTML = `
    <span>Olá, ${esc(usuario.nome)}</span>
    <button class="btn-criar-conta"><a href="#" id="btn-sair">Sair</a></button>
    ${usuario.tipo === "admin" ? '<button class="btn-entrar"><a href="painel-adm.html">Painel Adm</a></button>' : ""}`;
}

function iniciarLogin() {
  const form = $("#form-login");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#email").value.trim().toLowerCase(), senha = $("#senha").value;
    const encontrado = usuarios().find((u) => u.email.toLowerCase() === email && u.senha === senha);
    if (!encontrado) return toast("E-mail ou senha incorretos.", "erro");
    const { senha: _, ...sessao } = encontrado;
    salvarJSON("usuarioLogado", sessao);
    avisarDepois(`Bem-vindo(a), ${sessao.nome}!`);
    const voltar = sessionStorage.getItem("techstore_voltar");
    sessionStorage.removeItem("techstore_voltar");
    location.href = voltar || (sessao.tipo === "admin" ? "painel-adm.html" : "index.html");
  });
}

function iniciarCadastro() {
  const form = $("#form-criar-conta");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = $("#nome").value.trim(), email = $("#email").value.trim().toLowerCase();
    const senha = $("#senha").value, confirmacao = $("#confirma-senha").value;
    const erro =
      nome.length < 2 ? "Informe seu nome completo."
      : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? "Informe um e-mail válido."
      : senha.length < 6 ? "A senha deve ter pelo menos 6 caracteres."
      : senha !== confirmacao ? "As senhas não coincidem."
      : usuarios().some((u) => u.email.toLowerCase() === email) ? "Este e-mail já possui uma conta."
      : "";
    if (erro) return toast(erro, "erro");
    salvarJSON("techstore_usuarios", [...usuarios(), { nome, email, senha, tipo: "cliente" }]);
    avisarDepois("Conta criada! Faça login para continuar.");
    location.href = "entrar.html";
  });
}

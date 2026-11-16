/* ==========================================================
   Guilherme Fiorentini — portfólio
   Site estático de uma página: lê data/projetos.json (gerado
   pelo gerar.py a partir da pasta /projetos) e desenha tudo.
   ========================================================== */

/* ---------- seções e categorias (os nomes das pastas → nomes no site) ---------- */
const SECOES = {
  "arte-tecnologia": {
    nome: "ARTE / TECNOLOGIA",
    sub: "Desenvolvimento de HARDWARE personalizado com interface, circuito eletrônico e firmware para instalações interativas, exposições e ativações de marca — focado em som, luz e imagem generativos.",
    cats: {
      "marcas-eventos": "Marca / Eventos",
      "arte": "Arte",
      "projetos-pessoais": "Projetos pessoais",
    },
  },
  "audiovisual": {
    nome: "AUDIOVISUAL",
    sub: "Som, vídeo e produção virtual para cinema, série, podcast, publicidade e divulgação científica.",
    cats: {
      "coordenacao-audiovisual": "Coordenação audiovisual",
      "som": "Som",
      "producao-virtual": "Produção virtual",
      "video": "Vídeo",
    },
  },
};
const SECAO_INICIAL = "arte-tecnologia";
const NOME = "Guilherme Fiorentini";

/* ---------- utilidades ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const caminho = p => p ? p.split("/").map(encodeURIComponent).join("/") : "";
const nomeCat = (sec, cat) => SECOES[sec]?.cats[cat] || cat.replace(/-/g, " ").replace(/^./, c => c.toUpperCase());
const nomeSec = sec => SECOES[sec]?.nome || sec;

/* nomes de clientes, estúdios e pessoas viram link (lista em projetos/nomes.txt) */
let NOMES = {}, reNomes = null;
function linkarNomes(texto) {
  const t = esc(texto);
  if (!reNomes) return t;
  return t.replace(reNomes, m => {
    const url = NOMES[Object.keys(NOMES).find(n => esc(n) === m)];
    return url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${m}</a>` : m;
  });
}
function prepararNomes(nomes) {
  NOMES = nomes || {};
  const lista = Object.keys(NOMES).sort((x, y) => y.length - x.length)   // nome mais longo primeiro
    .map(n => esc(n).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  reNomes = lista.length ? new RegExp(`(?<![\\p{L}\\d])(?:${lista.join("|")})(?![\\p{L}\\d])`, "gu") : null;
}

/* gerador pseudo-aleatório com semente (mesma semente → mesmo desenho) */
function semente(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    let t = (h ^= h >>> 16) >>> 0;
    t += 0x6d2b79f5; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ----------------------------------------------------------
   Capa gerada: enquanto o projeto não tem foto, ele ganha um
   desenho próprio — uma figura de Lissajous (arte e tecnologia)
   ou uma forma de onda (audiovisual), calculada a partir do nome.
   ---------------------------------------------------------- */
function capaGerada(p) {
  const r = semente(p.id);
  const W = 400, H = 300;
  let traco = "", ponto = "", legenda = "";

  if (p.secao === "audiovisual") {
    const n = 96, f1 = 1 + r() * 4, f2 = 6 + r() * 14, fase = r() * 6.28;
    const env = i => Math.sin(Math.PI * i / (n - 1)) ** (0.6 + r() * 0.05);
    let d = "", pico = { a: 0, x: 0, y: 0 };
    for (let i = 0; i < n; i++) {
      const x = 40 + i * (W - 80) / (n - 1);
      const a = Math.abs(Math.sin(i / n * f1 * 6.28 + fase) * 0.6 + Math.sin(i / n * f2 * 6.28) * 0.4) * env(i) * 95 + 1.5;
      d += `M${x.toFixed(1)} ${(H / 2 - a).toFixed(1)}V${(H / 2 + a).toFixed(1)}`;
      if (a > pico.a) pico = { a, x, y: H / 2 - a };
    }
    traco = d;
    ponto = `<rect class="ponto" x="${pico.x - 3}" y="${pico.y - 8}" width="6" height="6"/>`;
    legenda = `f=${f1.toFixed(2)}/${f2.toFixed(1)}`;
  } else {
    const a = 1 + Math.floor(r() * 5), b = a + 1 + Math.floor(r() * 4), dl = r() * Math.PI;
    let d = "";
    for (let i = 0; i <= 900; i++) {
      const t = i / 900 * Math.PI * 2;
      const x = W / 2 + Math.sin(a * t + dl) * 120, y = H / 2 + Math.sin(b * t) * 105;
      d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }
    traco = d;
    const t0 = r() * 6.28;
    ponto = `<rect class="ponto" x="${(W / 2 + Math.sin(a * t0 + dl) * 120 - 3).toFixed(1)}" y="${(H / 2 + Math.sin(b * t0) * 105 - 3).toFixed(1)}" width="6" height="6"/>`;
    legenda = `a=${a} b=${b} δ=${dl.toFixed(2)}`;
  }
  return `<svg class="gerada" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(p.titulo)}">
    <path class="traco" d="${traco}"/>${ponto}<text x="14" y="${H - 14}">${legenda}</text></svg>`;
}

function imagemCapa(p, eager = false) {
  if (!p.capa) return capaGerada(p);
  return `<img src="${caminho(p.capaWeb || p.capa)}" alt="${esc(p.titulo)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

/* texto do info.txt → HTML (parágrafos, listas com "- " e **negrito**) */
function formatarTexto(t = "") {
  return t.split(/\n\s*\n/).map(bloco => {
    const linhas = bloco.split("\n").map(l => l.trim()).filter(Boolean);
    if (!linhas.length) return "";
    const fmt = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    if (linhas.every(l => l.startsWith("- "))) return `<ul>${linhas.map(l => `<li>${fmt(l.slice(2))}</li>`).join("")}</ul>`;
    return `<p>${linhas.map(fmt).join("<br>")}</p>`;
  }).join("");
}

/* YouTube/Vimeo → endereço de incorporação */
function urlEmbed(u) {
  let m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0`;
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}?dnt=1`;
  return u;
}

/* ---------- estado ---------- */
let PROJETOS = [];
let SOBRE = {};
const app = $("#app");
let limpar = [];            // funções de limpeza da página atual (teclado, etc.)
const rolagem = {};         // posição de rolagem de cada lista, para voltar ao mesmo ponto

/* ==========================================================
   PÁGINAS
   ========================================================== */
function paginaLista(sec) {
  const S = SECOES[sec];
  const lista = PROJETOS.filter(p => p.secao === sec);

  const cards = lista.map(p => `
    <a class="card" href="#/p/${encodeURIComponent(p.id)}">
      <div class="card__img">${imagemCapa(p)}</div>
      <div class="card__veu">
        <span class="card__cat">${esc((p.cliente || "").split("·")[0].trim())}</span>
        <h2 class="card__titulo">${esc(p.titulo)}</h2>
        <span class="card__ano">${esc(p.ano)}</span>
      </div>
    </a>`).join("");

  app.innerHTML = `
    <section class="pagina entra">
      <header class="cabeca">
        <h1>${esc(S.nome)}</h1>
        <span class="cabeca__conta">${String(lista.length).padStart(2, "0")} ${lista.length === 1 ? "projeto" : "projetos"}</span>
        <p class="cabeca__sub">${esc(S.sub)}</p>
      </header>
      ${lista.length ? `<div class="grade">${cards}</div>` : `<p class="vazio-msg">— em breve.</p>`}
    </section>`;

  document.title = `${S.nome} — ${NOME}`;
  veuNoToque();
}

/* Sem mouse não existe "passar por cima": no celular, o card que cruza
   a faixa central da tela ganha o véu com o título, como se fosse o hover. */
function veuNoToque() {
  if (!matchMedia("(hover: none)").matches) return;
  const cards = $$(".card");
  let pedido = 0, atual = null;
  const escolher = () => {
    pedido = 0;
    const meio = innerHeight / 2;
    let melhor = null, dist = Infinity;
    for (const c of cards) {
      const r = c.getBoundingClientRect();
      if (r.top <= meio && r.bottom >= meio) { const d = Math.abs(r.top + r.height / 2 - meio); if (d < dist) { dist = d; melhor = c; } }
    }
    if (melhor !== atual) { atual?.classList.remove("no-foco"); melhor?.classList.add("no-foco"); atual = melhor; }
  };
  const aoRolar = () => { if (!pedido) pedido = requestAnimationFrame(escolher); };
  addEventListener("scroll", aoRolar, { passive: true });
  limpar.push(() => removeEventListener("scroll", aoRolar));
  // só depois que a página rolar: ao abrir, nada fica coberto
}

function paginaProjeto(id) {
  const p = PROJETOS.find(x => x.id === id);
  if (!p) return paginaNaoEncontrada();

  // destaque da página = 2º arquivo da pasta (o 1º é só a miniatura da grade).
  // Ele sai da apresentação para não aparecer duas vezes.
  const [heroi, ...resto] = p.midias || [];
  const midias = resto;
  const blocoHeroi = heroi
    ? `<div class="proj__capa natural">${heroi.tipo === "img"
        ? `<img src="${caminho(heroi.web || heroi.src)}" alt="${esc(p.titulo)}" fetchpriority="high" decoding="async">`
        : `<video src="${caminho(heroi.src)}" autoplay muted loop playsinline controls preload="auto"></video>`}</div>`
    : p.capa
      ? `<div class="proj__capa natural"><img src="${caminho(p.capaWeb || p.capa)}" alt="${esc(p.titulo)}" fetchpriority="high" decoding="async"></div>`
      : `<div class="proj__capa">${imagemCapa(p, true)}</div>`;

  const irmaos = PROJETOS.filter(x => x.secao === p.secao);
  const i = irmaos.indexOf(p);
  const ant = i > 0 ? irmaos[i - 1] : null;   // o primeiro projeto da ordem não tem "Anterior"
  const prox = irmaos[(i + 1) % irmaos.length];

  const ficha = [
    ["Ano", p.ano], ["Função", p.funcao], ["Local", p.local], ["Cliente", p.cliente], ["Agência", p.agencia],
    ...(p.creditos || []).map(c => [c.rotulo, c.nome]),
    ["Fomento", p.fomento],
  ].filter(([, v]) => v).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${linkarNomes(v)}</dd>`).join("");

  const fontes = (p.links || []).map(l =>
    `<a class="fonte" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.rotulo)}</a>`).join("");

  app.innerHTML = `
    <article class="pagina entra">
      <header class="proj__topo">
        <div class="trilha">
          <a href="#/${p.secao}">${esc(nomeSec(p.secao))}</a>
        </div>
        <h1 class="proj__titulo">${esc(p.titulo)}</h1>
      </header>
      ${p.videos?.length ? blocoVideos(p) : ""}
      ${blocoHeroi}
      <div class="proj__corpo">
        <dl class="ficha">${ficha}</dl>
        <div class="proj__texto">${formatarTexto(p.texto)}${fontes ? `<div class="fontes">${fontes}</div>` : ""}</div>
      </div>
      ${midias.length ? `<section class="apres" aria-label="Apresentação"></section>` : ""}
      <nav class="proj__nav">
        ${ant ? `<a class="ant" href="#/p/${encodeURIComponent(ant.id)}"><small>← Anterior</small><strong>${esc(ant.titulo)}</strong></a>` : `<span class="ant"></span>`}
        <a class="todos" href="#/${p.secao}">Todos</a>
        <a class="prox" href="#/p/${encodeURIComponent(prox.id)}"><small>Próximo →</small><strong>${esc(prox.titulo)}</strong></a>
      </nav>
    </article>`;

  if (midias.length) montarApresentacao($(".apres"), midias, p.titulo);
  document.title = `${p.titulo} — ${NOME}`;
}

/* Vídeos do YouTube/Vimeo: em destaque, logo depois do texto.
   Horizontais ocupam a largura toda; verticais (9:16) ficam lado a lado. */
function blocoVideos(p) {
  const quadro = v => `<div class="destaque__video ${v.vertical ? "vertical" : ""}">
      <iframe src="${esc(urlEmbed(v.src))}" title="${esc(p.titulo)} — vídeo" loading="lazy"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe></div>`;
  const hor = p.videos.filter(v => !v.vertical), ver = p.videos.filter(v => v.vertical);
  return `<section class="destaque" aria-label="Vídeo">
      <p class="rotulo">${p.videos.length > 1 ? "Vídeos" : "Vídeo"}</p>
      ${hor.map(quadro).join("")}
      ${ver.length ? `<div class="destaque__verticais">${ver.map(quadro).join("")}</div>` : ""}
    </section>`;
}

function paginaSobre() {
  app.innerHTML = `<div class="pagina entra"></div>`;
  $(".pagina", app).append($("#tpl-sobre").content.cloneNode(true));
  const quadro = $(".sobre__foto", app);
  if (SOBRE.foto) {
    quadro.innerHTML = `<img src="${caminho(SOBRE.fotoWeb || SOBRE.foto)}" alt="${NOME}" decoding="async">`;
  } else {
    quadro.classList.add("sem-foto");
    quadro.innerHTML = `<span class="mono">coloque sua foto em<br>sobre/foto.jpg</span>`;
  }
  document.title = `Sobre — ${NOME}`;
}

function paginaNaoEncontrada() {
  app.innerHTML = `<section class="pagina entra"><header class="cabeca"><h1>404</h1></header>
    <p class="vazio-msg">Sinal perdido. <a href="#/" style="border-bottom:1px solid">Voltar ao início</a></p></section>`;
  document.title = `404 — ${NOME}`;
}

/* ==========================================================
   APRESENTAÇÃO — fotos e vídeos da pasta do projeto.

   O quadro tem sempre o tamanho exato do arquivo: nada de faixa preta.
   · Antes de montar, mede a proporção de cada foto/vídeo.
   · No computador, dois arquivos verticais seguidos dividem a mesma tela.
   · A altura do palco é a que o arquivo mais "alto" precisa (com teto),
     e cada página é desenhada em px exatos dentro dela, centralizada.
   Setas, teclado (← →), arrastar no celular, miniaturas e tela cheia.
   ========================================================== */
function medirProporcao(m) {
  return new Promise(ok => {
    const fim = a => { clearTimeout(t); ok(a || 16 / 9); };
    const t = setTimeout(() => fim(), 6000);
    if (m.tipo === "img") {
      const i = new Image();
      i.onload = () => fim(i.naturalWidth / i.naturalHeight);
      i.onerror = () => fim();
      i.src = caminho(m.mini || m.web || m.src);
    } else {
      const v = document.createElement("video");
      v.preload = "metadata"; v.muted = true;
      v.onloadedmetadata = () => fim(v.videoWidth / v.videoHeight);
      v.onerror = () => fim();
      v.src = caminho(m.src);
    }
  });
}

async function montarApresentacao(raiz, midias, titulo) {
  const pad = n => String(n).padStart(2, "0");
  const GAP = 12;
  raiz.innerHTML = `<div class="apres__barra"><span class="rotulo" style="margin:0">Apresentação</span><span class="mono apres__conta">…</span></div>`;

  const itens = await Promise.all(midias.map(async (m, i) => ({ ...m, i, a: await medirProporcao(m) })));
  if (!raiz.isConnected) return;                       // a pessoa já saiu da página
  itens.forEach(it => it.vertical = it.a < 0.95);

  raiz.innerHTML = `
    <div class="apres__barra">
      <span class="rotulo" style="margin:0">Apresentação</span>
      <span class="apres__direita">
        ${document.fullscreenEnabled ? `<button class="apres__tela mono">tela cheia</button>` : ""}
        <span class="mono apres__conta"></span>
      </span>
    </div>
    <div class="apres__palco" tabindex="0">
      <div class="apres__trilho"></div>
      <button class="apres__seta apres__seta--ant" aria-label="Anterior"><span>←</span></button>
      <button class="apres__seta apres__seta--prox" aria-label="Próxima"><span>→</span></button>
      <button class="apres__fechar mono" aria-label="Sair da tela cheia">fechar ×</button>
    </div>
    <div class="apres__progresso"><i></i></div>
    <div class="miniaturas"></div>`;

  const palco = $(".apres__palco", raiz), trilho = $(".apres__trilho", raiz), miniaturas = $(".miniaturas", raiz);
  const btAnt = $(".apres__seta--ant", raiz), btProx = $(".apres__seta--prox", raiz);
  let paginas = [], atual = 0, emDupla = null, alturas = [], acompanha = false;

  // agrupa: verticais seguidos viram dupla (só em tela larga)
  function agrupar(dupla) {
    const ps = [];
    for (let k = 0; k < itens.length; k++) {
      const a = itens[k], b = itens[k + 1];
      if (dupla && a.vertical && b && b.vertical) { ps.push([a, b]); k++; }
      else ps.push([a]);
    }
    return ps;
  }

  const peca = it => it.tipo === "img"
    ? `<figure class="peca" data-i="${it.i}"><img data-src="${caminho(it.web || it.src)}" alt="${esc(titulo)} — ${it.i + 1}" decoding="async" draggable="false"></figure>`
    : `<figure class="peca" data-i="${it.i}"><video data-src="${caminho(it.src)}#t=0.1" controls playsinline preload="metadata"></video></figure>`;

  const miniPeca = it => it.tipo === "img"
    ? `<img src="${caminho(it.mini || it.web || it.src)}" alt="" loading="lazy" style="aspect-ratio:${it.a}">`
    : `<video src="${caminho(it.src)}#t=0.5" muted preload="metadata" style="aspect-ratio:${it.a}"></video>`;

  function construir() {
    const dupla = palco.clientWidth >= 700;
    if (dupla === emDupla && paginas.length) return false;
    const itemAtual = paginas[atual]?.[0]?.i ?? 0;
    emDupla = dupla;
    paginas = agrupar(dupla);
    trilho.innerHTML = paginas.map(p => `<div class="slide">${p.map(peca).join("")}</div>`).join("");
    miniaturas.innerHTML = paginas.length > 1 ? paginas.map((p, k) =>
      `<button class="mini" data-k="${k}" aria-label="Ir para ${k + 1}">${p.map(miniPeca).join("")}${p.some(x => x.tipo === "video") ? `<span class="mini__tipo">VÍDEO</span>` : ""}</button>`).join("") : "";
    $$(".mini", raiz).forEach(m => m.onclick = () => ir(+m.dataset.k));
    atual = Math.max(0, paginas.findIndex(p => p.some(x => x.i === itemAtual)));
    return true;
  }

  // calcula as medidas em px: cada arquivo ocupa exatamente o seu retângulo
  function dimensionar() {
    const tela = !!document.fullscreenElement;
    const L = palco.clientWidth;
    const teto = tela ? innerHeight : Math.min(innerHeight * (L < 700 ? 0.72 : 0.8), 1100);
    const precisa = p => (L - GAP * (p.length - 1)) / p.reduce((s, x) => s + x.a, 0);
    const H = tela ? teto : Math.min(teto, Math.max(...paginas.map(precisa)));
    alturas = paginas.map(p => Math.min(H, precisa(p)));
    // tela estreita: o palco acompanha a altura de cada arquivo (sem sobra em cima/embaixo)
    acompanha = !tela && L < 700;
    palco.style.height = `${Math.round(acompanha ? alturas[atual] : H)}px`;
    $$(".slide", trilho).forEach((sl, k) => {
      const h = alturas[k];
      $$(".peca", sl).forEach((el, j) => {
        el.style.width = `${Math.floor(paginas[k][j].a * h)}px`;
        el.style.height = `${Math.floor(h)}px`;
      });
    });
  }

  const carregar = k => $$(".slide", trilho)[k]?.querySelectorAll("[data-src]").forEach(el => { el.src = el.dataset.src; el.removeAttribute("data-src"); });

  function ir(k, suave = true) {
    const total = paginas.length;
    atual = Math.max(0, Math.min(total - 1, k));
    trilho.style.transition = suave ? "" : "none";
    trilho.style.transform = `translateX(${-atual * 100}%)`;
    if (acompanha) { palco.style.transition = suave ? "" : "none"; palco.style.height = `${Math.round(alturas[atual])}px`; }
    [atual, atual + 1, atual - 1].forEach(carregar);
    $$(".slide", trilho).forEach((s, j) => { if (j !== atual) s.querySelectorAll("video").forEach(v => v.pause()); });
    $(".apres__conta", raiz).textContent = `${pad(atual + 1)} / ${pad(total)}`;
    $(".apres__progresso i", raiz).style.width = `${(atual + 1) / total * 100}%`;
    btAnt.disabled = atual === 0; btProx.disabled = atual === total - 1;
    const minis = $$(".mini", raiz);
    minis.forEach((m, j) => m.classList.toggle("ativo", j === atual));
    const m = minis[atual];
    if (m) miniaturas.scrollTo({ left: m.offsetLeft - miniaturas.clientWidth / 2 + m.clientWidth / 2, behavior: suave ? "smooth" : "auto" });
  }

  btAnt.onclick = () => ir(atual - 1);
  btProx.onclick = () => ir(atual + 1);
  const tela = $(".apres__tela", raiz);
  if (tela) tela.onclick = () => palco.requestFullscreen();
  $(".apres__fechar", raiz).onclick = () => document.exitFullscreen();

  // tamanho da janela mudou (ou entrou/saiu da tela cheia) → refaz as medidas
  let pedido = 0;
  const refazer = () => { if (pedido) return; pedido = requestAnimationFrame(() => { pedido = 0; if (!raiz.isConnected) return; const novo = construir(); dimensionar(); ir(atual, false); }); };
  addEventListener("resize", refazer);
  document.addEventListener("fullscreenchange", refazer);
  limpar.push(() => { removeEventListener("resize", refazer); document.removeEventListener("fullscreenchange", refazer); });

  // teclado: só quando a apresentação está visível
  const teclado = e => {
    if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    const r = palco.getBoundingClientRect();
    if (!document.fullscreenElement && (r.bottom < 0 || r.top > innerHeight)) return;
    if (e.key === "ArrowRight") { ir(atual + 1); e.preventDefault(); }
    if (e.key === "ArrowLeft") { ir(atual - 1); e.preventDefault(); }
  };
  document.addEventListener("keydown", teclado);
  limpar.push(() => document.removeEventListener("keydown", teclado));

  // arrastar (toque)
  let x0 = null, y0 = 0, dx = 0, horizontal = null;
  palco.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; horizontal = null; }, { passive: true });
  palco.addEventListener("touchmove", e => {
    if (x0 === null) return;
    dx = e.touches[0].clientX - x0;
    const dy = e.touches[0].clientY - y0;
    if (horizontal === null && Math.abs(dx) + Math.abs(dy) > 8) horizontal = Math.abs(dx) > Math.abs(dy);
    if (!horizontal) return;
    const resistencia = (atual === 0 && dx > 0) || (atual === paginas.length - 1 && dx < 0) ? 0.3 : 1;
    trilho.style.transition = "none";
    trilho.style.transform = `translateX(calc(${-atual * 100}% + ${dx * resistencia}px))`;
  }, { passive: true });
  palco.addEventListener("touchend", () => {
    if (horizontal) ir(atual + (dx < -50 ? 1 : dx > 50 ? -1 : 0));
    x0 = null;
  });

  construir(); dimensionar(); ir(0, false);
  if (paginas.length < 2) palco.classList.add("unica");
}

/* ==========================================================
   A LINHA DO TOPO — um sinal de FM visto num osciloscópio.

       y(t) = sin( 2π·fc·t + β·sin(2π·fm·t) )

   fc = portadora, fm = moduladora, β = índice de modulação.
   O "trigger" está preso na moduladora, então o traço fica parado
   como na tela de um osciloscópio: a portadora se comprime onde a
   frequência instantânea sobe (fc + β·fm) e se abre onde ela desce.
   β varia devagar, como alguém girando o knob, e o rastro de
   fósforo deixa um eco esmaecido de cada varredura.
   ========================================================== */
function onda() {
  const cv = $(".corda"), ctx = cv.getContext("2d");
  const calma = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PAPEL = "243, 242, 238", TINTA = "#111110", SINAL = "#ff3d00";
  const CICLOS_MOD = 3;            // ciclos da moduladora visíveis na tela
  let W, H, dpr, fc, fm, t0 = performance.now();

  function medir() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    // frequências em "ciclos por tela": portadora com ~34 px de comprimento de onda
    fm = W < 700 ? 1 : CICLOS_MOD;
    fc = Math.max(8, Math.round(W / 34));
  }

  function varredura(tempo, alfa) {
    // knob: β em fração de fc/fm (acima de 1 a frequência instantânea ficaria negativa)
    const k = 0.17 + 0.9 * Math.sin(tempo * 0.99) + 0.14 * Math.sin(tempo * 0.83);  // ≈ 0,06 … 0,62
    const beta = k * fc / fm;
    const deriva = tempo * 0.7;                                                       // trigger quase travado
    const amp = H * 0.3, passos = Math.ceil(W / 0.5);
    let pico = null, melhor = -7;
    ctx.beginPath();
    for (let i = 0; i <= passos; i++) {
      const u = i / passos;                            // 0..1 = largura da tela (base de tempo)
      const fase = 2 * Math.PI * fm * u + deriva;
      const y = Math.sin(2 * Math.PI * fc * u + beta * Math.sin(fase));
      const borda = Math.min(1, u / 0.03, (1 - u) / 0.03);  // o traço pousa na linha nas pontas
      const x = u * W, yy = H / 2 - y * amp * borda;
      i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
      // marca onde a frequência instantânea é máxima (cos da moduladora = 1), num pico da portadora
      if (u > 0.5 && u < 0.97 && Math.cos(fase) > 0.9 && y > melhor) { melhor = y; pico = [x, yy]; }
    }
    ctx.lineWidth = 1.25; ctx.strokeStyle = `rgba(17, 17, 16, ${alfa})`; ctx.stroke();
   
    return pico;
  }

  function quadro(agora) {
    const tempo = (agora - t0) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // apaga o quadro anterior por completo: só a linha atual, sem rastro
    // (para voltar o efeito de fósforo, troque por: ctx.fillStyle = `rgba(${PAPEL}, 0.28)`; ctx.fillRect(0, 0, W, H);)
    ctx.clearRect(0, 0, W, H);
    varredura(tempo, 1);   // só a linha preta, sem marcador
    if (!calma) requestAnimationFrame(quadro);
  }

  medir();
  addEventListener("resize", () => { if (cv.clientWidth !== W) { medir(); if (calma) quadro(performance.now()); } });
  requestAnimationFrame(quadro);
}

/* ==========================================================
   ROTEADOR (endereços com #, funcionam no GitHub Pages sem configuração)
   #/                         → Arte e Tecnologia
   #/audiovisual/som          → seção + categoria
   #/p/2026-casa-chandon      → página do projeto (nome da pasta)
   #/sobre
   ========================================================== */
let rotaAnterior = location.hash;
function rotear() {
  rolagem[rotaAnterior] = scrollY;
  limpar.forEach(f => f()); limpar = [];

  const partes = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  let secAtiva = null, restaurar = false;

  if (!partes.length) { paginaLista(SECAO_INICIAL); secAtiva = SECAO_INICIAL; restaurar = true; }
  else if (SECOES[partes[0]]) {
    paginaLista(partes[0]); secAtiva = partes[0]; restaurar = true;   // links antigos #/secao/categoria caem aqui
  }
  else if (partes[0] === "p" && partes[1]) { paginaProjeto(partes[1]); secAtiva = PROJETOS.find(p => p.id === partes[1])?.secao; }
  else if (partes[0] === "sobre") { paginaSobre(); secAtiva = "sobre"; }
  else paginaNaoEncontrada();

  $$(".menu a").forEach(a => a.classList.toggle("ativo", a.dataset.secao === secAtiva));
  scrollTo({ top: restaurar && rolagem[location.hash] || 0, behavior: "instant" });
  rotaAnterior = location.hash;
}

/* ---------- partida ---------- */
$("#ano").textContent = new Date().getFullYear();
history.scrollRestoration = "manual";
onda();
fetch("data/projetos.json", { cache: "no-cache" })
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(d => { PROJETOS = d.projetos || []; SOBRE = d.sobre || {}; prepararNomes(d.nomes); })
  .catch(err => {
    console.error(err);
    app.innerHTML = `<section class="pagina"><p class="vazio-msg">Não consegui ler data/projetos.json. Rode <code>python3 gerar.py</code> e abra o site por um servidor (veja o README).</p></section>`;
  })
  .finally(() => { if (PROJETOS.length) { addEventListener("hashchange", rotear); rotear(); } });

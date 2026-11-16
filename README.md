# Site — Guilherme Fiorentini

Site estático (HTML, CSS e JS puros), feito para o GitHub Pages. Funciona no computador e no celular.

```
index.html          página única (o "Sobre" está aqui, dentro de <template id="tpl-sobre">)
css/style.css       visual
js/app.js           grade, filtros, página de projeto, apresentação e a linha do topo
gerar.py            lê a pasta /projetos e escreve data/projetos.json
data/projetos.json  gerado automaticamente — não precisa editar
projetos/           AQUI ficam seus projetos (fotos, vídeos e textos)
.github/workflows/  publica o site sozinho a cada push
```

## Como adicionar ou editar um projeto

Cada projeto é uma pasta:

```
projetos/<seção>/<categoria>/<projeto>/
```

Seções e categorias já criadas:

| seção | categorias |
|---|---|
| `arte-tecnologia` | `marcas-eventos` · `arte` · `produtos` · `projetos-pessoais` |
| `audiovisual` | `coordenacao-audiovisual` · `som` · `producao-virtual` · `video` |

Dentro da pasta do projeto:

```
2026-casa-chandon/
  info.txt     título, ano, função, links e texto
  01.jpg       ← MINIATURA: aparece só na grade de projetos
  02.jpg       ← DESTAQUE: abre a página do projeto, inteira (foto ou vídeo)
  03.jpg       ← daqui pra baixo: APRESENTAÇÃO, na ordem dos nomes
  04.mp4       ← vídeos curtos também entram na apresentação
```

**A capa é a primeira foto em ordem de nome.** O Git não guarda a ordem em que você subiu os arquivos, por isso numere: `01.jpg`, `02.jpg`, `03.jpg`… Se quiser escolher a capa sem renumerar, chame a foto de `capa.jpg`.

Enquanto um projeto não tem foto, o site desenha uma capa própria para ele (uma figura de Lissajous ou uma forma de onda calculada a partir do nome da pasta).

### info.txt

```
titulo: Casa Chandon
ano: 2026
funcao: Desenvolvimento de hardware personalizado
local: São Paulo
cliente: Chandon
link: Exame | https://exame.com/...
link: Live Marketing | https://...
video: https://vimeo.com/123456789
ordem: 1
---
Primeiro parágrafo do texto.

Segundo parágrafo.

- linhas com hífen viram lista
- **negrito** também funciona
```

- Linhas começando com `#` são ignoradas (use para deixar anotações).
- `video:` aceita YouTube ou Vimeo e pode se repetir. Esses vídeos aparecem **em destaque**, logo abaixo do texto, antes da apresentação de fotos.
- Vídeo vertical (9:16): escreva `video: https://... | vertical`. Links de Shorts do YouTube (`/shorts/`) já são entendidos como verticais. Vários verticais ficam lado a lado.
- Apresentação: cada foto/vídeo aparece no tamanho exato da sua proporção, sem faixas pretas. No computador, dois arquivos verticais **seguidos** (ex.: `04.jpg` e `05.mp4`) dividem a mesma tela; um vertical sozinho fica centralizado. No celular, um por vez, e o quadro acompanha a altura de cada arquivo. **Para vídeos longos, use YouTube/Vimeo** — o GitHub não aceita arquivos acima de 100 MB.
- `ordem:` é opcional. Por padrão a grade vai do mais recente ao mais antigo.
- Pastas que começam com `_` são ignoradas (veja `projetos/arte-tecnologia/projetos-pessoais/_modelo-de-projeto`, que serve de modelo).
- O nome da pasta vira o endereço: `seusite.com/#/p/2026-casa-chandon`. Não repita nomes.

### Fotos

Pode subir as fotos originais: no GitHub, o `gerar.py` cria versões leves (`.webp`, até 2000 px) para o site carregar rápido. Aceita jpg, png, webp, gif e avif; vídeos mp4, webm e mov.

### Nova categoria

Basta criar a pasta. Para dar um nome bonito no menu de filtros, adicione em `SECOES` no começo de `js/app.js`.

## Publicar no GitHub (uma vez só)

1. Crie um repositório no GitHub (ex.: `site`) e suba **todo o conteúdo desta pasta**, incluindo as pastas ocultas `.github` e o arquivo `.nojekyll`.
   ```
   git init
   git add .
   git commit -m "site"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/site.git
   git push -u origin main
   ```
2. No repositório: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Vá em **Actions**, espere o "Publicar site" ficar verde (~1 min). O site estará em `https://SEU_USUARIO.github.io/site/`.

Depois disso, todo `git push` (ou upload pelo site do GitHub na branch `main`) republica sozinho.

## Apontar o seu domínio

1. **Settings → Pages → Custom domain**: digite o domínio (ex.: `guilhermefiorentini.com`) e salve. Marque **Enforce HTTPS** quando liberar.
2. No painel onde o domínio está registrado (Registro.br, GoDaddy, Hostinger…), configure o DNS:

   | tipo | nome | valor |
   |---|---|---|
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | CNAME | www | SEU_USUARIO.github.io |

   Apague registros A/CNAME antigos que apontem para outro lugar. A propagação pode levar algumas horas.

## Ver no seu computador antes de publicar (VS Code)

1. Instale o **Python** (python.org; no Windows, marque *"Add Python to PATH"*) e, no terminal, `pip install pillow` (opcional).
2. No VS Code: **Arquivo → Abrir Pasta…** e escolha esta pasta. Aceite instalar as extensões recomendadas (**Live Server**).
3. Na primeira vez, o VS Code pergunta se pode rodar tarefas automáticas da pasta: **Permitir**. A tarefa *Observar pasta projetos* fica ligada e regera o site sempre que você mexe em `/projetos`.
4. Clique em **Go Live** (canto inferior direito) ou botão direito no `index.html` → **Open with Live Server**. O navegador abre em `http://127.0.0.1:5500`.

Pronto: salvou um `.css`/`.js`/`.html` ou colocou foto nova numa pasta → a página recarrega sozinha.

Sem VS Code: `python3 gerar.py` e depois `python3 -m http.server 8000` → `http://localhost:8000`.

(Abrir o `index.html` com duplo clique não funciona: o navegador bloqueia a leitura do `data/projetos.json` fora de um servidor.)

## Detalhes

- Bordas retas em tudo (`border-radius: 0` global).
- A linha no topo é um sinal de FM, `sin(2π·fc·t + β·sin(2π·fm·t))`, desenhado como na tela de um osciloscópio, com rastro de fósforo. O índice β varia devagar. Ajustes em `onda()` no `js/app.js`.
- Apresentação: setas, teclado (← →), arrastar no celular, miniaturas e tela cheia.
- Cores e fontes ficam nas variáveis do começo de `css/style.css`.

## Ficha do projeto: clientes, agência e créditos

No `info.txt`:

```
cliente: Melissa · Allesblau
agencia: Hood
credito: Artista desenvolvedor | Leston     ← pode repetir a linha
fomento: ProAC
```

Os nomes que estiverem em `projetos/nomes.txt` (`Nome | https://...`) viram link automaticamente na ficha.

## Ordem e projetos ocultos

`projetos/arte-tecnologia/ordem.txt` e `projetos/audiovisual/ordem.txt`: um nome de pasta por linha, na ordem do site.
Para **ocultar** um projeto, coloque `#` colado no nome (`#2019-visceral`). Tire o `#` para ele voltar.
As categorias (pastas `arte`, `som`...) continuam organizando os arquivos, mas não aparecem mais como abas no site.

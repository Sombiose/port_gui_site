#!/usr/bin/env python3
"""
gerar.py — lê a pasta /projetos e escreve data/projetos.json

Estrutura esperada:
    projetos/<secao>/<categoria>/<projeto>/
        info.txt          -> título, ano, texto, links (ver README)
        capa.jpg          -> (opcional) força a capa
        01.jpg            -> se não houver "capa", a 1ª imagem em ordem de nome vira a capa
        02.jpg, 03.mp4... -> o resto vira a apresentação, na ordem dos nomes

Rode localmente:  python3 gerar.py
No GitHub, o workflow em .github/workflows/publicar.yml roda isto sozinho a cada push.
"""
import json
import os
import re
import sys
from datetime import date

RAIZ = os.path.dirname(os.path.abspath(__file__))
PASTA = os.path.join(RAIZ, "projetos")
SAIDA = os.path.join(RAIZ, "data", "projetos.json")
PASTA_SOBRE = os.path.join(RAIZ, "sobre")

OTIM = os.path.join(RAIZ, "otimizadas")   # versões leves das fotos (geradas, não vão pro git)

try:  # Pillow é opcional: sem ele o site usa as fotos originais
    from PIL import Image, ImageOps
except ImportError:
    Image = None

IMAGENS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
VIDEOS = {".mp4", ".webm", ".mov", ".m4v"}


def ordem_natural(nome):
    """'2.jpg' antes de '10.jpg'."""
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", nome)]


def otimizar(rel, lado, sufixo):
    """Gera uma cópia .webp com no máximo `lado` px. Devolve o caminho relativo ou None."""
    if Image is None or rel.lower().endswith(".gif"):
        return None
    origem = os.path.join(RAIZ, rel)
    destino_rel = "otimizadas/" + os.path.splitext(rel)[0] + f"-{sufixo}.webp"
    destino = os.path.join(RAIZ, destino_rel)
    try:
        # a versão leve "carimba" a data exata do original; se o arquivo trocar
        # (inclusive renomeando outro para este nome), a data não bate e ela é refeita
        st = os.stat(origem)
        if os.path.exists(destino) and os.stat(destino).st_mtime_ns == st.st_mtime_ns:
            return destino_rel
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        with Image.open(origem) as im:
            im = ImageOps.exif_transpose(im)
            if im.mode not in ("RGB", "RGBA"):
                im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
            im.thumbnail((lado, lado), Image.LANCZOS)
            im.save(destino, "WEBP", quality=82, method=5)
        os.utime(destino, ns=(st.st_atime_ns, st.st_mtime_ns))
        return destino_rel
    except Exception as erro:
        print(f"AVISO: não consegui otimizar {rel}: {erro}")
        return None


def ler_info(caminho):
    """
    Formato do info.txt:
        titulo: Casa Chandon
        ano: 2026
        link: Exame | https://...
        video: https://youtube.com/...            (vídeo em destaque na página)
        video: https://vimeo.com/... | vertical   (vídeo vertical, 9:16)
        ---
        Texto livre. Parágrafos separados por linha em branco.
        - linhas com hífen viram lista
    Linhas começando com # são ignoradas.
    """
    dados = {"links": [], "videos": [], "texto": ""}
    if not os.path.exists(caminho):
        return dados
    with open(caminho, encoding="utf-8") as f:
        conteudo = f.read().replace("\r\n", "\n")
    if "\n---" in "\n" + conteudo:
        cabecalho, _, corpo = ("\n" + conteudo).partition("\n---")
        corpo = corpo.split("\n", 1)[1] if "\n" in corpo else ""
    else:
        cabecalho, corpo = conteudo, ""
    for linha in cabecalho.split("\n"):
        linha = linha.strip()
        if not linha or linha.startswith("#") or ":" not in linha:
            continue
        chave, valor = linha.split(":", 1)
        chave, valor = chave.strip().lower(), valor.strip()
        if not valor:
            continue
        if chave == "link":
            rotulo, _, url = valor.partition("|")
            url = url.strip().split(" ")[0]
            if not url:  # "link: https://..." sem rótulo
                url, rotulo = rotulo.strip().split(" ")[0], ""
            if url.startswith("http"):
                dados["links"].append({"rotulo": rotulo.strip() or url, "url": url})
        elif chave == "credito":
            # credito: Artista desenvolvedor | Leston   (pode repetir a linha)
            rotulo, _, nome = valor.partition("|")
            if nome.strip():
                dados.setdefault("creditos", []).append({"rotulo": rotulo.strip(), "nome": nome.strip()})
        elif chave == "video":
            # video: https://...            → horizontal
            # video: https://... | vertical → vertical (9:16). Links /shorts/ do YouTube já são verticais.
            url, _, resto = valor.partition("|")
            url = url.split()[0] if url.split() else ""
            if url.startswith("http"):
                vertical = "vertical" in resto.lower() or "/shorts/" in url
                dados["videos"].append({"src": url, "vertical": vertical})
        else:
            dados[chave] = valor
    linhas = [l for l in corpo.split("\n") if not l.lstrip().startswith("#")]
    dados["texto"] = "\n".join(linhas).strip()
    return dados


def ler_nomes():
    """projetos/nomes.txt: 'Nome | https://...' por linha. Onde esse nome aparecer na ficha
    de um projeto (cliente, agência, créditos...), o site transforma em link."""
    arq = os.path.join(PASTA, "nomes.txt")
    nomes = {}
    if os.path.isfile(arq):
        with open(arq, encoding="utf-8") as f:
            for l in f:
                l = l.strip()
                if l.startswith("#") or "|" not in l:
                    continue
                nome, _, url = l.partition("|")
                url = url.strip().split(" ")[0]
                if nome.strip() and url.startswith("http"):
                    nomes[nome.strip()] = url
    return nomes


def ano_fim(ano):
    """'2019 – 2024' -> 2024 ; '2020 – atual' -> ano corrente ; usado para ordenar."""
    if not ano:
        return 0
    if re.search(r"atual|hoje|presente", ano, re.I):
        return date.today().year
    anos = re.findall(r"\d{4}", ano)
    return int(anos[-1]) if anos else 0


def main():
    projetos, vistos, avisos = [], {}, []
    if not os.path.isdir(PASTA):
        sys.exit("Pasta 'projetos' não encontrada.")

    for secao in sorted(os.listdir(PASTA)):
        dir_secao = os.path.join(PASTA, secao)
        if not os.path.isdir(dir_secao) or secao.startswith((".", "_")):
            continue
        for categoria in sorted(os.listdir(dir_secao)):
            dir_cat = os.path.join(dir_secao, categoria)
            if not os.path.isdir(dir_cat) or categoria.startswith((".", "_")):
                continue
            for slug in sorted(os.listdir(dir_cat)):
                dir_proj = os.path.join(dir_cat, slug)
                if not os.path.isdir(dir_proj) or slug.startswith((".", "_")):
                    continue

                info = ler_info(os.path.join(dir_proj, "info.txt"))
                arquivos = sorted(
                    (a for a in os.listdir(dir_proj) if not a.startswith(".")),
                    key=ordem_natural,
                )
                rel = lambda a: "/".join(["projetos", secao, categoria, slug, a])

                midias = []
                for a in arquivos:
                    ext = os.path.splitext(a)[1].lower()
                    if ext in IMAGENS:
                        midias.append({"tipo": "img", "src": rel(a)})
                    elif ext in VIDEOS:
                        midias.append({"tipo": "video", "src": rel(a)})

                # capa: arquivo "capa.*" ou a primeira imagem
                capa = next((m for m in midias if m["tipo"] == "img"
                             and os.path.splitext(os.path.basename(m["src"]))[0].lower() == "capa"), None)
                if capa is None:
                    capa = next((m for m in midias if m["tipo"] == "img"), None)
                if capa:
                    midias.remove(capa)

                # versões leves para a web (capa/slides) e miniaturas
                for m in midias:
                    if m["tipo"] == "img":
                        w = otimizar(m["src"], 2000, "web")
                        mi = otimizar(m["src"], 360, "mini")
                        if w: m["web"] = w
                        if mi: m["mini"] = mi
                capa_web = None
                if capa:
                    capa_web = otimizar(capa["src"], 2000, "web")

                # vídeos externos (YouTube/Vimeo) ficam em destaque, fora da apresentação
                videos = info.pop("videos")

                if slug in vistos:
                    avisos.append(f"slug repetido: '{slug}' em {vistos[slug]} e {secao}/{categoria}")
                vistos[slug] = f"{secao}/{categoria}"

                projetos.append({
                    "id": slug,
                    "secao": secao,
                    "categoria": categoria,
                    "titulo": info.pop("titulo", slug.replace("-", " ").title()),
                    "ano": info.get("ano", ""),
                    "anoFim": ano_fim(info.get("ano", "")),
                    "ordem": int(info.pop("ordem")) if str(info.get("ordem", "")).isdigit() else 999,
                    "capa": capa["src"] if capa else None,
                    "capaWeb": capa_web,
                    "videos": videos,
                    "midias": midias,
                    **{k: v for k, v in info.items() if k not in ("ano", "ordem")},
                })

    # ordem.txt (opcional) dentro da pasta de uma seção: um projeto (nome da pasta) por linha,
    # na ordem em que devem aparecer. Projetos fora da lista vão para o fim, pela regra normal.
    listas, ocultos = {}, set()
    for secao in os.listdir(PASTA):
        arq = os.path.join(PASTA, secao, "ordem.txt")
        if os.path.isfile(arq):
            existentes = {p["id"] for p in projetos if p["secao"] == secao}
            nomes = []
            with open(arq, encoding="utf-8") as f:
                for l in f:
                    l = l.strip()
                    if not l:
                        continue
                    if l.startswith("#"):
                        # "#nome-da-pasta" → projeto OCULTO; qualquer outro "#..." é só comentário
                        n = l.lstrip("#").strip()
                        if n in existentes:
                            ocultos.add((secao, n))
                        continue
                    nomes.append(l)
            listas[secao] = {n: i for i, n in enumerate(nomes)}
            for n in nomes:
                if n not in existentes:
                    avisos.append(f"ordem.txt de '{secao}' cita '{n}', que não existe")
            for n in sorted(existentes - set(nomes) - {o for s, o in ocultos if s == secao}):
                avisos.append(f"'{n}' não está no ordem.txt de '{secao}' (aparece no fim)")

    def chave(p):
        lista = listas.get(p["secao"])
        if lista is not None and p["id"] in lista:
            return (0, lista[p["id"]], 0, "")
        return (1, p["ordem"], -p["anoFim"], p["titulo"].lower())

    projetos = [p for p in projetos if (p["secao"], p["id"]) not in ocultos]
    projetos.sort(key=chave)

    # foto da página Sobre: a primeira imagem da pasta /sobre
    sobre = {}
    if os.path.isdir(PASTA_SOBRE):
        fotos = sorted((a for a in os.listdir(PASTA_SOBRE)
                        if os.path.splitext(a)[1].lower() in IMAGENS and not a.startswith(".")), key=ordem_natural)
        if fotos:
            sobre["foto"] = "sobre/" + fotos[0]
            web = otimizar(sobre["foto"], 2400, "tela")
            if web:
                sobre["fotoWeb"] = web

    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as f:
        json.dump({"gerado": date.today().isoformat(), "sobre": sobre, "nomes": ler_nomes(),
                   "projetos": projetos}, f,
                  ensure_ascii=False, indent=1)

    if Image is None:
        print("(Pillow não instalado: usando fotos originais. 'pip install pillow' para gerar versões leves.)")
    for a in avisos:
        print("AVISO:", a)
    print(f"{len(projetos)} projetos -> data/projetos.json")


def assinatura():
    """Retrato da pasta /projetos: muda sempre que um arquivo é criado, apagado ou editado."""
    itens = []
    for raiz, pastas, arquivos in (x for p in (PASTA, PASTA_SOBRE) for x in os.walk(p)):
        for a in arquivos:
            try:
                c = os.path.join(raiz, a)
                itens.append((c, os.path.getmtime(c), os.path.getsize(c)))
            except OSError:
                pass
    return hash(tuple(sorted(itens)))


def observar():
    """Modo 'observar': fica de olho na pasta /projetos e regera o site a cada mudança."""
    import time
    print("Observando as pastas 'projetos' e 'sobre'... (Ctrl+C para parar)")
    ultima = None
    proprio = os.path.abspath(__file__)
    versao = os.path.getmtime(proprio)
    gerar = main
    while True:
        # o próprio gerar.py mudou (atualização) → recarrega o código novo e regera
        try:
            if os.path.getmtime(proprio) != versao:
                time.sleep(0.5)
                versao = os.path.getmtime(proprio)
                ns = {"__file__": proprio, "__name__": "gerar_atualizado"}
                with open(proprio, encoding="utf-8") as f:
                    exec(compile(f.read(), proprio, "exec"), ns)
                gerar = ns["main"]
                ultima = None
                print("gerar.py foi atualizado: usando o código novo.", flush=True)
        except Exception as erro:
            print("AVISO: não consegui recarregar o gerar.py:", erro, flush=True)
        atual = assinatura()
        if atual != ultima:
            if ultima is not None:
                time.sleep(0.8)  # espera terminar de copiar fotos grandes
                atual = assinatura()
            print(time.strftime("[%H:%M:%S] "), end="", flush=True)
            gerar()
            ultima = atual
        time.sleep(1)


if __name__ == "__main__":
    if "--observar" in sys.argv:
        try:
            observar()
        except KeyboardInterrupt:
            print("\nparado.")
    else:
        main()

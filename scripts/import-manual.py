#!/usr/bin/env python3
"""Importa el texto de TU copia del manual para consultarlo dentro de Foundry (pestaña «Reglas → El libro»).

El PDF del libro está formado por imágenes (sin capa de texto), así que se pasa por OCR en tu máquina:
  1. pdftoppm convierte cada página en una imagen,
  2. tesseract (idioma español) la lee,
  3. el resultado queda en assets/manual/libro.json.

Nada de esto sale de tu ordenador. El archivo generado está en .gitignore: es contenido con copyright de la
editorial y no debe publicarse. Si el repositorio es privado y solo para ti, puedes quitar esa línea de .gitignore.

Requisitos (macOS):  brew install poppler tesseract tesseract-lang
Uso:  python3 scripts/import-manual.py <manual.pdf> [--desde 3] [--hasta 16] [--lang spa]
"""
import argparse, json, shutil, subprocess, sys, tempfile
from pathlib import Path


def need(cmd, hint):
    if not shutil.which(cmd):
        sys.exit(f"Falta «{cmd}». {hint}")


def limpia(texto):
    """Une las líneas partidas de un mismo párrafo y respeta las líneas en blanco."""
    parrafos, actual = [], []
    for linea in texto.splitlines():
        linea = linea.rstrip()
        if not linea.strip():
            if actual: parrafos.append(" ".join(actual)); actual = []
        elif linea.endswith("-") and not linea.endswith(" -"):
            actual.append(linea[:-1].rstrip() + "⁠")   # guion de partición de palabra
        else:
            actual.append(linea.strip())
    if actual: parrafos.append(" ".join(actual))
    return "\n\n".join(p.replace("⁠ ", "").replace("⁠", "") for p in parrafos)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdf"); ap.add_argument("--desde", type=int, default=1); ap.add_argument("--hasta", type=int, default=0)
    ap.add_argument("--lang", default="spa"); ap.add_argument("--titulo", default="Bruja")
    a = ap.parse_args()
    pdf = Path(a.pdf).expanduser()
    if not pdf.exists(): sys.exit(f"No existe {pdf}")
    need("pdftoppm", "Instala poppler: brew install poppler"); need("tesseract", "Instala tesseract: brew install tesseract tesseract-lang")
    langs = subprocess.run(["tesseract", "--list-langs"], capture_output=True, text=True).stdout
    if a.lang not in langs.split(): sys.exit(f"tesseract no tiene el idioma «{a.lang}». Instala: brew install tesseract-lang")
    out = Path(__file__).resolve().parent.parent / "assets" / "manual" / "libro.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    pages = []
    with tempfile.TemporaryDirectory() as tmp:
        cmd = ["pdftoppm", "-r", "200", "-png"] + (["-f", str(a.desde)] if a.desde > 1 else []) + (["-l", str(a.hasta)] if a.hasta else []) + [str(pdf), f"{tmp}/p"]
        subprocess.run(cmd, check=True)
        for img in sorted(Path(tmp).glob("p-*.png")):
            n = int(img.stem.split("-")[-1])
            texto = subprocess.run(["tesseract", str(img), "-", "-l", a.lang, "--psm", "4"], capture_output=True, text=True).stdout
            texto = limpia(texto)
            if len(texto) > 40:
                pages.append({"n": n, "text": texto}); print(f"página {n}: {len(texto)} caracteres")
    out.write_text(json.dumps({"title": a.titulo, "source": pdf.name, "pages": pages}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"✓ {len(pages)} páginas en {out}")


if __name__ == "__main__":
    main()

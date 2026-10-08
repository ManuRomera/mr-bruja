#!/usr/bin/env python3
"""Importa el arte de MR-Bruja-Arte.zip (ya descomprimido): recorre la carpeta de forma recursiva,
toma el nombre del archivo como clave, recorta al encuadre y guarda WebP en assets/art/.

Uso:  python3 scripts/import-art.py <carpeta-con-las-imagenes> [carpeta-de-salida]
Requiere Pillow con soporte WebP.

Salida por carpeta del ZIP:
  01-marca -> brand/    02-lugares -> places/   03-ambientes -> moods/   04-cartas -> cards/
  05-objetos -> objects/ (tinta con alfa)   06-texturas -> textures/   07-extras -> extras/ (tinta con alfa; el sello de cera conserva su color)
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

CARPETAS = {"01-marca": "brand", "02-lugares": "places", "03-ambientes": "moods", "04-cartas": "cards",
            "05-objetos": "objects", "06-texturas": "textures", "07-extras": "extras"}


def crop_ratio(im, w, h):
    """Recorte centrado a la proporción w:h y reducción a w x h."""
    r = w / h
    iw, ih = im.size
    if iw / ih > r:
        nw = round(ih * r)
        im = im.crop(((iw - nw) // 2, 0, (iw - nw) // 2 + nw, ih))
    else:
        nh = round(iw / r)
        im = im.crop((0, (ih - nh) // 2, iw, (ih - nh) // 2 + nh))
    return im.resize((w, h), Image.LANCZOS)


def tinta(im, max_side):
    """Tinta negra con alfa a partir de la luminosidad; el blanco queda transparente. Recorta al contenido."""
    g = im.convert("L")
    alfa = g.point(lambda v: 0 if v >= 238 else round(255 * (238 - v) / 238))
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.putalpha(alfa)
    caja = alfa.point(lambda v: 255 if v > 14 else 0).getbbox()
    if caja:
        m = 10
        out = out.crop((max(0, caja[0] - m), max(0, caja[1] - m), min(out.width, caja[2] + m), min(out.height, caja[3] + m)))
    out.thumbnail((max_side, max_side), Image.LANCZOS)
    return out


def sello(im, max_side):
    """Color conservado: se vacía el fondo blanco desde las esquinas (los blancos interiores se respetan)."""
    rgb = im.convert("RGB")
    marca = (255, 0, 255)
    for esquina in ((0, 0), (rgb.width - 1, 0), (0, rgb.height - 1), (rgb.width - 1, rgb.height - 1)):
        ImageDraw.floodfill(rgb, esquina, marca, thresh=38)
    rgba = rgb.convert("RGBA")
    rgba.putdata([(r, g, b, 0) if (r, g, b) == marca else (r, g, b, 255) for r, g, b, _ in rgba.getdata()])
    caja = rgba.getchannel("A").getbbox()
    if caja:
        rgba = rgba.crop(caja)
    rgba.thumbnail((max_side, max_side), Image.LANCZOS)
    return rgba


def procesa(ruta):
    clave, carpeta = ruta.stem, CARPETAS.get(ruta.parent.name, "extras")
    im = Image.open(ruta)
    q = 82
    if carpeta == "objects" or (carpeta == "extras" and clave != "sello-cera"):
        out, q = tinta(im, 640), 90
    elif clave == "sello-cera":
        out, q = sello(im, 512), 92
    else:
        im = im.convert("RGB")
        if clave == "grimorio-header":
            out = crop_ratio(im, 2400, 700)
        elif carpeta == "cards":
            out = crop_ratio(im, 700, 1200)
        elif carpeta in ("places", "moods") or clave == "cover":
            out = crop_ratio(im, 1920, 1080)
        elif carpeta == "textures":
            out = im.resize((1024, 1024), Image.LANCZOS)
            q = 80
        elif clave == "logo":
            out = im.resize((768, 768), Image.LANCZOS)
        else:  # retratos
            out = im.resize((800, round(800 * im.height / im.width)), Image.LANCZOS)
    return clave, carpeta, out, q


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    entrada = Path(sys.argv[1])
    salida = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent / "assets" / "art"
    n = total = 0
    for ruta in sorted(entrada.rglob("*.png")):
        if ruta.stem == "style-ref":
            continue
        clave, carpeta, out, q = procesa(ruta)
        (salida / carpeta).mkdir(parents=True, exist_ok=True)
        final = salida / carpeta / f"{clave}.webp"
        out.save(final, "WEBP", quality=q, method=6)
        kb = final.stat().st_size // 1024
        total += kb
        print(f"{carpeta}/{clave}.webp  {out.width}x{out.height}  {kb} KB")
        n += 1
    print(f"{n} imágenes importadas en {salida} ({total // 1024} MB)")


if __name__ == "__main__":
    main()

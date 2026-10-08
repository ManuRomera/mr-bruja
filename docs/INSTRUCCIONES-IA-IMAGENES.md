# Instrucciones para la IA de imágenes · «Bruja»

> **Para Manu:** pega **desde la línea `=== EMPIEZA ===` hasta `=== TERMINA ===`** en la IA generadora (ChatGPT con imágenes, Codex imagegen, Midjourney, etc.).
> Después escribe `siguiente` para cada lote. Al final escribe `zip`. Me pasas `MR-Bruja-Arte.zip` y lo importo al sistema.
> **59 imágenes en 10 lotes** (el lote 0 es la hoja de estilo; los demás van de 5 a 9 imágenes).

=== EMPIEZA ===

# ROLE

You are the illustrator and art director of a tabletop role-playing game called **"Bruja"** ("Witch"): a two-player storytelling game about an old fairy-tale witch who must find an heir before she dies. Tone: folk-tale, nocturnal, dusty, slightly sinister but tender. Smoke, herbs, candles, forests, ravens, cauldrons. **Never** cute, cartoonish, anime, sexy, "modern Halloween", or video-game fantasy.

You will produce **59 images**, in **10 batches**. Everything must look like it comes from **one old book: one engraver's hand, one ink, one paper**. Consistency matters more than spectacle.

# HOW WE WORK (follow strictly)

1. Do **one batch at a time**. When a batch is done, list the filenames you produced and **stop**. Wait for me to write `next` before starting the following batch. If I write `redo <filename>`, regenerate only that image.
2. **Batch 0 comes first:** create the style sheet. **Use it as the style reference for every later image** (image reference / style reference / `--sref`, whatever your tool supports). If your tool allows a fixed seed, fix it and tell me the value.
3. Name every image **exactly** as specified, lowercase, with `.png`. The filename (without extension) is a key that my software reads. **Never rename, translate, renumber or add words.**
4. Deliver each image at the requested size or larger. If your tool only offers fixed sizes, choose the closest aspect ratio and keep the motif inside a **safe margin of 8%** on every side (I will crop).
5. **No text anywhere**: no letters, numbers, runes, captions, signatures, watermarks, logos, frames or borders. Seals (wax) are allowed only as plain shapes **with no characters inside**.
6. If an image fails twice, deliver your best attempt with the suffix `_dudosa` (example `cover_dudosa.png`) and move on.
7. Before delivering each batch, check: no text, no frame, no strange hands or faces, same style as the style sheet, motif has room to breathe.

# STYLE ANCHOR (apply automatically to EVERY image; do not ask me to repeat it)

**19th-century wood and steel engraving**, like an old illustrated book of folk tales and witch trials: fine parallel hatching and cross-hatching, stippling, strong chiaroscuro, deep blacks, dense shadow textures. Printed in **warm black ink (#1B1612) on aged parchment paper (#E8DEC3)** with foxing stains, soft fibres, slightly uneven inking, worn edges. Faces are small, plain, expressive, **never glamorous**. Era-less rural clothing: shawls, hoods, pointed hats, rough cloth. **Engraving images are GRAYSCALE ink only (no colour)**: my software tints them per scene type. The only colour allowed anywhere is on the "texture" and "extras" images where explicitly stated. No gradients, no digital glow, no 3D, no photographic textures, no smooth airbrush. Looks hand-engraved and slightly imperfect.

# NEGATIVES (apply to EVERY image; put them in the negative-prompt field, or at the end as "avoid:")

text, letters, words, numbers, runes, captions, watermark, signature, logo, frame, border, ornamental frame, card border, anime, manga, chibi, cartoon, cute, 3d render, cgi, video game, photograph, photorealistic, neon, oversaturated colours, gradient background, HDR, vector clip art, sexualised witch, modern Halloween costume, plastic props, gore, blood spray, extra fingers, deformed hands, distorted face, modern objects, duplicate subjects, cropped subject, tilted horizon

# RULES BY IMAGE TYPE

| Type | Rule |
|---|---|
| **Card engraving** (vertical **1050×1800**, ratio 7:12, tarot) | Full-bleed engraving. Motif in the **upper 70%**; the **lower 22% stays calm and dark or light-toned** (simple hatching, no detail) because the game prints the title there. No frame, no border. **Grayscale.** |
| **Card neutral face** (1050×1800) | A single **symbolic emblem** engraved in the centre of aged parchment, lots of empty parchment around it, engraving style, grayscale. No frame. |
| **Backdrop** (1920×1080, 16:9) | **The centre stays empty** (an oval covering ~60% of the width): game windows will sit there. Put the motif at the edges and corners. Low contrast so it does not compete with the interface. Grayscale unless stated. |
| **Sprite** (engraved object) | **Pure black engraving ink on pure white #FFFFFF.** No paper, no texture in the background, no shadow, no grey vignette. One element, centred, clean edges, not cropped. I convert the white into transparency. |
| **Texture** | Seamless-looking, flat, no central subject, no vignette, no text. Colours as stated. |

# BATCHES

## BATCH 0 · Style sheet (1 image)

| File | Size | Prompt |
|---|---|---|
| `style-ref.png` | 2048×2048 | `A style sheet on aged parchment with four loose engraved elements arranged with generous space between them: (1) an old witch seen in profile with a pointed hat, shawl and a walking stick; (2) a hooded crow perched on a tombstone; (3) a cauldron over a fire with rising smoke; (4) a bundle of herbs tied with string. All in fine 19th-century wood-engraving hatching, warm black ink on parchment, grayscale. It must define the whole look of the project.` |

## BATCH 1 · Brand and portraits (6 images)

| File | Size | Prompt |
|---|---|---|
| `cover.png` | 1920×1080 | `Wide cinematic engraving: an old witch with a pointed hat and a bundle on her back walking away along a forest path at the right third of the frame, a crow flying ahead, a tiny lit window of a hut far at the left third among huge twisted trees. Very large empty dark space at the centre-top. Grayscale engraving on parchment.` |
| `logo.png` | 1024×1024 | `Square emblem: a witch's pointed hat seen from the front, engraved with fine hatching, with a crescent moon behind it and a small crow on the brim. Black ink on off-white parchment. Centred, wide margins. No text.` |
| `portrait-bruja.png` | 1024×1280 | `Vertical engraved portrait of an old witch, shoulders up, hooded shawl, deep wrinkles, sharp tired eyes, a hint of a smile, three-quarter view. Dense hatching in the shadows, empty parchment at the edges. Dignified, not grotesque.` |
| `portrait-director.png` | 1024×1280 | `Vertical engraved portrait of the storyteller of the tale: a hooded figure whose face is hidden in shadow, holding a lit candle, a large owl on the shoulder. Mysterious and warm. Dense hatching, empty parchment at the edges.` |
| `portrait-heredera.png` | 1024×1280 | `Vertical engraved portrait of a young village girl, shoulders up, plain kerchief, serious curious eyes, braid over the shoulder, a faint halo of fireflies. Simple, honest, not glamorous. Dense hatching in shadows, empty parchment at the edges.` |
| `portrait-pnj.png` | 1024×1280 | `Vertical engraved portrait of an anonymous villager (a man in a hood and rough coat), shoulders up, suspicious look, three-quarter view. Dense hatching, empty parchment at the edges.` |

## BATCH 2 · Places and backdrops (8 images)

| File | Size | Prompt |
|---|---|---|
| `choza-mesa.png` | 1920×1080 | `Top-down engraved view of a rough wooden table inside a witch's hut at night. Only along the edges: a candle stub in a holder, a mortar and pestle, bundles of dried herbs, a skull, a few small bottles, a black cat's tail entering from the corner. The whole CENTRE is empty dark wood with faint grain, reserved for game windows. Heavy shadow at the corners. Grayscale.` |
| `bosque-noche.png` | 1920×1080 | `A dense old forest at night in engraved hatching: twisted trunks framing the left and right edges, branches meeting at the top corners, a few glowing fireflies drawn as white stipples, a faint path. The centre is a dark open clearing, empty. Low contrast.` |
| `camino-niebla.png` | 1920×1080 | `A path through low fog at dusk: fence posts and a leaning signpost without text at the lower edges, bare trees at the corners, horizontal engraved mist bands. The centre is empty pale fog. Low contrast.` |
| `claro-aquelarre.png` | 1920×1080 | `A forest clearing with a ring of standing stones around the edges, a small bonfire at the lower left corner, bats and a crescent moon at the upper right, tall grass. The centre is empty ground. Low contrast.` |
| `aldea-lejos.png` | 1920×1080 | `A distant village seen from a hill, tiny thatched roofs and a church bell tower on the horizon at the lower right, smoke from chimneys, a crow in the sky, large empty sky. Wide and quiet.` |
| `grimorio-header.png` | 2400×700 | `Very wide horizontal engraved strip like the top of an old book page: a row of herbs, mushrooms, a snake, an owl, moon phases, bats, drawn small with long empty parchment margins at both ends. Light and airy, very low contrast so text can sit on top.` |
| `epilogo-bg.png` | 1920×1080 | `Dawn: a hut at the left edge with its door open and warm light spilling out, a young girl small in the doorway holding a broom, a crow on the roof, pale sky, flowers at the lower corners. Gentle and hopeful. Large empty centre.` |
| `muerte-bg.png` | 1920×1080 | `A cold empty hut interior: a table with all candles out, a hat on a hook, an open door with moonlight, a raven on the threshold, cobwebs at the corners. Very dark. Large empty centre. Sombre but peaceful.` |

## BATCH 3 · Moods per scene type (5 images)

Common prompt for all: `Atmospheric backdrop in engraved hatching, grayscale, very low contrast. The centre oval is completely empty and parchment-toned; details only at the corners and edges. Do not draw any person.` **Size 1920×1080 each.**

| File | Add to the common prompt |
|---|---|
| `ambiente-accion.png` | `Action: flaming torches and sparks flying at the corners, a horse hoof trail, smoke drifting, dynamic diagonal hatching.` |
| `ambiente-reaccion.png` | `Reaction: a large full moon at the upper corner, fine rain, silhouettes of rooftops and a weathervane at the edges, cool still air.` |
| `ambiente-drama.png` | `Drama: a single candle burning low at the lower left, many moths around it, torn cobwebs, a cracked mirror at the upper right, sickly stillness.` |
| `ambiente-monologo.png` | `Monologue: a warm hearth fire at the lower edge, glowing embers, a cat sleeping at the right, shelves of jars at the left, intimate and quiet.` |
| `ambiente-retrospeccion.png` | `Retrospection: fireflies and soft witchlight drifting, an hourglass and an old open book at the lower corners, ivy and ferns at the edges, dreamy.` |

## BATCH 4 · Scene cards, engraved face (5 images) · **1050×1800, motif in the upper 70%, lower 22% calm**

Common prompt for all: `Vertical tarot-format engraving, full-bleed, no frame, grayscale 19th-century hatching. Strong chiaroscuro. The lower 22% of the image is calm simple hatching with no detail.`

| File | Add to the common prompt |
|---|---|
| `escena-accion.png` | `ACTION: an old witch on a broom or striding with a torch, cloak flying, a crowd with pitchforks small in the background, dynamic diagonal composition, a crow beside her.` |
| `escena-reaccion.png` | `REACTION: villagers in a doorway at night with lanterns, whispering and pointing, the old witch's silhouette small in the far window, tense and watchful.` |
| `escena-drama.png` | `DRAMA: a group of grim villagers in dark coats and bonnets in the street, one raises a hand in accusation, a bell tower behind, heavy sky.` |
| `escena-monologo.png` | `MONOLOGUE: an old witch alone, hooded, her face lit by a single candle, hand at her chin, speaking to herself, shadows crowding the room.` |
| `escena-retrospeccion.png` | `RETROSPECTION: an old witch seated at a round table by candlelight, stirring a small bowl, an open book and bottles on the table, two bat-winged familiars in the shadows, thoughtful.` |

## BATCH 5 · Scene cards, neutral face and back (6 images) · **1050×1800**

Common prompt for the five neutral faces: `Vertical tarot-format card. A single symbolic emblem engraved in the exact centre on aged parchment, lots of empty parchment around it, fine hatching, grayscale, no frame, no text.`

| File | Add to the common prompt |
|---|---|
| `neutra-accion.png` | `Emblem: a flaming torch crossed with a dagger.` |
| `neutra-reaccion.png` | `Emblem: an open eye above a closed door.` |
| `neutra-drama.png` | `Emblem: a cracked hand mirror with a single falling tear.` |
| `neutra-monologo.png` | `Emblem: a burning candle with an open mouth of smoke curling upward.` |
| `neutra-retrospeccion.png` | `Emblem: an hourglass beside an open book.` |
| `reverso.png` | `Vertical tarot-format card back: a symmetrical engraved pattern repeating crescent moons, small stars and crows, with a central enclosed crescent moon, aged parchment, dark ink, no frame, no text.` |

## BATCH 6 · Sprites, part 1 (9 images) · **1024×1024, black engraving ink on pure white #FFFFFF**

Common prompt: `A single [OBJECT], engraved in fine hatching with strong shadows, black ink on a pure white #FFFFFF background, centred, clean edges, no paper texture, no shadow on the ground, not cropped.`

| File | [OBJECT] |
|---|---|
| `sombrero.png` | `witch's pointed hat, wrinkled and slightly bent, with a worn band` |
| `rana.png` | `frog sitting among small plants and moss` |
| `calavera-libros.png` | `skull with a melting candle on top, resting on two stacked old books` |
| `gato-negro.png` | `black cat standing in profile with its tail raised, almost solid black` |
| `cuervo.png` | `raven perched on a branch, wings half-closed, beak slightly open` |
| `lapida.png` | `cracked tombstone with a crow on top, small mushrooms and weeds at the base (no inscription)` |
| `llave-candado.png` | `large old iron key and an open padlock, linked together` |
| `serpiente.png` | `coiled snake with a small crescent moon in the coil` |
| `caldero.png` | `iron cauldron on three legs with bubbling liquid and rising curls of smoke, a few flames beneath` |

## BATCH 7 · Sprites, part 2 (9 images) · **1024×1024, black engraving ink on pure white #FFFFFF**

Same common prompt as Batch 6.

| File | [OBJECT] |
|---|---|
| `escoba.png` | `witch's broom with a rough twig head and a wooden handle` |
| `bolsa.png` | `old cloth bag tied with a cord, bulging, with a few herb stems poking out` |
| `grimorio.png` | `thick old book bound in leather with a clasp and rough cover (no title)` |
| `reloj-arena.png` | `hourglass in a wooden frame, sand running` |
| `frasco.png` | `glass flask with a cork, round belly, half-full of liquid, slight curl of vapour` |
| `luna-creciente.png` | `crescent moon with a faint small star beside it` |
| `lechuza.png` | `barn owl seen from the front with wings folded, big round eyes` |
| `setas.png` | `cluster of toadstool mushrooms of different sizes with grass blades` |
| `vela.png` | `single tall candle with a flame and dripping wax, in a small holder` |

## BATCH 8 · Textures (5 images) · **seamless-looking, flat, no subject, no text**

| File | Size | Prompt |
|---|---|---|
| `papel-pergamino.png` | 2048×2048 | `Aged parchment paper, warm cream (#E8DEC3) with brown foxing stains, soft paper fibres, tiny specks, slightly darker at the corners. Flat, no subject, no fold lines, no text.` |
| `tela-azul-oro.png` | 2048×2048 | `Worn book-cover cloth, deep teal blue (#1E4D5F), with cracked gold-leaf flakes (#C9A24A) peeling in irregular thin veins and patches, scuffed edges. Flat, no subject, no text, no frame.` |
| `papel-mostaza.png` | 2048×2048 | `Aged paper in mustard yellow (#D9C93F), mottled, with worn spots, a few brown stains and fibres. Flat, no subject, no text.` |
| `madera-oscura.png` | 2048×2048 | `Very dark rough wooden planks seen from above, near black, subtle grain and scratches, a faint sheen. Flat, no subject, no text, no objects.` |
| `grieta-oro.png` | 2048×2048 | `Thin cracked gold veins and flakes scattered on a pure black background, like kintsugi cracks on dark leather, no subject, no text. Gold (#C9A24A) on black (#000000).` |

## BATCH 9 · Particles and extras (5 images)

| File | Size | Prompt |
|---|---|---|
| `polilla.png` | 1024×1024 | `A single moth with open wings seen from above, engraved in fine hatching, black ink on pure white #FFFFFF, centred, clean edges, no paper texture, no shadow.` |
| `pluma.png` | 1024×1024 | `A single black feather, engraved in fine hatching, black ink on pure white #FFFFFF, centred, slightly diagonal, clean edges, no paper texture, no shadow.` |
| `hoja-seca.png` | 1024×1024 | `A single dry curled oak leaf, engraved in fine hatching, black ink on pure white #FFFFFF, centred, clean edges, no paper texture, no shadow.` |
| `setting-cuento.png` | 1050×1800 | `Vertical card-format engraving, full-bleed, grayscale: a deep fairy-tale forest with a winding path leading to a small hut with one lit window, a crow overhead, a crescent moon. Motif in the upper 70%, the lower 22% calm simple hatching. No frame, no text.` |
| `sello-cera.png` | 1024×1024 | `A round red wax seal with an irregular melted edge and a plain engraved crescent moon in the centre (no letters), deep crimson #8E2231, on a pure white #FFFFFF background, centred, clean edges, no shadow.` |

# FINAL DELIVERY · THE ZIP

When I write `zip`, deliver **one file named `MR-Bruja-Arte.zip`**.

**If you can run code or create files:** build the ZIP yourself with **exactly** this structure (one root folder `Bruja-Arte/`), and include a `LEEME.txt` at the root with: the tool and model used, the seed (if any), the date, and the list of `_dudosa` images.

```
Bruja-Arte/
├── LEEME.txt
├── style-ref.png
├── 01-marca/        cover.png, logo.png, portrait-bruja.png, portrait-director.png,
│                    portrait-heredera.png, portrait-pnj.png
├── 02-lugares/      choza-mesa.png, bosque-noche.png, camino-niebla.png, claro-aquelarre.png,
│                    aldea-lejos.png, grimorio-header.png, epilogo-bg.png, muerte-bg.png
├── 03-ambientes/    ambiente-accion.png, ambiente-reaccion.png, ambiente-drama.png,
│                    ambiente-monologo.png, ambiente-retrospeccion.png
├── 04-cartas/       escena-accion.png … escena-retrospeccion.png (5),
│                    neutra-accion.png … neutra-retrospeccion.png (5), reverso.png, setting-cuento.png
├── 05-objetos/      sombrero, rana, calavera-libros, gato-negro, cuervo, lapida, llave-candado,
│                    serpiente, caldero, escoba, bolsa, grimorio, reloj-arena, frasco,
│                    luna-creciente, lechuza, setas, vela   (.png, 18)
├── 06-texturas/     papel-pergamino.png, tela-azul-oro.png, papel-mostaza.png,
│                    madera-oscura.png, grieta-oro.png
└── 07-extras/       polilla.png, pluma.png, hoja-seca.png, sello-cera.png
```

**If you cannot create a ZIP:** give me every image as a separate download with its exact filename, and tell me "ready to be sorted by script". I will sort them myself.

=== TERMINA ===

---

## Para Manu · si la IA no puede crear el ZIP

Deja **todas las imágenes sueltas en una sola carpeta** (por ejemplo `~/Downloads/bruja-sueltas/`, con los nombres exactos) y ejecuta esto. Crea `MR-Bruja-Arte.zip` con la estructura correcta y te avisa de lo que falte o sobre:

```bash
python3 - <<'PY'
import zipfile
from pathlib import Path
SRC = Path.home() / "Downloads" / "bruja-sueltas"
OUT = Path.home() / "Downloads" / "MR-Bruja-Arte.zip"
esc = ["accion","reaccion","drama","monologo","retrospeccion"]
MAP = {
 "01-marca": ["cover","logo","portrait-bruja","portrait-director","portrait-heredera","portrait-pnj"],
 "02-lugares": ["choza-mesa","bosque-noche","camino-niebla","claro-aquelarre","aldea-lejos","grimorio-header","epilogo-bg","muerte-bg"],
 "03-ambientes": [f"ambiente-{k}" for k in esc],
 "04-cartas": [f"escena-{k}" for k in esc] + [f"neutra-{k}" for k in esc] + ["reverso","setting-cuento"],
 "05-objetos": ["sombrero","rana","calavera-libros","gato-negro","cuervo","lapida","llave-candado","serpiente","caldero",
                "escoba","bolsa","grimorio","reloj-arena","frasco","luna-creciente","lechuza","setas","vela"],
 "06-texturas": ["papel-pergamino","tela-azul-oro","papel-mostaza","madera-oscura","grieta-oro"],
 "07-extras": ["polilla","pluma","hoja-seca","sello-cera"],
}
files = {p.stem.lower(): p for p in SRC.iterdir() if p.suffix.lower() in {".png",".jpg",".jpeg",".webp"}}
used, missing = set(), []
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    if "style-ref" in files:
        z.write(files["style-ref"], f"Bruja-Arte/style-ref{files['style-ref'].suffix.lower()}"); used.add("style-ref")
    for folder, keys in MAP.items():
        for k in keys:
            p = files.get(k) or files.get(k + "_dudosa")
            if p: z.write(p, f"Bruja-Arte/{folder}/{p.stem.lower()}{p.suffix.lower()}"); used.add(p.stem.lower())
            else: missing.append(k)
    if (SRC / "LEEME.txt").exists(): z.write(SRC / "LEEME.txt", "Bruja-Arte/LEEME.txt")
extra = sorted(set(files) - used)
print(f"ZIP: {OUT}\nIncluidas: {len(used)}  ·  Faltan: {missing or 'ninguna'}  ·  Sobran: {extra or 'ninguna'}")
PY
```

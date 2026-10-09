# Cambios

## 0.2.1 · 2026-10-09

- Carátula (`docs/img/cover.png`), capturas, página de GitHub Pages y README con portada.
- Modo oscuro: el fondo de la mesa se oscurece; casilla «Último aliento» legible.
- El zip de la release ya no incluye `docs/`.

## 0.2.0 · 2026-10-09

Rediseño gráfico y de distribución de La Choza.

- **Mesa de madera con hojas de pergamino**: la hoja de la Bruja y las de herederas y recetas imitan las del libro (marco negro de esquinas cóncavas, líneas punteadas, escritura a mano), con el retrato, la bolsa con su iconografía y la rana de la hoja original.
- **Cabecera de tela azul con oro cuarteado** (el lomo del libro): título, las cinco velas y el frasco de puntos de drama siempre a la vista.
- **La escena es un libro abierto** de dos hojas con lomo central: planteamiento y rasgo/objeto a la izquierda; caldero, tirada, resultado y cierre a la derecha. Con una escena abierta las cartas se encogen para dejar sitio al libro.
- **Cartas en abanico** al elegir escena.
- **Preparación** como libro abierto (la Bruja a la izquierda, la bolsa a la derecha) con los asientos como etiquetas de pergamino.
- **Tipografía empaquetada**: IM Fell (grabado inglés) y Caveat (notas a mano), con su licencia.
- Modo oscuro, lectura y alto contraste adaptados a los componentes nuevos.

## 0.1.1 · 2026-10-09

- Repositorio público: avisos de uso y permisos actualizados; instalación por manifiesto.

## 0.1.0 · 2026-10-09

Primera versión jugable (sin publicar: pendiente de permiso de la editorial).

- **La Choza**: asientos (Bruja y Director, o una sola persona en solitario), asistente de preparación con ideas de la ambientación, cinco cartas de escena con peón y la regla de no repetir tipo, planteamiento, rasgo/objeto concedido por el Director, caldero con dados (Dice So Nice si está), resultado con PD y consecuencias, cierre de escena.
- **Puntos de drama**: frasco, recetas (dado, descanso, hada, marcar heredera, elegir heredera) y camino a la victoria.
- **Consecuencias secretas** de verdad: la libreta se guarda cifrada (ChaCha20, sin depender de HTTPS) y la clave vive solo en el navegador del Director, con copiar/importar. El estado público lleva únicamente el número. Cinco velas que se apagan. (Los permisos de documento no bastan: Foundry envía todos los documentos a todos los clientes.)
- **Libreta del Director**, **Grimorio** autogenerado (copiar, descargar, guardar en Diarios), ficha de la bruja.
- Ambientación incluida «Cuento de hadas» (texto original) y registro `game.mrBruja.registerSetting` para módulos.
- **Accesibilidad**: modo oscuro, modo lectura, alto contraste, tipografía sencilla, espaciado, botones grandes, movimiento y efectos reducidos, volúmenes por usuario. Líneas, velos y Tarjeta X anónimas.
- **Reglas**: resumen propio dentro del juego y pestaña «El libro» con el texto de TU manual, importado por OCR local (`scripts/import-manual.py`; no se distribuye).
- Reglas puras con tests, arranque por fases y diagnóstico.

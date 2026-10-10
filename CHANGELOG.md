# Cambios

## 0.3.1 · 2026-10-10

- **La mesa a pantalla completa se integra con el fondo**: la capa es transparente y se ve la escena de Foundry detrás de los paneles (antes era una mesa opaca que la tapaba, y en modo oscuro quedaba casi negra). Un velo asienta el conjunto, claro u oscuro. La mesa de madera queda como respaldo cuando la escena no tiene imagen y como opción: Accesibilidad → «Fondo de madera».
- La escena de bienvenida **cubre toda la pantalla** sin bandas: se aplica al arrancar, tras cada reencuadre de Foundry y cuando el ratón mueve o amplía el lienzo por debajo de la mesa.
- En modo oscuro, los fondos de la ventana ya no se apagan hasta el negro (se oscurecen según sean mesa, ambiente de escena o lugar).

## 0.3.0 · 2026-10-10

- **Mesa a pantalla completa**: la Choza puede ocupar toda la pantalla, por encima del lienzo y por debajo de los controles de Foundry y de las ventanas. Mide la barra lateral y las macros, deja pasar el ratón fuera de sus paneles, se oculta con el ojo y se recupera con una pastilla fija o con la herramienta de la escena.
  - Modo **automático**: pantalla completa si el espacio útil (sin controles ni barra lateral) supera el de la ventana; si no, ventana. Se puede forzar desde el botón de la cabecera o desde Accesibilidad → «Mesa en ventana».
  - Diseño adaptable (consultas de contenedor): columnas y letra crecen en pantallas grandes.
  - La escena de bienvenida cubre la pantalla sin bandas cuando la mesa está oculta.
- **Tutorial guiado** con los tours de Foundry: «Primeros pasos», «La mesa en juego» y «El Director y su libreta» (28 pasos, español e inglés). Se ofrece una vez al abrir la Choza y vive en Configuración → Tutorial guiado y en la bienvenida. Un paso cuyo elemento no existe sale centrado.
- Avisos de la mesa legibles sobre los fondos claros.
- Empaquetado: `tours/` va en el zip y CI comprueba que lleva tours, fuentes y arte.

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

# MR- Bruja

Sistema **no oficial** para Foundry VTT de ***Bruja***, de jim pinto (edición de El Refugio de Ryhope): un juego de narración compartida **para dos personas** sobre una vieja bruja que debe encontrar heredera antes de morir. **Necesitas el libro**; aquí no hay texto suyo (ver `NOTICE.md`).

## Qué hace

- **La Choza**: un caldero donde caen los dados, una bolsa con tres objetos, cinco velas que se apagan con cada consecuencia y un frasco que se llena de puntos de drama. La luz cambia de color con cada tipo de escena.
- **Las cinco cartas de escena** (Acción, Reacción, Drama, Monólogo, Retrospección), con peón y la regla de no repetir tipo. Cartas con grabado o neutras.
- **Consecuencias secretas de verdad**: el Director las anota en su **Libreta**, guardada **cifrada** (ChaCha20) en el mundo; la clave vive solo en el navegador del Director. Foundry envía todos los documentos a todos los clientes, así que un secreto «por permisos» se lee desde la consola: aquí, no. La Bruja solo ve cuántas velas quedan.
- **Recetas de PD**: un dado más, descansar, visita de un hada, marcar heredera, elegir heredera y epílogo sin dados.
- **Grimorio**: al terminar (o cuando quieras) el sistema compone la historia jugada; se copia, se descarga o se guarda en Diarios.
- **Reglas** dentro del juego: un resumen propio y, si lo importas de tu PDF, el texto de tu manual (pestaña «El libro»).
- **Una persona o dos**: una sola puede ocupar los dos asientos para jugar en solitario; dos personas se alternan.
- **Cuidado**: modo oscuro, modo lectura, alto contraste, texto grande, botones grandes, movimiento reducido, volúmenes por usuario, líneas y velos, Tarjeta X anónima, ventanas que recuerdan su posición, español e inglés.

## Instalación

En Foundry: **Sistemas → Instalar sistema** y pega el manifiesto:

```
https://github.com/ManuRomera/mr-bruja/releases/latest/download/system.json
```

Crea un mundo con el sistema, entra como GM una vez (se preparan los documentos de la partida) y pulsa **La Choza** en los controles de escena (o `Alt+B`). La Libreta del Director se cifra con una clave que se crea al escribir la primera consecuencia; **cópiala** (botón de la llave) si vas a abrir la libreta desde otro navegador.

## Desarrollo

```
brew install poppler tesseract tesseract-lang   # una vez, para importar el texto de tu manual
python3 scripts/import-manual.py "/ruta/a/tu/PDF_Bruja.pdf"   # crea assets/manual/libro.json (ignorado por git)
npm test        # reglas, motor, estructura y seguridad de arranque
npm run check   # sintaxis, JSON y rutas de arte
npm run build   # dist/mr-bruja.zip
python3 scripts/import-art.py <carpeta-del-zip-descomprimido>
```

Ambientaciones adicionales: `game.mrBruja.registerSetting({ id, name, where, places, people, dangers, names, traits, items: { orientar, cambiar, comer }, sparks, questions })` (ver `module/data/cuento.mjs`).

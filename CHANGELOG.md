# Cambios

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

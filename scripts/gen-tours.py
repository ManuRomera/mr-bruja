#!/usr/bin/env python3
"""Genera tours/*.json y añade sus textos (ES/EN) a lang/*.json desde una única fuente, para que no se desincronicen.
Uso: python3 scripts/gen-tours.py   (después de cambiar los textos de aquí)"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HEAD = "#br-choza .br-head-tools"

# Cada paso: (id, selector, dirección, título ES, texto ES, título EN, texto EN). Selector vacío = paso centrado.
TOURS = {
 "empezar": {
  "es": ("Primeros pasos", "Cómo preparar la partida: asientos, bruja y bolsa. Unos tres minutos."),
  "en": ("First steps", "How to set up the game: seats, witch and bag. About three minutes."),
  "next": ["mesa"],
  "steps": [
   ("bienvenida", "", "", "Una bruja, una heredera",
    "Bienvenida a <b>Bruja</b>. Una vieja bruja se despide del mundo y necesita a alguien que se haga cargo de su choza.\nLa juegan dos personas: <b>la Bruja</b> y <b>el Director de juego</b>, que interpreta a todos los demás.\nEste sistema lleva los dados, las velas y el grimorio; el manual del juego sigue siendo imprescindible. Avanza y retrocede con los botones de abajo y sal cuando quieras.",
    "A witch, an heir",
    "Welcome to <b>Bruja</b>. An old witch is leaving the world and needs someone to take over her hut.\nTwo people play: <b>the Witch</b> and <b>the Game Director</b>, who plays everyone else.\nThis system handles the dice, the candles and the grimoire; the game's rulebook is still essential. Move forward and back with the buttons below and leave whenever you like."),
   ("choza", "#br-choza .br-hud", "DOWN", "La Choza",
    "Esta es <b>La Choza</b>, vuestra mesa. Puede ser una ventana o ocupar toda la pantalla: el botón de las flechas, arriba a la derecha, cambia de una a otra.\nTodo el estado de la partida está aquí y lo veis los dos a la vez.",
    "The Hut",
    "This is <b>the Hut</b>, your table. It can be a window or fill the whole screen: the arrows button, top right, switches between them.\nThe whole game state is here and both of you see it at once."),
   ("asientos", "#br-choza .br-seats", "DOWN", "Los dos asientos",
    "Sentaos los dos: uno en <b>La Bruja</b> y otro en <b>El Director</b>. Si juegas <b>en solitario</b>, ocupa los dos.\nCada persona ve y hace lo suyo: la libreta secreta del Director solo se abre en su navegador.",
    "The two seats",
    "Both of you sit down: one as <b>the Witch</b> and one as <b>the Director</b>. If you play <b>solo</b>, take both.\nEach person sees and does their own part: the Director's secret notebook only opens in their browser."),
   ("bruja", "#br-choza .br-prep .br-book .br-leaf", "RIGHT", "Nombre y rasgo",
    "La Bruja necesita un <b>nombre</b> (y quizá un apodo) y un <b>rasgo</b>: lo que la define, su aspecto, su carácter o lo que sabe hacer.\nLos botones en cursiva son ideas de la ambientación: púlsalos para rellenar el campo y cámbialo a tu gusto.",
    "Name and trait",
    "The Witch needs a <b>name</b> (maybe a nickname) and a <b>trait</b>: what defines her, her looks, her temper or what she can do.\nThe italic buttons are ideas from the setting: press one to fill the field and change it as you like."),
   ("bolsa", "#br-choza .br-bag-field", "LEFT", "La bolsa con tres objetos",
    "Su <b>bolsa</b> lleva tres objetos: uno para orientarse, uno para intercambiar y uno para comer.\nNada de brújula, dinero ni comida: deja suelta la imaginación. Más adelante estos objetos pueden ayudarla en una tirada.",
    "The bag with three objects",
    "Her <b>bag</b> holds three objects: one to find her way, one to trade and one to eat.\nNo compass, money or food: let your imagination run. Later these objects can help her on a roll."),
   ("ambientacion", "#br-choza .br-setting-strip", "UP", "La ambientación",
    "Aquí tienes la <b>ambientación</b>: lugares, personajes y peligros para inspirarte. Puedes seguirla, ignorarla o añadir las tuyas con otros módulos.",
    "The setting",
    "Here is the <b>setting</b>: places, characters and dangers to inspire you. Follow it, ignore it or add your own with other modules."),
   ("empezar", "#br-choza .br-start", "UP", "A salir de la choza",
    "Cuando estéis los dos sentados y la bruja tenga nombre, rasgo y tres objetos, pulsa <b>Salir en busca de una heredera</b>.\nEn «Opciones de la partida» puedes dar puntos de drama de partida o activar el «último aliento».",
    "Out of the hut",
    "When you are both seated and the witch has a name, a trait and three objects, press <b>Set out to find an heir</b>.\nUnder “Game options” you can start with drama points or turn on the “last breath”."),
   ("siguiente", "", "", "Y ahora, a jugar",
    "Cuando empiece la partida, abre el siguiente tutorial, <b>La mesa en juego</b>: te enseña las cartas, el caldero, las velas y los puntos de drama.\nLo encontrarás en <b>Configuración → Tutorial guiado</b>.",
    "Now, let's play",
    "Once the game starts, open the next tutorial, <b>The table in play</b>: it shows the cards, the cauldron, the candles and the drama points.\nYou'll find it under <b>Settings → Guided tutorial</b>."),
  ]},
 "mesa": {
  "es": ("La mesa en juego", "Cartas, caldero, velas, puntos de drama y herederas. Unos cuatro minutos."),
  "en": ("The table in play", "Cards, cauldron, candles, drama points and heirs. About four minutes."),
  "next": ["director"],
  "steps": [
   ("intro", "", "", "Una escena detrás de otra",
    "El juego va de <b>escenas</b>: la Bruja elige un tipo, jugáis lo que haga falta y, si hay conflicto, se tira.\nTirar cierra la escena. Los éxitos dan <b>puntos de drama</b> y los fracasos, <b>consecuencias</b>. Con cinco consecuencias, la bruja muere sin heredera; si logra una heredera, gana.\n(Si aún no habéis empezado la partida, algunos elementos saldrán más adelante: este recorrido seguirá siendo válido.)",
    "One scene after another",
    "The game is about <b>scenes</b>: the Witch picks a type, you play as long as needed and, if there is conflict, you roll.\nRolling closes the scene. Successes give <b>drama points</b> and failures give <b>consequences</b>. With five consequences the witch dies without an heir; if she gets an heir, she wins.\n(If you haven't started the game yet, some elements will appear later: this tour is still valid.)"),
   ("cartas", "#br-choza .br-card-row", "DOWN", "Las cinco cartas de escena",
    "<b>Acción, Reacción, Drama, Monólogo y Retrospección</b>. La Bruja elige una y el <b>peón</b> se coloca sobre ella.\nNo puede repetir el tipo de la anterior (sale apagada) salvo que <b>descanse</b> (2 PD). El botón de las cartas, arriba, cambia entre grabados y cartas neutras.",
    "The five scene cards",
    "<b>Action, Reaction, Drama, Monologue and Retrospection</b>. The Witch picks one and the <b>pawn</b> goes on it.\nShe can't repeat the previous type (it's greyed out) unless she <b>rests</b> (2 DP). The cards button, above, switches between engraved and neutral cards."),
   ("libro", "#br-choza .br-scene-book .br-leaf", "RIGHT", "La escena es un libro abierto",
    "A la izquierda se <b>plantea</b>: ¿quién está?, ¿dónde?, ¿qué pasa? En pocas palabras, entre los dos.\nNarrad lo que haga falta; solo cuando hay conflicto se tira.",
    "The scene is an open book",
    "On the left you <b>frame</b> it: who is there? where? what is happening? In a few words, between the two of you.\nNarrate as needed; you only roll when there is conflict."),
   ("uso", "#br-choza .br-use", "RIGHT", "Rasgo u objeto en juego",
    "Si el <b>rasgo</b> o un <b>objeto de la bolsa</b> ayudan, la Bruja lo propone con una frase y el Director decide si lo concede. Concedido, se tira un tercer dado.",
    "Trait or object in play",
    "If the <b>trait</b> or a <b>bag object</b> helps, the Witch proposes it in a sentence and the Director decides whether to grant it. If granted, a third die is rolled."),
   ("caldero", "#br-choza .br-cauldron-box", "LEFT", "El caldero",
    "Los dados caen al <b>caldero</b>: 2d6 (3 si hay rasgo, objeto o descanso). El resultado sale con su nombre y su efecto: puntos de drama, consecuencias o ambos.",
    "The cauldron",
    "The dice fall into the <b>cauldron</b>: 2d6 (3 with a trait, an object or a rest). The result shows its name and effect: drama points, consequences or both."),
   ("cierre", "#br-choza .br-close", "LEFT", "Cerrar la escena",
    "Tirar <b>cierra la escena</b>: se escribe cómo termina, en una o dos frases, y todo queda en el Grimorio.",
    "Closing the scene",
    "Rolling <b>closes the scene</b>: write how it ends in a sentence or two, and everything goes into the Grimoire."),
   ("velas", "#br-choza .br-hud-candles", "DOWN", "Las cinco velas",
    "Cada <b>consecuencia</b> apaga una vela. El Director las anota en secreto: tú solo ves cuántas quedan encendidas.",
    "The five candles",
    "Each <b>consequence</b> snuffs a candle. The Director writes them in secret: you only see how many are still lit."),
   ("frasco", "#br-choza .br-hud-flask", "DOWN", "El frasco de puntos de drama",
    "Los <b>puntos de drama</b> llenan el frasco. La barra de debajo avanza hacia los 9 que hacen falta, en toda la partida, para poder ganar.",
    "The drama points flask",
    "<b>Drama points</b> fill the flask. The bar below advances toward the 9 you need, over the whole game, to be able to win."),
   ("recetas", "#br-choza .br-recipes-sheet", "LEFT", "Las recetas",
    "Con puntos se compran las <b>recetas</b>: un dado más, la visita de un hada, <b>marcar</b> a una heredera (4) y <b>elegirla</b> (5), que lleva al epílogo sin dados.",
    "The recipes",
    "Points buy the <b>recipes</b>: one more die, a fairy's visit, <b>marking</b> an heir (4) and <b>choosing</b> her (5), which leads to the epilogue with no dice."),
   ("herederas", "#br-choza .br-heirs-sheet", "LEFT", "Las herederas",
    "Las <b>herederas</b> que marques aparecen aquí con su sello de cera. Caben hasta seis; solo una se elige.",
    "The heirs",
    "The <b>heirs</b> you mark appear here with their wax seal. Up to six fit; only one is chosen."),
   ("herramientas", HEAD, "DOWN", "Las herramientas",
    "De izquierda a derecha: <b>pantalla completa o ventana</b>, ocultar la mesa (a pantalla completa), cartas con grabado o neutras, la libreta del Director, el <b>Grimorio</b> (la historia jugada), <b>Reglas</b>, <b>Seguridad</b> (pausa, velo y tarjeta X) y <b>Accesibilidad</b>, con el modo oscuro.",
    "The tools",
    "Left to right: <b>full screen or window</b>, hide the table (in full screen), engraved or neutral cards, the Director's notebook, the <b>Grimoire</b> (the story played), <b>Rules</b>, <b>Safety</b> (pause, veil and X-card) and <b>Accessibility</b>, with dark mode."),
   ("fin", "", "", "Buena suerte",
    "Eso es todo. Si eres el Director, el siguiente tutorial te enseña tu libreta secreta.\nEn Configuración → Tutorial guiado puedes repetir cualquiera.",
    "Good luck",
    "That's it. If you are the Director, the next tutorial shows your secret notebook.\nUnder Settings → Guided tutorial you can repeat any of them."),
  ]},
 "director": {
  "es": ("El Director y su libreta", "Conceder rasgos, anotar consecuencias en secreto y la clave de la libreta. Unos tres minutos."),
  "en": ("The Director and the notebook", "Granting traits, writing consequences in secret and the notebook key. About three minutes."),
  "next": [],
  "steps": [
   ("intro", "", "", "El Director de juego",
    "Interpretas a todos los demás —aldeanos, hadas, lobos— y guardas lo que la Bruja no sabe: las <b>consecuencias</b>.\nEste recorrido es para quien ocupa el asiento del Director.",
    "The Game Director",
    "You play everyone else —villagers, fairies, wolves— and keep what the Witch doesn't know: the <b>consequences</b>.\nThis tour is for whoever holds the Director's seat."),
   ("conceder", "#br-choza .br-use", "RIGHT", "Conceder el rasgo o el objeto",
    "Cuando la Bruja propone usar su rasgo o un objeto, aquí decides: <b>Conceder</b> o <b>Denegar</b>. Sé tan laxo como quieras; el juego premia la imaginación.",
    "Granting the trait or object",
    "When the Witch proposes using her trait or an object, you decide here: <b>Grant</b> or <b>Deny</b>. Be as lax as you like; the game rewards imagination."),
   ("anotar", "#br-choza .br-secret-panel", "RIGHT", "Anotar la consecuencia",
    "Cuando una tirada da consecuencias aparece este aviso: <b>anótala en secreto</b>, con una frase que luego puedas usar. Las chispas dan ideas, pero nunca escriben por ti.\nSi la Bruja gasta puntos en un hada o en una heredera, te pedirá aquí <b>qué consecuencia desaparece</b>.",
    "Writing the consequence",
    "When a roll gives consequences this notice appears: <b>write it in secret</b>, with a sentence you can use later. The sparks give ideas, but never write for you.\nIf the Witch spends points on a fairy or an heir, it will ask you here <b>which consequence goes away</b>."),
   ("boton", "#br-choza .br-head-tools [data-action=notebook]", "DOWN", "Tu libreta",
    "Este botón abre tu <b>Libreta del Director</b>, la página amarilla. Solo la ves tú: la Bruja sabe cuántas consecuencias lleva, no cuáles.",
    "Your notebook",
    "This button opens your <b>Director's Notebook</b>, the yellow page. Only you see it: the Witch knows how many consequences she carries, not which."),
   ("lista", "#br-notebook .br-cons-list", "LEFT", "Las consecuencias",
    "Aquí están todas, con su texto. Puedes editarlas, <b>eliminarlas</b> cuando se resuelvan en la historia o <b>revelarlas</b>: su texto pasa a ser público y entra en el Grimorio.",
    "The consequences",
    "All of them are here, with their text. You can edit them, <b>remove</b> them when they get resolved in the story or <b>reveal</b> them: their text becomes public and goes into the Grimoire."),
   ("clave", "#br-notebook [data-action=copyKey]", "BOTTOM", "La clave de la libreta",
    "La libreta se guarda <b>cifrada</b>: ni abriendo la consola puede leerla la Bruja. La clave vive solo en este navegador.\n<b>Cópiala</b> con la llave y guárdala: sin ella no podrás abrir la libreta desde otro navegador u ordenador.",
    "The notebook key",
    "The notebook is stored <b>encrypted</b>: not even the console lets the Witch read it. The key lives only in this browser.\n<b>Copy</b> it with the key button and keep it: without it you can't open the notebook from another browser or computer."),
   ("candidatas", "#br-notebook [data-action=addRow][data-kind=candidatas]", "TOP", "Candidatas y PNJ",
    "Apunta aquí tus <b>candidatas a heredera</b> y los demás PNJ. Marcar una cuesta 4 puntos de drama a la Bruja; hasta entonces es cosa tuya.",
    "Candidates and NPCs",
    "Note your <b>heir candidates</b> and other NPCs here. Marking one costs the Witch 4 drama points; until then it's up to you."),
   ("fin", "", "", "Eso es todo",
    "Recuerda: tus notas secretas nunca salen de tu libreta, salvo que las reveles.\nSuerte con la bruja.",
    "That's all",
    "Remember: your secret notes never leave your notebook unless you reveal them.\nGood luck with the witch."),
  ]},
}

def build():
    es_lang, en_lang = {}, {}
    for key, t in TOURS.items():
        steps = []
        es_lang[key] = {"Title": t["es"][0], "Description": t["es"][1]}
        en_lang[key] = {"Title": t["en"][0], "Description": t["en"][1]}
        for sid, sel, direction, te, xe, tn, xn in t["steps"]:
            es_lang[key][sid] = {"Title": te, "Text": xe}
            en_lang[key][sid] = {"Title": tn, "Text": xn}
            step = {"id": sid, "title": f"BR.Tour.{key}.{sid}.Title", "content": f"BR.Tour.{key}.{sid}.Text"}
            if sel: step["selector"] = sel
            if direction: step["tooltipDirection"] = direction
            steps.append(step)
        data = {"title": f"BR.Tour.{key}.Title", "description": f"BR.Tour.{key}.Description", "display": True, "canBeResumed": True,
                "suggestedNextTours": [f"mr-bruja.{n}" for n in t["next"]], "steps": steps}
        (ROOT / "tours" / f"{key}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    common = {
     "es": {"Title": "Tutorial guiado", "Open": "Empezar", "Hint": "Recorridos paso a paso por La Choza: primeros pasos, la mesa en juego y el Director.",
            "OfferTitle": "¿Te enseño cómo se juega?", "OfferText": "Hay un tutorial guiado de unos minutos. Puedes repetirlo cuando quieras desde Configuración → Tutorial guiado.",
            "OfferYes": "Empezar el tutorial", "OfferNo": "Ahora no", "Menu": "Elige un recorrido", "MenuHint": "Se abre con la Choza visible.", "Button": "Tutorial"},
     "en": {"Title": "Guided tutorial", "Open": "Start", "Hint": "Step-by-step tours of the Hut: first steps, the table in play and the Director.",
            "OfferTitle": "Shall I show you how to play?", "OfferText": "There is a guided tutorial of a few minutes. You can repeat it any time from Settings → Guided tutorial.",
            "OfferYes": "Start the tutorial", "OfferNo": "Not now", "Menu": "Choose a tour", "MenuHint": "It opens with the Hut visible.", "Button": "Tutorial"}}
    for lg, tours in (("es", es_lang), ("en", en_lang)):
        p = ROOT / "lang" / f"{lg}.json"
        j = json.loads(p.read_text(encoding="utf-8"))
        j["BR"]["Tour"] = tours
        j["BR"]["Tutorial"] = common[lg]
        p.write_text(json.dumps(j, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("tours:", ", ".join(f"{k} ({len(t['steps'])} pasos)" for k, t in TOURS.items()))

if __name__ == "__main__":
    build()

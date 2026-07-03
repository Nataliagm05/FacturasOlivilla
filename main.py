import json
import time

from outlook_service import conectar

from logger import log

from config import ESTADO_FILE
from config import INTERVALO


def cargar_estado():

    try:

        with open(ESTADO_FILE, encoding="utf8") as f:

            return json.load(f)

    except:

        return {"ultimo_entryid": ""}


def guardar_estado(entryid):

    with open(ESTADO_FILE, "w", encoding="utf8") as f:

        json.dump({"ultimo_entryid": entryid}, f, indent=4)


log("========================================")
log("FacturaSync iniciado")

carpeta = conectar()

while True:

    estado = cargar_estado()

    mensajes = carpeta.Items

    mensajes.Sort("[ReceivedTime]", True)

    ultimo = estado["ultimo_entryid"]

    nuevos = []

    for correo in mensajes:

        try:

            if correo.EntryID == ultimo:

                break

            nuevos.append(correo)

        except:

            pass

    nuevos.reverse()

    for correo in nuevos:

        log("--------------------------------------")
        log(f"Asunto: {correo.Subject}")
        log(f"Remitente: {correo.SenderEmailAddress}")
        log(f"Adjuntos: {correo.Attachments.Count}")

        guardar_estado(correo.EntryID)

    time.sleep(INTERVALO)
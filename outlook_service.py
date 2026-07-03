import win32com.client

from logger import log

from config import CARPETA_OUTLOOK


def conectar():

    outlook = win32com.client.Dispatch("Outlook.Application").GetNamespace("MAPI")

    for i in range(1, outlook.Folders.Count + 1):

        cuenta = outlook.Folders.Item(i)

        for carpeta in cuenta.Folders:

            if carpeta.Name.upper() == CARPETA_OUTLOOK.upper():

                log("Carpeta FACTURAS encontrada")

                return carpeta

    raise Exception("No existe la carpeta FACTURAS")
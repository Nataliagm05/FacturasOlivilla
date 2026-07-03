import win32com.client

outlook = win32com.client.Dispatch("Outlook.Application").GetNamespace("MAPI")

facturas = None

for i in range(1, outlook.Folders.Count + 1):
    cuenta = outlook.Folders.Item(i)

    for carpeta in cuenta.Folders:
        if carpeta.Name.upper() == "FACTURAS":
            facturas = carpeta
            break

    if facturas:
        break

if facturas is None:
    print("No se encontró la carpeta FACTURAS")
    exit()

print("Carpeta encontrada:", facturas.Name)
print("Correos:", facturas.Items.Count)
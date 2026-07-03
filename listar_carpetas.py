import win32com.client

outlook = win32com.client.Dispatch("Outlook.Application").GetNamespace("MAPI")

for i in range(1, outlook.Folders.Count + 1):
    cuenta = outlook.Folders.Item(i)
    print(f"\n📧 Cuenta: {cuenta.Name}")

    for carpeta in cuenta.Folders:
        print("   └──", carpeta.Name)
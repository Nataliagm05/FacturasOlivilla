// =====================================================================
// Supabase Edge Function: recibir-factura
// Recibe una factura desde el flujo de Power Automate (correo entrante),
// sube el archivo adjunto a Storage y crea el registro en
// facturas_pendientes para que aparezca en la Bandeja de Clasificación.
//
// DESPLIEGUE:
//   supabase functions deploy recibir-factura
//
// VARIABLES DE ENTORNO NECESARIAS (Project Settings > Edge Functions):
//   SUPABASE_URL              -> ya viene inyectada automáticamente
//   SUPABASE_SERVICE_ROLE_KEY -> ya viene inyectada automáticamente
//
// Power Automate debe hacer un POST a la URL de esta función con este
// cuerpo JSON:
// {
//   "remitente": "proveedor@empresa.com",
//   "asunto": "Factura Junio 2026",
//   "archivoBase64": "JVBERi0xLjQK...",   (contenido del adjunto en base64)
//   "nombreArchivo": "factura123.pdf",
//   "contentType": "application/pdf"
// }
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

Deno.serve(async (req: Request) => {
  // CORS básico (Power Automate no lo necesita, pero por si pruebas desde el navegador)
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    const body = await req.json();
    const { remitente, asunto, archivoBase64, nombreArchivo, contentType } = body;

    let archivo_url: string | null = null;

    if (archivoBase64 && nombreArchivo) {
      const bytes = base64ToUint8Array(archivoBase64);
      const rutaArchivo = `${Date.now()}_${nombreArchivo.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

      const { error: uploadError } = await supabase.storage
        .from("facturas-entrantes")
        .upload(rutaArchivo, bytes, {
          contentType: contentType || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        throw new Error("Error subiendo archivo: " + uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from("facturas-entrantes")
        .getPublicUrl(rutaArchivo);

      archivo_url = publicUrlData.publicUrl;
    }

    const { data, error: insertError } = await supabase
      .from("facturas_pendientes")
      .insert({
        remitente: remitente || null,
        asunto: asunto || null,
        archivo_url,
        archivo_nombre: nombreArchivo || null,
        clasificado: false,
      })
      .select();

    if (insertError) {
      throw new Error("Error insertando registro: " + insertError.message);
    }

    return new Response(JSON.stringify({ ok: true, registro: data }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
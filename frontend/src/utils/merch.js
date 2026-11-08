import { API } from "./api";

// Pide algo a la API de merchandising. Si hay error, lanza un Error con el mensaje del servidor.
// El cuerpo puede ser un objeto (se envía como JSON) o un FormData (para subir una foto).
export async function pedirMerch(ruta, token, { metodo = "GET", cuerpo } = {}) {
  const esFormulario = cuerpo instanceof FormData;
  const res = await fetch(`${API}/api${ruta}`, {
    method: metodo,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Con FormData el navegador completa el Content-Type solo
      ...(cuerpo && !esFormulario
        ? { "Content-Type": "application/json" }
        : {}),
    },
    body: cuerpo ? (esFormulario ? cuerpo : JSON.stringify(cuerpo)) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Ocurrió un error");
  return data;
}

// Texto y colores de cada estado de una compra (las claves vienen del backend).
// Las clases van escritas completas para que Tailwind las detecte.
export const ESTADOS_COMPRA = {
  pago_pendiente: {
    texto: "Pago pendiente",
    clases: "bg-mandarina/20 text-mandarina border-mandarina",
  },
  en_preparacion: {
    texto: "En preparación",
    clases: "bg-cielo/20 text-cielo border-cielo",
  },
  en_camino: {
    texto: "En camino",
    clases: "bg-sol/20 text-sol border-sol",
  },
  recibida: {
    texto: "Recibida",
    clases: "bg-chicle/20 text-chicle border-chicle",
  },
  cancelada: {
    texto: "Cancelada",
    clases: "bg-crema/10 text-crema/60 border-crema/30",
  },
};

export function fechaLarga(iso) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

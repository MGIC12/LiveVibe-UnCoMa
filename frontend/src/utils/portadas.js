import { API } from "./api";

// Sube o quita la imagen de un evento ya guardado. Si no hay nada que hacer, no pide nada.
// cambio = { archivo: File | null, quitar: boolean }
export async function guardarPortada(idEvento, { archivo, quitar }, token) {
  if (!archivo && !quitar) return;

  const opciones = archivo
    ? (() => {
        const datos = new FormData();
        datos.append("imagen", archivo);
        // Con FormData NO se pone Content-Type: el navegador lo arma solo
        return { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: datos };
      })()
    : { method: "DELETE", headers: { Authorization: `Bearer ${token}` } };

  const res = await fetch(`${API}/api/eventos/${idEvento}/imagen`, opciones);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "No se pudo guardar la imagen del evento");
  }
}
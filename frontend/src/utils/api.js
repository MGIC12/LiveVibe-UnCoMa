export const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// - Cloudinary: ya es una dirección completa (se le pide formato y calidad automáticos)
// - Imágenes de antes, guardadas en el servidor: es una ruta relativa (/uploads/...)
export function urlImagen(url) {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) {
    return url.includes("res.cloudinary.com") && url.includes("/upload/")
      ? url.replace("/upload/", "/upload/f_auto,q_auto/")
      : url;
  }
  return `${API}${url}`;
}
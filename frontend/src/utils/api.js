export const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// En la base se guarda la ruta relativa (/uploads/xxx.jpg).
// Acá se arma la dirección completa para poder mostrarla.
export function urlImagen(ruta) {
  return ruta ? `${API}${ruta}` : null;
}
export const inputClase =
  "mt-1 w-full px-4 py-2 rounded-full bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500";
export const labelClase = "block text-sm text-gray-300";

// Tienen que coincidir con las constantes del backend (routes/auth.js)
export const MIN_INTEGRANTES = 2;
export const MAX_INTEGRANTES = 10;

export const INTEGRANTE_VACIO = {
  nombre: "",
  apellido: "",
  instrumento: "",
  fecha_nac: "",
  nacionalidad: "",
};
export const inputClase =
  "mt-1 w-full px-4 py-2 rounded-full bg-crema/10 border border-crema/25 text-crema placeholder-crema/60 focus:outline-none focus:ring-2 focus:ring-cielo";
export const labelClase = "block text-sm text-crema/80";

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

// Tienen que coincidir con el backend (middleware/subida.js)
export const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
export const MAX_BYTES_IMAGEN = 2 * 1024 * 1024; // 2 MB

// Estado inicial de una foto "sin tocar"
export const FOTO_VACIA = { archivo: null, previa: null, quitar: false };

// Opciones del desplegable de clasificación
export const CLASIFICACIONES = ["Apto todo público", "+13", "+16", "+18"];

// Valores de un formulario de evento vacío
export const EVENTO_VACIO = {
  nombre: "",
  lugar: "",
  ciudad: "",
  fecha: "",
  hora_apertura: "",
  precio: "",
  cant_entradas: "",
  pais: "",
  genero: "",
  clasificacion: CLASIFICACIONES,
  gira: "",
};

// Convierte un precio en texto: 15000 -> "$ 15.000", 0 -> "Gratis"
export function formatearPrecio(valor) {
  if (valor === null || valor === undefined || valor === "") return "";
  const numero = Number(valor);
  if (numero === 0) return "Gratis";
  return numero.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
// Reglas de las reservas de entradas, compartidas por la ruta y por el chatbot.

// Cuántas entradas se pueden reservar de una sola vez
const MAX_ENTRADAS_POR_RESERVA = 10;

// Cantidad pedida: si no se manda, es 1. Devuelve null si no es un entero entre 1 y el máximo.
function leerCantidad(valor) {
  if (valor === undefined || valor === null || valor === "") return 1;
  const n = Number(valor);
  return Number.isInteger(n) && n >= 1 && n <= MAX_ENTRADAS_POR_RESERVA
    ? n
    : null;
}

const textoEntradas = (n) => (n === 1 ? "una entrada" : n + " entradas");

module.exports = { MAX_ENTRADAS_POR_RESERVA, leerCantidad, textoEntradas };

// Reglas de las reservas, iguales a las del servidor (backend/utils/reservas.js)
export const MAX_ENTRADAS_POR_RESERVA = 10;

export const textoEntradas = (n) => `${n} ${n === 1 ? "entrada" : "entradas"}`;

// Hasta cuántas entradas puede elegir la persona: el máximo por reserva o lo que quede
export const maximoReservable = (disponibles) =>
  Math.max(
    1,
    Math.min(MAX_ENTRADAS_POR_RESERVA, disponibles ?? MAX_ENTRADAS_POR_RESERVA),
  );

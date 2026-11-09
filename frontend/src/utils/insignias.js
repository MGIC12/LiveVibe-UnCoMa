export const INSIGNIAS = {
  aficionado: {
    texto: "Aficionado",
    icono: "🎧",
    clases: "bg-cielo text-tinta border-cielo",
  },
  fanatico: {
    texto: "Fanático",
    icono: "🎤",
    clases: "bg-fucsia text-white border-fucsia",
  },
  obsesionado: {
    texto: "Obsesionado",
    icono: "🔥",
    clases: "bg-mandarina text-tinta border-mandarina",
  },
};

// Texto listo para mostrar como etiqueta, o null si el fan todavía no tiene insignia.
export function etiquetaInsignia(nivel) {
  const datos = INSIGNIAS[nivel];
  return datos ? `${datos.icono} ${datos.texto}` : null;
}

// Mismos mínimos que el servidor (backend/utils/insignias.js), de menor a mayor
const NIVELES = [
  { clave: "aficionado", minimo: 1 },
  { clave: "fanatico", minimo: 5 },
  { clave: "obsesionado", minimo: 10 },
];

// Avance hacia la próxima insignia. Si ya tiene la máxima, "siguiente" es null.
export function progresoInsignia(asistidos = 0) {
  const siguiente = NIVELES.find((n) => asistidos < n.minimo) ?? null;
  if (!siguiente) return { siguiente: null, faltan: 0, porcentaje: 100 };
  const anterior = [...NIVELES].reverse().find((n) => asistidos >= n.minimo);
  const base = anterior ? anterior.minimo : 0;
  return {
    siguiente: siguiente.clave,
    faltan: siguiente.minimo - asistidos,
    porcentaje: Math.round(((asistidos - base) / (siguiente.minimo - base)) * 100),
  };
}

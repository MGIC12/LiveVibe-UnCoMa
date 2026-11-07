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

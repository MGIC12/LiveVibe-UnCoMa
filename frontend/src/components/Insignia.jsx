import { INSIGNIAS } from "../utils/insignias";

// Chip con la insignia de un fan. No muestra nada si todavía no tiene una.
export default function Insignia({ nivel, grande = false }) {
  const datos = INSIGNIAS[nivel];
  if (!datos) return null;

  return (
    <span
      title="Insignia por conciertos asistidos"
      className={`inline-flex items-center gap-1 border font-bold uppercase tracking-wider whitespace-nowrap ${datos.clases} ${
        grande
          ? "px-3 py-1 rounded-full text-xs"
          : "px-1.5 py-0.5 rounded text-[10px]"
      }`}
    >
      <span aria-hidden="true">{datos.icono}</span>
      {datos.texto}
    </span>
  );
}

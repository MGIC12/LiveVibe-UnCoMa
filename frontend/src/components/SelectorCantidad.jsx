import { textoEntradas } from "../utils/reservas";

// Elige cuántas entradas reservar: botones − / + con un máximo
export default function SelectorCantidad({
  valor,
  max,
  onChange,
  disabled = false,
  className = "",
}) {
  const boton =
    "w-10 h-10 rounded-full border border-crema/30 text-xl font-bold leading-none transition " +
    "hover:border-fucsia hover:text-fucsia disabled:opacity-40 disabled:hover:border-crema/30 disabled:hover:text-inherit";

  return (
    <div
      role="group"
      aria-label="Cantidad de entradas"
      className={`inline-flex items-center gap-3 bg-tinta/80 border border-crema/20 rounded-full px-3 py-1.5 ${className}`}
    >
      <button
        type="button"
        className={boton}
        onClick={() => onChange(valor - 1)}
        disabled={disabled || valor <= 1}
        aria-label="Una entrada menos"
      >
        −
      </button>
      <span
        className="min-w-[5.5rem] text-center font-bold text-crema"
        aria-live="polite"
      >
        {textoEntradas(valor)}
      </span>
      <button
        type="button"
        className={boton}
        onClick={() => onChange(valor + 1)}
        disabled={disabled || valor >= max}
        aria-label="Una entrada más"
      >
        +
      </button>
    </div>
  );
}

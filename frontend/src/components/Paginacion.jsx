// Números a mostrar: siempre la primera, la última y las vecinas de la actual (con "…" en los huecos)
function numerosVisibles(pagina, total) {
  const set = new Set([1, total, pagina - 1, pagina, pagina + 1]);
  const orden = [...set]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  const salida = [];
  orden.forEach((n, i) => {
    if (i > 0 && n - orden[i - 1] > 1) salida.push("…");
    salida.push(n);
  });
  return salida;
}

const base =
  "min-w-10 h-10 px-3 rounded-full text-sm font-bold border transition disabled:opacity-40 disabled:cursor-not-allowed";

// Barra de páginas. Si todo entra en una sola página, no se muestra.
export default function Paginacion({
  pagina,
  total,
  desde,
  hasta,
  cantidad,
  onCambiar,
  etiqueta = "resultados",
  anclaId,
}) {
  if (total <= 1) return null;

  function ir(n) {
    onCambiar(n);
    if (anclaId) {
      // Vuelve al principio de la lista para no dejar a la persona en el final de la página nueva
      document
        .getElementById(anclaId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-col items-center gap-3 pt-4"
    >
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => ir(pagina - 1)}
          disabled={pagina <= 1}
          className={`${base} border-crema/25 text-crema hover:border-fucsia hover:text-fucsia`}
        >
          ← Anterior
        </button>
        {numerosVisibles(pagina, total).map((n, i) =>
          n === "…" ? (
            <span
              key={`p${i}`}
              className="px-1 text-crema/50"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => ir(n)}
              aria-current={n === pagina ? "page" : undefined}
              aria-label={`Página ${n}`}
              className={`${base} ${
                n === pagina
                  ? "bg-fucsia border-fucsia text-tinta"
                  : "border-crema/25 text-crema hover:border-fucsia hover:text-fucsia"
              }`}
            >
              {n}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => ir(pagina + 1)}
          disabled={pagina >= total}
          className={`${base} border-crema/25 text-crema hover:border-fucsia hover:text-fucsia`}
        >
          Siguiente →
        </button>
      </div>
      <p className="text-xs text-crema/60" aria-live="polite">
        Mostrando {desde}–{hasta} de {cantidad} {etiqueta}
      </p>
    </nav>
  );
}

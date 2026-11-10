import { useEffect, useState } from "react";
import { API } from "../utils/api";

const base =
  "px-4 sm:px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2";
const inactivo =
  "bg-neutral-800 text-crema/80 hover:bg-neutral-700 hover:text-crema border border-crema/20 hover:border-neutral-500";

// Fila de botones de un filtro. Las opciones salen de la base de datos y cada una muestra
// cuántos eventos tiene. "activo" es el estilo del botón elegido (cambia según el filtro).
function FilaFiltro({ titulo, opciones, valor, onChange, textoTodos, estiloActivo, cargando }) {
  // Si lo elegido no está en la lista (por ejemplo se actualizaron los eventos), se muestra igual
  const lista =
    valor && !opciones.some((o) => o.nombre.toLowerCase() === valor.toLowerCase())
      ? [{ nombre: valor, cantidad: 0 }, ...opciones]
      : opciones;

  const total = opciones.reduce((suma, o) => suma + o.cantidad, 0);

  return (
    <div>
      <h3 className="text-sm font-semibold text-crema/70 uppercase tracking-wider mb-3">
        {titulo}
      </h3>
      <div className="flex flex-wrap gap-2 sm:gap-3" aria-busy={cargando}>
        {cargando && opciones.length === 0 ? (
          // Mientras llegan las opciones se muestran botones "fantasma"
          [0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="h-9 w-24 rounded-full bg-crema/10 animate-pulse"
              aria-hidden="true"
            />
          ))
        ) : (
          <>
            <button
              type="button"
              aria-pressed={valor === ""}
              onClick={() => onChange("")}
              className={`${base} ${valor === "" ? estiloActivo : inactivo}`}
            >
              {textoTodos}
              <span className="text-xs opacity-70">{total}</span>
            </button>
            {lista.map((o) => {
              const activo = valor.toLowerCase() === o.nombre.toLowerCase();
              return (
                <button
                  key={o.nombre}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => onChange(activo ? "" : o.nombre)}
                  className={`${base} ${activo ? estiloActivo : inactivo}`}
                >
                  {o.nombre}
                  <span className="text-xs opacity-70">{o.cantidad}</span>
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

const Filtros = ({ filtroGenero, setFiltroGenero, filtroPais, setFiltroPais }) => {
  const [opciones, setOpciones] = useState({ generos: [], paises: [] });
  const [cargando, setCargando] = useState(true);

  // Cada vez que cambia un filtro se piden de nuevo las opciones: los conteos se ajustan
  // al otro filtro, así no se ofrecen combinaciones sin resultados.
  useEffect(() => {
    let activo = true;
    const params = new URLSearchParams();
    if (filtroGenero) params.append("genero", filtroGenero);
    if (filtroPais) params.append("pais", filtroPais);

    fetch(`${API}/api/eventos/filtros?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!activo || !data) return;
        setOpciones({
          generos: Array.isArray(data.generos) ? data.generos : [],
          paises: Array.isArray(data.paises) ? data.paises : [],
        });
      })
      .catch(() => {})
      .finally(() => activo && setCargando(false));

    return () => {
      activo = false;
    };
  }, [filtroGenero, filtroPais]);

  const hayFiltros = filtroGenero || filtroPais;

  return (
    <div className="mb-8 space-y-6">
      <FilaFiltro
        titulo="Filtrar por género"
        opciones={opciones.generos}
        valor={filtroGenero}
        onChange={setFiltroGenero}
        textoTodos="Todos"
        estiloActivo="bg-fucsia text-tinta shadow-[0_0_15px_rgba(255,46,147,0.35)]"
        cargando={cargando}
      />
      <FilaFiltro
        titulo="Filtrar por país"
        opciones={opciones.paises}
        valor={filtroPais}
        onChange={setFiltroPais}
        textoTodos="Todos"
        estiloActivo="bg-sol text-tinta shadow-[0_0_15px_rgba(255,200,60,0.3)]"
        cargando={cargando}
      />
      {hayFiltros && (
        <button
          type="button"
          onClick={() => {
            setFiltroGenero("");
            setFiltroPais("");
          }}
          className="text-sm font-bold text-cielo hover:text-crema transition-colors"
        >
          ✕ Limpiar filtros
        </button>
      )}
    </div>
  );
};

export default Filtros;

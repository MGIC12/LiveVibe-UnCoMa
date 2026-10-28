import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";
import { formatearPrecio } from "../utils/formularios";

const FILTROS = [
  { id: "todos", etiqueta: "Todos", coincide: () => true },
  {
    id: "proximos",
    etiqueta: "Próximos",
    coincide: (e) => e.situacion === "proximo" || e.situacion === "hoy",
  },
  { id: "pasados", etiqueta: "Pasados", coincide: (e) => e.situacion === "pasado" },
  { id: "cancelados", etiqueta: "Cancelados", coincide: (e) => e.situacion === "cancelado" },
];

const SITUACIONES = {
  hoy: { texto: "Hoy", clase: "bg-sol text-tinta" },
  proximo: { texto: "Próximo", clase: "bg-cielo text-tinta" },
  pasado: { texto: "Finalizado", clase: "bg-crema/15 text-crema/70" },
  cancelado: { texto: "Cancelado", clase: "bg-mandarina text-tinta" },
};

export default function MisEventos() {
  const { token } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => {
    let activo = true;
    fetch(`${API}/api/eventos/mios`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "No se pudieron cargar tus eventos");
        return data;
      })
      .then((data) => {
        if (activo) setEventos(data);
      })
      .catch((err) => {
        if (activo) setError(err.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [token]);

  const filtroActual = FILTROS.find((f) => f.id === filtro);
  let visibles = eventos.filter(filtroActual.coincide);
  // Próximos: del más cercano al más lejano. El resto: del más reciente al más antiguo.
  if (filtro === "proximos") visibles = [...visibles].reverse();

  return (
    <>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-24 pb-12 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl sm:text-4xl font-black text-crema">Mis eventos</h1>
          <Link
            to="/eventos/nuevo"
            className="px-5 py-2 rounded-full bg-fucsia hover:bg-chicle text-tinta font-bold transition"
          >
            Crear evento
          </Link>
        </div>

        {/* Filtros con la cantidad de eventos de cada uno */}
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${
                filtro === f.id
                  ? "bg-fucsia text-tinta"
                  : "bg-crema/10 text-crema/80 hover:bg-crema/20"
              }`}
            >
              {f.etiqueta} ({eventos.filter(f.coincide).length})
            </button>
          ))}
        </div>

        {cargando ? (
          <p className="text-crema/70 py-12 text-center animate-pulse">Cargando tus eventos...</p>
        ) : error ? (
          <p className="text-mandarina text-center py-12" role="alert">
            {error}
          </p>
        ) : eventos.length === 0 ? (
          <div className="text-center bg-crema/5 border border-crema/20 rounded-2xl p-10 space-y-4">
            <p className="text-crema/80">Todavía no creaste ningún evento.</p>
            <Link
              to="/eventos/nuevo"
              className="inline-block px-6 py-2 rounded-full bg-fucsia hover:bg-chicle text-tinta font-bold transition"
            >
              Crear mi primer evento
            </Link>
          </div>
        ) : visibles.length === 0 ? (
          <p className="text-crema/70 text-center py-12">No tenés eventos en esta categoría.</p>
        ) : (
          <ul className="space-y-4">
            {visibles.map((e) => {
              const fecha = new Date(`${e.fecha}T00:00:00`);
              const situacion = SITUACIONES[e.situacion];
              const modificable = e.situacion === "proximo" || e.situacion === "hoy";
              const reservadas = (e.cant_entradas ?? 0) - (e.entradas_disponibles ?? 0);

              return (
                <li
                  key={e.id_evento}
                  className={`bg-crema/5 border border-crema/20 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${
                    e.situacion === "cancelado" ? "opacity-70" : ""
                  }`}
                >
                  {/* Fecha */}
                  <div className="text-center min-w-[70px] bg-tinta/80 rounded-lg py-2 px-3 border border-crema/20">
                    <p className="text-2xl font-black text-crema">{fecha.getDate()}</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-crema/70">
                      {fecha.toLocaleString("es-AR", { month: "short" })}
                    </p>
                    <p className="text-[10px] text-crema/50">{fecha.getFullYear()}</p>
                  </div>

                  {/* Datos principales */}
                  <div className="flex-grow min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${situacion.clase}`}
                      >
                        {situacion.texto}
                      </span>
                      {e.genero && (
                        <span className="text-xs text-crema/60 uppercase font-bold">{e.genero}</span>
                      )}
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-crema truncate">{e.nombre}</h2>
                    <p className="text-sm text-crema/70 truncate">
                      📍 {e.lugar}, <strong className="text-crema/80">{e.ciudad}</strong>
                      {e.hora_apertura ? ` · ${e.hora_apertura} hs` : ""}
                    </p>
                  </div>

                  {/* Precio y reservas */}
                  <div className="text-sm sm:text-right space-y-1">
                    {e.precio_desde != null && (
                      <p className="text-sol font-bold">{formatearPrecio(e.precio_desde)}</p>
                    )}
                    {e.cant_entradas != null && (
                      <p className="text-crema/70">
                        Reservadas: <strong className="text-crema">{reservadas}</strong> / {e.cant_entradas}
                      </p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <Link
                      to={`/evento/${e.id_evento}`}
                      className="px-4 py-1.5 rounded-full border border-crema/30 text-crema/80 hover:border-fucsia hover:text-crema text-sm font-bold transition"
                    >
                      Ver
                    </Link>
                    {modificable && (
                      <Link
                        to={`/eventos/${e.id_evento}/editar`}
                        className="px-4 py-1.5 rounded-full bg-fucsia hover:bg-chicle text-tinta text-sm font-bold transition"
                      >
                        Editar
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
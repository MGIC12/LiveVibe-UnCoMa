import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ImagenEvento from "../components/ImagenEvento";
import Paginacion from "../components/Paginacion";
import { usePaginacion } from "../utils/paginacion";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { API } from "../utils/api";
import { formatearPrecio } from "../utils/formularios";
import { primeraMayuscula } from "../utils/tiempo";
import { descargarICS } from "../utils/calendario";
import { EsqueletoLista } from "../components/Esqueleto";
import { textoEntradas } from "../utils/reservas";

const POR_PAGINA = 6; // 3 columnas x 2 filas en pantallas grandes

const PESTANAS = [
  {
    id: "proximas",
    texto: "Próximas",
    vacio: "No tenés entradas para próximos shows.",
  },
  {
    id: "pasadas",
    texto: "Pasadas",
    vacio: "Todavía no tenés entradas de shows que ya pasaron.",
  },
  {
    id: "canceladas",
    texto: "Canceladas",
    vacio: "No tenés reservas canceladas.",
  },
];

// En cuál de las tres pestañas va cada reserva
function categoria(r, hoy) {
  if (r.estado === "cancelada" || r.evento_estado === "cancelado")
    return "canceladas";
  return r.evento_fecha < hoy ? "pasadas" : "proximas";
}

function EtiquetaEstado({ r }) {
  const cancelado = r.evento_estado === "cancelado" || r.estado === "cancelada";
  const texto =
    r.evento_estado === "cancelado"
      ? "Evento cancelado"
      : primeraMayuscula(r.estado);
  return (
    <span
      className={`px-3 py-1 text-xs font-bold uppercase rounded-full border backdrop-blur-sm ${
        cancelado
          ? "bg-tinta/80 text-mandarina border-mandarina"
          : r.estado === "asistió"
            ? "bg-tinta/80 text-sol border-sol"
            : "bg-tinta/80 text-cielo border-cielo"
      }`}
    >
      {texto}
    </span>
  );
}

function TarjetaEntrada({ r, hoy, onCancelar }) {
  const eventoCancelado = r.evento_estado === "cancelado";
  const reservaCancelada = r.estado === "cancelada";
  const puedeCancelar =
    !reservaCancelada && !eventoCancelado && r.evento_fecha >= hoy;
  const fecha = new Date(`${r.evento_fecha}T00:00:00`);
  const cantidad = r.cantidad ?? 1;
  const lugar = [r.lugar, r.ciudad].filter(Boolean).join(", ");

  return (
    <article
      className={`bg-crema/5 border border-crema/20 rounded-2xl overflow-hidden flex flex-col transition hover:border-fucsia/50 ${
        eventoCancelado || reservaCancelada ? "opacity-80" : ""
      }`}
    >
      {/* Portada con la fecha y el estado encima */}
      <Link
        to={`/evento/${r.id_evento}`}
        className="relative block"
        aria-label={`Ver ${r.evento_nombre}`}
      >
        <ImagenEvento
          evento={{
            id_evento: r.id_evento,
            nombre: r.evento_nombre,
            imagen_url: r.imagen_url,
          }}
          className="w-full aspect-[16/8] object-cover"
        />
        <span className="absolute top-3 left-3 w-12 text-center bg-tinta/85 border border-crema/25 rounded-xl py-1 backdrop-blur-sm">
          <span className="block text-xl font-black leading-none">
            {fecha.getDate()}
          </span>
          <span className="block text-[10px] font-bold uppercase text-crema/70">
            {fecha.toLocaleString("es-AR", { month: "short" }).replace(".", "")}
          </span>
        </span>
        <span className="absolute top-3 right-3">
          <EtiquetaEstado r={r} />
        </span>
      </Link>

      <div className="p-4 flex flex-col gap-3 flex-grow">
        <div className="space-y-1 min-w-0">
          <Link
            to={`/evento/${r.id_evento}`}
            className="block text-lg font-bold leading-tight text-crema hover:text-cielo transition-colors line-clamp-2"
          >
            {r.evento_nombre}
          </Link>
          {lugar && (
            <p className="text-sm text-crema/70 truncate">📍 {lugar}</p>
          )}
          <p className="text-sm text-crema/70">
            📅{" "}
            {primeraMayuscula(
              fecha.toLocaleDateString("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              }),
            )}
            {r.hora_apertura ? ` · ${r.hora_apertura} hs` : ""}
          </p>
          {eventoCancelado && (
            <p className="text-mandarina text-sm">
              El artista canceló este evento.
            </p>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-crema/10 pt-3">
          <p className="text-sm font-semibold text-crema/80">
            🎟️ {textoEntradas(cantidad)}
          </p>
          {r.precio != null && (
            <p className="text-right">
              <span className="block text-sol font-black text-lg leading-none">
                {formatearPrecio(r.precio * cantidad)}
              </span>
              {cantidad > 1 && (
                <span className="text-[11px] text-crema/60">
                  {formatearPrecio(r.precio)} c/u
                </span>
              )}
            </p>
          )}
        </div>

        {puedeCancelar && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                descargarICS({
                  id: r.id_evento,
                  nombre: r.evento_nombre,
                  fecha: r.evento_fecha,
                  hora: r.hora_apertura,
                  lugar: r.lugar,
                  ciudad: r.ciudad,
                  url: `${window.location.origin}/evento/${r.id_evento}`,
                })
              }
              className="border border-cielo text-cielo hover:bg-cielo hover:text-tinta font-bold py-2 rounded-full transition text-sm"
            >
              📅 Calendario
            </button>
            <button
              onClick={() => onCancelar(r.id_reserva)}
              className="border border-mandarina text-mandarina hover:bg-mandarina hover:text-tinta font-bold py-2 rounded-full transition text-sm"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

const MisReservas = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pestana, setPestana] = useState(null); // null = todavía no se eligió una
  const { token } = useAuth();
  const toast = useToast();

  const cargarReservas = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/reservas/mis-reservas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setReservas(await res.json());
    } catch (error) {
      console.error("Error al cargar reservas:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    cargarReservas();
  }, [cargarReservas]);

  const handleCancelar = async (id) => {
    if (!window.confirm("¿Estás seguro de cancelar esta reserva?")) return;

    try {
      const res = await fetch(`${API}/api/reservas/${id}/cancelar`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.exito("Reserva cancelada.");
        cargarReservas(); // Recargar la lista
      } else {
        toast.error(data.error || "No se pudo cancelar la reserva.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error de conexión. Probá de nuevo.");
    }
  };

  const hoy = new Date().toLocaleDateString("en-CA");

  // Próximas: la más cercana primero. Pasadas y canceladas: la más reciente primero.
  const grupos = useMemo(() => {
    const g = { proximas: [], pasadas: [], canceladas: [] };
    for (const r of reservas) g[categoria(r, hoy)].push(r);
    g.proximas.sort((a, b) => a.evento_fecha.localeCompare(b.evento_fecha));
    g.pasadas.sort((a, b) => b.evento_fecha.localeCompare(a.evento_fecha));
    g.canceladas.sort((a, b) => b.evento_fecha.localeCompare(a.evento_fecha));
    return g;
  }, [reservas, hoy]);

  // Si no eligió pestaña, se abre la primera que tenga algo
  const activa =
    pestana ?? PESTANAS.find((p) => grupos[p.id].length > 0)?.id ?? "proximas";
  const lista = grupos[activa];
  const pag = usePaginacion(lista, POR_PAGINA);
  const total = reservas.reduce(
    (s, r) => (categoria(r, hoy) === "proximas" ? s + (r.cantidad ?? 1) : s),
    0,
  );

  function elegir(id) {
    setPestana(id);
    pag.setPagina(1);
  }

  return (
    <div className="min-h-screen bg-tinta text-crema flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 pt-28 pb-12 max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-4xl font-black text-crema">
              Mis <span className="text-fucsia">Entradas</span>
            </h1>
            {!loading && total > 0 && (
              <p className="text-crema/70 mt-1">
                Tenés {textoEntradas(total)} para próximos shows.
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <EsqueletoLista texto="Cargando tus entradas..." />
        ) : reservas.length === 0 ? (
          <div className="bg-crema/5 p-10 rounded-2xl text-center border border-crema/20">
            <p className="text-xl mb-4 text-crema/80">
              Todavía no tenés entradas reservadas.
            </p>
            <Link
              to="/"
              className="inline-block bg-fucsia hover:bg-chicle text-tinta px-6 py-3 rounded-full font-bold transition-colors"
            >
              Explorar eventos
            </Link>
          </div>
        ) : (
          <>
            <div
              role="tablist"
              aria-label="Estado de las entradas"
              className="flex flex-wrap gap-2 mb-6"
            >
              {PESTANAS.map((p) => (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={activa === p.id}
                  onClick={() => elegir(p.id)}
                  className={`px-4 py-2 rounded-full text-sm font-bold border transition ${
                    activa === p.id
                      ? "bg-fucsia border-fucsia text-tinta"
                      : "border-crema/25 text-crema/80 hover:border-fucsia hover:text-fucsia"
                  }`}
                >
                  {p.texto}{" "}
                  <span
                    className={
                      activa === p.id ? "text-tinta/70" : "text-crema/50"
                    }
                  >
                    {grupos[p.id].length}
                  </span>
                </button>
              ))}
            </div>

            <div id="lista-reservas" className="scroll-mt-28">
              {lista.length === 0 ? (
                <p className="bg-crema/5 border border-crema/20 rounded-2xl p-8 text-center text-crema/70">
                  {PESTANAS.find((p) => p.id === activa).vacio}
                </p>
              ) : (
                <>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {pag.visibles.map((r) => (
                      <TarjetaEntrada
                        key={r.id_reserva}
                        r={r}
                        hoy={hoy}
                        onCancelar={handleCancelar}
                      />
                    ))}
                  </div>
                  <Paginacion
                    pagina={pag.pagina}
                    total={pag.total}
                    desde={pag.desde}
                    hasta={pag.hasta}
                    cantidad={lista.length}
                    etiqueta="reservas"
                    onCambiar={pag.setPagina}
                    anclaId="lista-reservas"
                  />
                </>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MisReservas;

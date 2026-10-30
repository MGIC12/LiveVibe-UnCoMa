import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";

const TIPOS = {
  nuevo_seguidor: { icono: "👤", titulo: "Nuevo seguidor" },
  nueva_reserva: { icono: "🎟️", titulo: "Nueva reserva" },
  entradas_agotadas: { icono: "🔥", titulo: "Entradas agotadas" },
  evento_nuevo: { icono: "🎤", titulo: "Evento nuevo" },
  evento_modificado: { icono: "✏️", titulo: "Evento modificado" },
  evento_cancelado: { icono: "⚠️", titulo: "Evento cancelado" },
};

// A dónde lleva cada aviso al tocarlo
function destino(n) {
  if (n.id_evento) return `/evento/${n.id_evento}`;
  if (n.tipo === "nuevo_seguidor" && n.nombre_origen) {
    return `/usuario/${encodeURIComponent(n.nombre_origen)}`;
  }
  return null;
}

const avisarAlNavbar = () => window.dispatchEvent(new Event("notificaciones:actualizadas"));

export default function Notificaciones() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [soloNoLeidas, setSoloNoLeidas] = useState(false);

  useEffect(() => {
    let activo = true;
    fetch(`${API}/api/notificaciones`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "No se pudieron cargar las notificaciones");
        return data;
      })
      .then((data) => {
        if (activo) setLista(data);
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

  async function marcarLeida(n) {
    if (n.leida) return;
    // Se actualiza la pantalla enseguida, sin esperar al servidor
    setLista((actual) =>
      actual.map((x) => (x.id_notificacion === n.id_notificacion ? { ...x, leida: true } : x)),
    );
    try {
      await fetch(`${API}/api/notificaciones/${n.id_notificacion}/leida`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      avisarAlNavbar();
    } catch {
      /* si falla, se vuelve a ver como no leída al recargar */
    }
  }

  function abrir(n) {
    marcarLeida(n);
    const ruta = destino(n);
    if (ruta) navigate(ruta);
  }

  async function marcarTodas() {
    setLista((actual) => actual.map((x) => ({ ...x, leida: true })));
    try {
      await fetch(`${API}/api/notificaciones/leer-todas`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      avisarAlNavbar();
    } catch {
      /* igual que arriba */
    }
  }

  const noLeidas = lista.filter((n) => !n.leida).length;
  const visibles = soloNoLeidas ? lista.filter((n) => !n.leida) : lista;

  return (
    <div className="min-h-screen bg-tinta text-crema font-sans flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 pt-28 pb-16 w-full max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl sm:text-4xl font-black text-crema">
            Notificaciones{" "}
            {noLeidas > 0 && (
              <span className="text-base font-bold text-fucsia">({noLeidas} sin leer)</span>
            )}
          </h1>

          <div className="flex gap-2">
            <button
              onClick={() => setSoloNoLeidas((v) => !v)}
              aria-pressed={soloNoLeidas}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${
                soloNoLeidas
                  ? "bg-fucsia text-tinta"
                  : "bg-crema/10 text-crema/80 hover:bg-crema/20"
              }`}
            >
              Solo no leídas
            </button>
            <button
              onClick={marcarTodas}
              disabled={noLeidas === 0}
              className="px-4 py-1.5 rounded-full text-sm font-bold border border-crema/30 text-crema/80 hover:border-fucsia hover:text-crema transition disabled:opacity-40 disabled:hover:border-crema/30"
            >
              Marcar todas como leídas
            </button>
          </div>
        </div>

        {cargando ? (
          <p className="text-crema/70 py-12 text-center animate-pulse">Cargando notificaciones...</p>
        ) : error ? (
          <p className="text-mandarina text-center py-12" role="alert">
            {error}
          </p>
        ) : visibles.length === 0 ? (
          <div className="text-center bg-crema/5 border border-crema/20 rounded-2xl p-10 text-crema/70">
            {soloNoLeidas ? "No tenés notificaciones sin leer." : "Todavía no tenés notificaciones."}
          </div>
        ) : (
          <ul className="space-y-3">
            {visibles.map((n) => {
              const tipo = TIPOS[n.tipo] ?? { icono: "🔔", titulo: "Aviso" };
              return (
                <li key={n.id_notificacion}>
                  <button
                    onClick={() => abrir(n)}
                    className={`w-full text-left flex items-start gap-4 rounded-xl p-4 border transition ${
                      n.leida
                        ? "bg-crema/5 border-crema/20 hover:bg-crema/10"
                        : "bg-fucsia/10 border-fucsia/50 hover:bg-fucsia/20"
                    }`}
                  >
                    <span className="text-2xl">{tipo.icono}</span>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-cielo">
                        {tipo.titulo}
                      </p>
                      <p className="text-crema/90">{n.mensaje}</p>
                      <p className="text-xs text-crema/50 mt-1">
                        {new Date(n.fecha).toLocaleString("es-AR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    {!n.leida && (
                      <span
                        className="mt-1.5 w-2.5 h-2.5 rounded-full bg-fucsia shrink-0"
                        aria-label="No leída"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  );
}
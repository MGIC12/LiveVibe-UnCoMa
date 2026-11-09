import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../utils/api";

const getToken = () => localStorage.getItem("token");
const rutaEvento = (id) => `/evento/${id}`;

// Cuántos mensajes anteriores se mandan a la IA para que entienda "ese", "el primero", etc.
const MENSAJES_DE_CONTEXTO = 8;

// Animaciones propias
const estilos = `
@keyframes cb-pop { from { opacity: 0; transform: translateY(16px) scale(.96); } to { opacity: 1; transform: none; } }
@keyframes cb-msg { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes cb-dot { 0%, 80%, 100% { opacity: .3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
@keyframes cb-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(168,85,247,.5); } 50% { box-shadow: 0 0 0 12px rgba(168,85,247,0); } }
.cb-pop { animation: cb-pop .25s ease-out; }
.cb-msg { animation: cb-msg .25s ease-out; }
.cb-dot { animation: cb-dot 1.2s infinite ease-in-out; }
.cb-glow { animation: cb-glow 2.4s infinite; }
.cb-scroll::-webkit-scrollbar { width: 6px; }
.cb-scroll::-webkit-scrollbar-thumb { background: rgba(168,85,247,.35); border-radius: 9999px; }
`;

const Chatbot = () => {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([
    {
      texto: "¡Hola! Soy tu asistente de LiveVibe. ¿Qué recital buscás? También puedo mostrarte tus reservas o ayudarte a reservar.",
      emisor: "ia",
    },
  ]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const cuerpoRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll al último mensaje (al enviar, al responder y al abrir el chat)
  useEffect(() => {
    const el = cuerpoRef.current;
    if (!el) return;
    requestAnimationFrame(() =>
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }),
    );
  }, [mensajes, cargando, abierto]);

  useEffect(() => {
    if (abierto) inputRef.current?.focus();
  }, [abierto]);

  const enviarMensaje = async () => {
    if (!input.trim() || cargando) return;

    const textoUsuario = input.trim();
    // Lo conversado hasta ahora (sin el saludo inicial), para darle contexto a la IA
    const historial = mensajes
      .slice(1)
      .slice(-MENSAJES_DE_CONTEXTO)
      .map((m) => ({ rol: m.emisor === "ia" ? "model" : "user", texto: m.texto }));
    setInput("");
    setMensajes((prev) => [
      ...prev,
      { texto: textoUsuario, emisor: "usuario" },
    ]);
    setCargando(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000);

    try {
      const token = getToken();
      const response = await fetch(`${API}/api/ia/chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ mensaje: textoUsuario, historial }),
        signal: controller.signal,
      });

      const data = await response.json();
      const texto =
        data.respuesta ||
        data.error ||
        "No pude obtener una respuesta en este momento.";

      setMensajes((prev) => [
        ...prev,
        {
          texto,
          emisor: "ia",
          eventos: data.eventos ?? [],
          // Reservas propuestas por la IA: se concretan solo si la persona confirma
          acciones: (data.acciones ?? []).map((a) => ({ ...a, estado: "pendiente" })),
        },
      ]);
    } catch (error) {
      console.error("Error al conectar con el chatbot:", error);
      const texto =
        error.name === "AbortError"
          ? "La respuesta tardó demasiado. Probá de nuevo."
          : "Error de conexión con el servidor de asistencia.";
      setMensajes((prev) => [...prev, { texto, emisor: "ia" }]);
    } finally {
      clearTimeout(timeoutId);
      setCargando(false);
    }
  };

  // Confirma una reserva propuesta por el asistente (usa la ruta normal de reservas)
  const confirmarReserva = async (idxMensaje, idEvento) => {
    const marcar = (cambios) =>
      setMensajes((prev) =>
        prev.map((m, i) =>
          i !== idxMensaje
            ? m
            : {
                ...m,
                acciones: m.acciones.map((a) =>
                  a.id_evento === idEvento ? { ...a, ...cambios } : a,
                ),
              },
        ),
      );

    marcar({ estado: "enviando" });
    try {
      const res = await fetch(`${API}/api/eventos/${idEvento}/reservar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        marcar({ estado: "listo" });
      } else {
        marcar({ estado: "error", error: data.error || "No se pudo reservar." });
      }
    } catch {
      marcar({ estado: "error", error: "Error de conexión. Probá de nuevo." });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <style>{estilos}</style>

      {abierto ? (
        <div className="cb-pop w-80 sm:w-96 h-[28rem] flex flex-col overflow-hidden rounded-3xl border border-purple-400/30 bg-gray-900/80 backdrop-blur-xl shadow-2xl shadow-purple-900/40">
          {/* Cabecera */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600/90 to-fuchsia-600/70 text-white">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="font-semibold tracking-wide">
                Asistente LiveVibe
              </span>
            </div>
            <button
              onClick={() => setAbierto(false)}
              aria-label="Cerrar chat"
              className="h-7 w-7 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition"
            >
              ✕
            </button>
          </div>

          {/* Mensajes */}
          <div
            ref={cuerpoRef}
            className="cb-scroll flex-1 px-3 py-4 overflow-y-auto space-y-3 flex flex-col"
          >
            {mensajes.map((msg, idx) => (
              <div
                key={idx}
                className={`cb-msg max-w-[85%] ${
                  msg.emisor === "ia" ? "self-start" : "self-end"
                }`}
              >
                <div
                  className={`px-4 py-2.5 text-sm whitespace-pre-wrap text-white shadow-md ${
                    msg.emisor === "ia"
                      ? "rounded-2xl rounded-bl-md bg-white/10 border border-white/10 backdrop-blur-sm"
                      : "rounded-2xl rounded-br-md bg-gradient-to-br from-purple-500 to-purple-700 shadow-purple-900/40"
                  }`}
                >
                  {msg.texto}
                </div>

                {msg.eventos?.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    {msg.eventos.map((ev) => (
                      <Link
                        key={ev.id_evento}
                        to={rutaEvento(ev.id_evento)}
                        className="text-xs rounded-full px-3 py-1.5 bg-purple-500/20 border border-purple-400/40 text-purple-100 hover:bg-purple-500/40 hover:-translate-y-0.5 transition"
                      >
                        🎟️ Ver y reservar: {ev.nombre}
                      </Link>
                    ))}
                  </div>
                )}

                {msg.acciones?.map((a) => (
                  <div
                    key={a.id_evento}
                    className="mt-2 rounded-2xl border border-fuchsia-400/40 bg-fuchsia-500/10 p-3 text-sm text-white"
                  >
                    <p className="font-semibold">{a.nombre}</p>
                    <p className="text-xs text-white/70">
                      {a.fecha}
                      {a.lugar ? ` · ${a.lugar}` : ""}
                    </p>
                    {a.estado === "listo" ? (
                      <p className="mt-2 text-emerald-300">
                        ✅ ¡Reserva confirmada!{" "}
                        <Link to="/mis-reservas" className="underline">
                          Ver mis entradas
                        </Link>
                      </p>
                    ) : (
                      <>
                        <button
                          onClick={() => confirmarReserva(idx, a.id_evento)}
                          disabled={a.estado === "enviando"}
                          className="mt-2 w-full rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 py-1.5 text-xs font-bold hover:opacity-90 transition disabled:opacity-50"
                        >
                          {a.estado === "enviando" ? "Reservando..." : "Confirmar reserva"}
                        </button>
                        {a.estado === "error" && (
                          <p className="mt-1 text-xs text-red-300">{a.error}</p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {cargando && (
              <div className="cb-msg self-start rounded-2xl rounded-bl-md bg-white/10 border border-white/10 px-4 py-3 flex gap-1.5">
                {[0, 0.15, 0.3].map((d) => (
                  <span
                    key={d}
                    className="cb-dot h-2 w-2 rounded-full bg-purple-300"
                    style={{ animationDelay: `${d}s` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Entrada */}
          <div className="p-3 border-t border-white/10 bg-black/20">
            <div className="flex items-center gap-2 rounded-full bg-white/10 border border-white/10 pl-4 pr-1.5 py-1.5 focus-within:border-purple-400/70 focus-within:bg-white/15 transition">
              <input
                ref={inputRef}
                type="text"
                value={input}
                maxLength={500}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
                placeholder="Preguntá sobre recitales..."
                className="flex-1 bg-transparent text-white placeholder-gray-400 text-sm focus:outline-none"
              />
              <button
                onClick={enviarMensaje}
                disabled={cargando || !input.trim()}
                aria-label="Enviar"
                className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition disabled:opacity-40 disabled:hover:scale-100"
              >
                ➔
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAbierto(true)}
          aria-label="Abrir chat"
          className="cb-glow w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center text-2xl shadow-2xl shadow-purple-900/50 hover:scale-110 active:scale-95 transition"
        >
          💬
        </button>
      )}
    </div>
  );
};

export default Chatbot;

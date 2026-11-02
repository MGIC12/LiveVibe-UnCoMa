import { useEffect, useRef, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
// Ajustá estas dos líneas a tu app:
const getToken = () => localStorage.getItem("token");
const rutaEvento = (id) => `/eventos/${id}`;

// Animaciones propias (no requieren tocar la config de Tailwind)
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
      texto: "¡Hola! Soy tu asistente de LiveVibe. ¿Qué recital buscas?",
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

    const textoUsuario = input;
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
        body: JSON.stringify({ mensaje: textoUsuario }),
        signal: controller.signal,
      });

      const data = await response.json();
      const texto =
        data.respuesta ||
        data.error ||
        "No pude obtener una respuesta en este momento.";

      setMensajes((prev) => [
        ...prev,
        { texto, emisor: "ia", eventos: data.eventos ?? [] },
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
                      <a
                        key={ev.id_evento}
                        href={rutaEvento(ev.id_evento)}
                        className="text-xs rounded-full px-3 py-1.5 bg-purple-500/20 border border-purple-400/40 text-purple-100 hover:bg-purple-500/40 hover:-translate-y-0.5 transition"
                      >
                        🎟️ Ver y reservar: {ev.nombre}
                      </a>
                    ))}
                  </div>
                )}
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
                placeholder="Pregunta sobre recitales..."
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

import { useState } from "react";

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
      const response = await fetch("http://localhost:5000/api/ia/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: textoUsuario }),
        signal: controller.signal,
      });

      const data = await response.json();
      const textoRespuesta =
        data.respuesta ||
        data.error ||
        "No pude obtener una respuesta en este momento.";

      setMensajes((prev) => [...prev, { texto: textoRespuesta, emisor: "ia" }]);
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
      {abierto ? (
        <div className="bg-gray-800 border border-purple-500 w-80 h-96 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Cabecera */}
          <div className="bg-purple-600 text-white p-3 font-bold flex justify-between items-center">
            <span>Asistente LiveVibe</span>
            <button
              onClick={() => setAbierto(false)}
              className="hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* Cuerpo de mensajes */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-900 flex flex-col">
            {mensajes.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg text-sm max-w-[85%] whitespace-pre-wrap ${
                  msg.emisor === "ia"
                    ? "bg-gray-700 text-white self-start"
                    : "bg-purple-600 text-white self-end ml-auto"
                }`}
              >
                {msg.texto}
              </div>
            ))}
            {cargando && (
              <div className="bg-gray-700 text-gray-300 p-3 rounded-lg text-sm self-start animate-pulse italic">
                Escribiendo respuesta...
              </div>
            )}
          </div>

          {/* Input de texto */}
          <div className="p-3 bg-gray-800 border-t border-gray-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
              placeholder="Pregunta sobre recitales..."
              className="flex-1 bg-gray-900 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 border border-gray-700"
            />
            <button
              onClick={enviarMensaje}
              disabled={cargando}
              className="bg-purple-600 text-white px-4 py-2 rounded font-bold hover:bg-purple-500 transition disabled:opacity-50"
            >
              ➔
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAbierto(true)}
          className="bg-purple-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl hover:bg-purple-500 transition transform hover:scale-105"
        >
          💬
        </button>
      )}
    </div>
  );
};

export default Chatbot;

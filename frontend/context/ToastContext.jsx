import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

// Avisos breves que aparecen abajo a la izquierda y se van solos (reemplazan a alert()).
//   const toast = useToast();
//   toast.exito("Reserva cancelada");  toast.error("No se pudo…");
//   toast.aviso("Se guardó, pero…");   toast.info("Iniciá sesión para…");

const ToastContext = createContext({
  exito: () => {},
  error: () => {},
  aviso: () => {},
  info: () => {},
});

const DURACION_MS = 4500;
const MAX_VISIBLES = 4;

const ESTILOS = {
  exito: { clases: "border-emerald-400/60 bg-emerald-950/90 text-emerald-100", icono: "✅" },
  error: { clases: "border-red-400/60 bg-red-950/90 text-red-100", icono: "⚠️" },
  aviso: { clases: "border-sol/60 bg-yellow-950/90 text-yellow-100", icono: "💡" },
  info: { clases: "border-cielo/60 bg-sky-950/90 text-sky-100", icono: "ℹ️" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const siguiente = useRef(1);

  const quitar = useCallback((id) => {
    setToasts((actuales) => actuales.filter((t) => t.id !== id));
  }, []);

  const mostrar = useCallback(
    (tipo, texto) => {
      if (!texto) return;
      const id = siguiente.current++;
      setToasts((actuales) => [...actuales.slice(-(MAX_VISIBLES - 1)), { id, tipo, texto }]);
      setTimeout(() => quitar(id), DURACION_MS);
    },
    [quitar],
  );

  const api = useMemo(
    () => ({
      exito: (texto) => mostrar("exito", texto),
      error: (texto) => mostrar("error", texto),
      aviso: (texto) => mostrar("aviso", texto),
      info: (texto) => mostrar("info", texto),
    }),
    [mostrar],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="fixed z-[60] bottom-4 left-4 right-4 sm:right-auto sm:w-96 flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tipo === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md animate-[toast-entrada_0.25s_ease-out] ${ESTILOS[t.tipo].clases}`}
          >
            <span aria-hidden="true">{ESTILOS[t.tipo].icono}</span>
            <p className="flex-1 leading-snug">{t.texto}</p>
            <button
              type="button"
              onClick={() => quitar(t.id)}
              aria-label="Cerrar aviso"
              className="opacity-60 hover:opacity-100 transition"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

// Ventana de confirmación. Se cierra con "Cancelar", con Esc o tocando fuera de la ventana
// (salvo mientras "procesando" es verdadero: ahí queda bloqueada hasta que termine).
export default function ModalConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  procesando = false,
  onConfirmar,
  onCancelar,
}) {
  const idTitulo = useId();
  const idMensaje = useId();
  const ventana = useRef(null);
  const botonCancelar = useRef(null);

  // Siempre se usan los valores más recientes, sin reiniciar el efecto de abajo
  const cancelarRef = useRef(onCancelar);
  const procesandoRef = useRef(procesando);
  useEffect(() => {
    cancelarRef.current = onCancelar;
    procesandoRef.current = procesando;
  });

  useEffect(() => {
    if (!abierto) return;

    const anterior = document.activeElement; // para devolverle el foco al cerrar
    botonCancelar.current?.focus(); // el foco empieza en la opción segura

    const alTeclear = (e) => {
      if (e.key === "Escape") {
        if (!procesandoRef.current) cancelarRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      // El foco no sale de la ventana: de la última opción vuelve a la primera, y al revés
      const enfocables = ventana.current?.querySelectorAll(
        "button:not([disabled]), [href], input, select, textarea",
      );
      if (!enfocables || enfocables.length === 0) return;
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener("keydown", alTeclear);
    document.body.style.overflow = "hidden"; // la página de atrás no se desplaza

    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = "";
      anterior?.focus?.();
    };
  }, [abierto]);

  if (!abierto) return null;

  // Se dibuja con un portal, directamente en <body>: la barra de navegación tiene un
  // desenfoque (backdrop-blur) que haría que una ventana "fija" quede recortada dentro de ella.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-tinta/80 backdrop-blur-sm"
      onClick={procesando ? undefined : onCancelar}
    >
      <div
        ref={ventana}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idMensaje}
        aria-busy={procesando}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-tinta border border-crema/25 rounded-2xl p-6 shadow-2xl space-y-4"
      >
        <h2 id={idTitulo} className="text-xl font-black text-crema">
          {titulo}
        </h2>
        <p id={idMensaje} className="text-sm text-crema/70">
          {mensaje}
        </p>

        <div className="flex gap-3 pt-2">
          <button
            ref={botonCancelar}
            type="button"
            onClick={onCancelar}
            disabled={procesando}
            className="flex-1 py-2.5 rounded-full border border-crema/30 text-crema hover:border-fucsia hover:text-fucsia font-bold transition disabled:opacity-50"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={procesando}
            className="flex-1 py-2.5 rounded-full bg-fucsia hover:bg-chicle text-tinta font-bold transition disabled:opacity-50"
          >
            {procesando ? "Procesando..." : textoConfirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
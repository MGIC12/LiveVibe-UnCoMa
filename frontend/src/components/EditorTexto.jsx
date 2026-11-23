import { useEffect, useId, useRef, useState } from "react";

// Editor en línea para el texto de una publicación o de un comentario.
// onGuardar(texto) tiene que devolver una promesa: si falla, el mensaje se muestra acá.
// Si sale bien, quien lo usa cierra el editor.
export default function EditorTexto({ valorInicial, maximo, etiqueta, onGuardar, onCancelar }) {
  const idCampo = useId();
  const campo = useRef(null);
  const [texto, setTexto] = useState(valorInicial);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Al abrir el editor, el cursor queda al final del texto
  useEffect(() => {
    const el = campo.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  const limpio = texto.trim();
  const puedeGuardar = !guardando && limpio !== "" && limpio !== valorInicial.trim();

  async function guardar(e) {
    e.preventDefault();
    if (!puedeGuardar) return;
    setError("");
    setGuardando(true);
    try {
      await onGuardar(limpio);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-2">
      <label htmlFor={idCampo} className="sr-only">
        {etiqueta}
      </label>
      <textarea
        id={idCampo}
        ref={campo}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onCancelar()}
        rows={3}
        maxLength={maximo}
        className="w-full px-3 py-2 rounded-xl bg-crema/10 border border-crema/25 text-crema text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cielo"
      />

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-crema/60">
          {texto.length}/{maximo}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancelar}
            disabled={guardando}
            className="px-4 py-1.5 rounded-full border border-crema/30 text-crema/80 hover:border-crema text-sm font-bold disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!puedeGuardar}
            className="px-4 py-1.5 rounded-full bg-fucsia hover:bg-chicle text-tinta text-sm font-bold disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-mandarina text-sm" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
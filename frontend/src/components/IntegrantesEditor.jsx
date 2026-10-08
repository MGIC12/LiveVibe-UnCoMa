import {
  inputClase,
  labelClase,
  INTEGRANTE_VACIO,
  MIN_INTEGRANTES,
  MAX_INTEGRANTES,
} from "../utils/formularios";

export default function IntegrantesEditor({ integrantes, onChange }) {
  function agregar() {
    if (integrantes.length < MAX_INTEGRANTES) {
      onChange([...integrantes, { ...INTEGRANTE_VACIO }]);
    }
  }

  function quitar(indice) {
    onChange(integrantes.filter((_, i) => i !== indice));
  }

  function cambiar(indice, campo, valor) {
    onChange(
      integrantes.map((it, i) => (i === indice ? { ...it, [campo]: valor } : it))
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white">
        Integrantes ({integrantes.length}/{MAX_INTEGRANTES})
      </h3>

      {integrantes.map((it, indice) => (
        <div
          key={indice}
          className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-purple-400 text-sm font-semibold">
              Integrante {indice + 1}
            </span>
            {integrantes.length > MIN_INTEGRANTES && (
              <button
                type="button"
                onClick={() => quitar(indice)}
                className="text-xs text-gray-400 hover:text-red-400"
              >
                Quitar
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={labelClase}>
              Nombre
              <input
                value={it.nombre}
                onChange={(e) => cambiar(indice, "nombre", e.target.value)}
                maxLength={100}
                required
                className={inputClase}
              />
            </label>
            <label className={labelClase}>
              Apellido
              <input
                value={it.apellido}
                onChange={(e) => cambiar(indice, "apellido", e.target.value)}
                maxLength={100}
                required
                className={inputClase}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={labelClase}>
              Instrumento
              <input
                value={it.instrumento}
                onChange={(e) => cambiar(indice, "instrumento", e.target.value)}
                maxLength={60}
                className={inputClase}
              />
            </label>
            <label className={labelClase}>
              Nacionalidad
              <input
                value={it.nacionalidad}
                onChange={(e) => cambiar(indice, "nacionalidad", e.target.value)}
                maxLength={60}
                className={inputClase}
              />
            </label>
          </div>

          <label className={labelClase}>
            Fecha de nacimiento
            <input
              type="date"
              value={it.fecha_nac}
              onChange={(e) => cambiar(indice, "fecha_nac", e.target.value)}
              className={`${inputClase} [color-scheme:dark]`}
            />
          </label>
        </div>
      ))}

      <button
        type="button"
        onClick={agregar}
        disabled={integrantes.length >= MAX_INTEGRANTES}
        className="w-full py-2 rounded-full border border-dashed border-gray-600 text-gray-300 hover:border-purple-500 hover:text-white disabled:opacity-50"
      >
        + Agregar integrante
      </button>
    </div>
  );
}
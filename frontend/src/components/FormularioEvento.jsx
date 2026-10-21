import { useState } from "react";
import { CLASIFICACIONES, inputClase, labelClase } from "../utils/formularios";

export default function FormularioEvento({
  titulo,
  valoresIniciales,
  textoEnviar,
  textoEnviando,
  textoCancelar = "Cancelar",
  onSubmit,
  onCancelar,
}) {
  const [form, setForm] = useState(valoresIniciales);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Fecha de hoy (AAAA-MM-DD), para no permitir elegir días pasados
  const hoy = new Date().toLocaleDateString("en-CA");

  function cambiar(e) {
    setForm((actual) => ({ ...actual, [e.target.name]: e.target.value }));
  }

  // Props que comparten todos los campos
  const campo = (nombre) => ({
    name: nombre,
    value: form[nombre],
    onChange: cambiar,
    className: inputClase,
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await onSubmit(form); // la página decide qué hacer con los datos
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl bg-crema/5 border border-crema/20 rounded-2xl p-8 space-y-5 backdrop-blur-sm"
    >
      <h1 className="text-3xl font-bold text-crema text-center">{titulo}</h1>

      <label className={labelClase}>
        Nombre del evento
        <input {...campo("nombre")} maxLength={255} required />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className={labelClase}>
          Lugar (venue)
          <input {...campo("lugar")} maxLength={255} required />
        </label>
        <label className={labelClase}>
          Ciudad
          <input {...campo("ciudad")} maxLength={100} required />
        </label>

        <label className={labelClase}>
          Fecha
          <input type="date" {...campo("fecha")} min={hoy} required />
        </label>
        <label className={labelClase}>
          Hora de apertura (opcional)
          <input type="time" {...campo("hora_apertura")} />
        </label>

        <label className={labelClase}>
          Precio de la entrada (ARS)
          <input type="number" {...campo("precio")} min="0" step="0.01" required />
        </label>
        <label className={labelClase}>
          Cantidad de entradas
          <input type="number" {...campo("cant_entradas")} min="1" step="1" required />
        </label>
      </div>

      <div className="border-t border-crema/20 pt-5 space-y-4">
        <p className="text-sm text-crema/60">Datos opcionales</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className={labelClase}>
            País
            <input {...campo("pais")} maxLength={100} />
          </label>
          <label className={labelClase}>
            Género
            <input
              {...campo("genero")}
              maxLength={100}
              placeholder="Si lo dejás vacío, se usa el de tu perfil"
            />
          </label>

          <label className={labelClase}>
            Clasificación
            <select {...campo("clasificacion")}>
              <option value="">Sin especificar</option>
              {CLASIFICACIONES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClase}>
            Gira
            <input {...campo("gira")} maxLength={255} />
          </label>
        </div>
      </div>

      {error && (
        <p className="text-mandarina text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancelar}
          disabled={enviando}
          className="flex-1 py-2 rounded-full border border-crema/30 text-crema/80 hover:border-fucsia hover:text-crema disabled:opacity-50"
        >
          {textoCancelar}
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="flex-1 py-2 rounded-full bg-fucsia hover:bg-chicle text-tinta font-bold disabled:opacity-50"
        >
          {enviando ? textoEnviando : textoEnviar}
        </button>
      </div>
    </form>
  );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";
import { inputClase, labelClase } from "../utils/formularios";

// Tiene que coincidir con la lista del backend (routes/eventos.js)
const CLASIFICACIONES = ["Apto todo público", "+13", "+16", "+18"];

const INICIAL = {
  nombre: "",
  lugar: "",
  ciudad: "",
  fecha: "",
  hora_apertura: "",
  precio: "",
  cant_entradas: "",
  pais: "",
  genero: "",
  clasificacion: "",
  gira: "",
};

export default function CrearEvento() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(INICIAL);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Fecha de hoy (AAAA-MM-DD), para no permitir elegir días pasados
  const hoy = new Date().toLocaleDateString("en-CA");

  function cambiar(e) {
    setForm((actual) => ({ ...actual, [e.target.name]: e.target.value }));
  }

  // Props que comparten todos los campos: nombre, valor, manejador y estilo
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
      const res = await fetch(`${API}/api/eventos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo crear el evento");

      navigate(`/evento/${data.id_evento}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="flex justify-center px-4 pt-24 pb-12">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl bg-crema/5border border-crema/20rounded-2xl p-8 space-y-5"
        >
          <h1 className="text-3xl font-bold text-crema text-center">
            Crear evento
          </h1>

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
              <input
                type="date"
                {...campo("fecha")}
                min={hoy}
                required
                className={`${inputClase} [color-scheme:dark]`}
              />
            </label>
            <label className={labelClase}>
              Hora de apertura (opcional)
              <input
                type="time"
                {...campo("hora_apertura")}
                className={`${inputClase} [color-scheme:dark]`}
              />
            </label>

            <label className={labelClase}>
              Precio de la entrada (ARS)
              <input
                type="number"
                {...campo("precio")}
                min="0"
                step="0.01"
                required
              />
            </label>
            <label className={labelClase}>
              Cantidad de entradas
              <input
                type="number"
                {...campo("cant_entradas")}
                min="1"
                step="1"
                required
              />
            </label>
          </div>

          <div className="border-t border-crema/20pt-5 space-y-4">
            <p className="text-sm text-crema/70">Datos opcionales</p>

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
              onClick={() => navigate("/perfil")}
              disabled={enviando}
              className="flex-1 py-2 rounded-full border border-crema/30 text-crema/80  hover:border-fucsia hover:text-crema disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 py-2 rounded-full bg-fucsia hover:bg-chicle text-crema font-bold disabled:opacity-50"
            >
              {enviando ? "Creando evento..." : "Crear evento"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
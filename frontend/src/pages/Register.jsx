import { useState } from "react";
import { Link, useNavigate} from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../components/Navbar";

const inputClase = "mt-1 w-full px-4 py-2 rounded-full bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500";
const labelClase = "block text-sm text-gray-300";

const INICIAL = {
  rol: "fan",
  nombre_usuario: "",
  email: "",
  contrasenia: "",
  confirmar: "",
  fecha_nac: "",
  biografia: "",
  // artista
  nombre_artistico: "",
  nacionalidad: "",
  genero: "",
  tipo_artista: "",
  // fan
  cancion_favorita: "",
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(INICIAL);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  function cambiar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.contrasenia.length < 8) {
      return setError("La contraseña debe tener al menos 8 caracteres");
    }
    if (form.contrasenia !== form.confirmar) {
      return setError("Las contraseñas no coinciden");
    }

    setEnviando(true);
    try {
      const { confirmar, ...datos } = form;
      await register(datos);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const esArtista = form.rol === "artista";

  return (
    <>
      <Navbar />

      <main className="flex justify-center px-4 py-12">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg bg-gray-800 border border-gray-700 rounded-2xl p-8 space-y-5"
        >
          <h1 className="text-3xl font-bold text-white text-center">
            Crear cuenta
          </h1>

          {/* Selector fan / artista */}
          <fieldset>
            <legend className="text-sm text-gray-300 mb-2">
              Quiero registrarme como
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {["fan", "artista"].map((opcion) => (
                <label
                  key={opcion}
                  className={`cursor-pointer text-center py-3 rounded-xl border font-semibold transition ${
                    form.rol === opcion
                      ? "bg-purple-600 border-purple-500 text-white"
                      : "bg-gray-700 border-gray-600 text-gray-300 hover:border-purple-500"
                  }`}
                >
                  <input
                    type="radio"
                    name="rol"
                    value={opcion}
                    checked={form.rol === opcion}
                    onChange={cambiar}
                    className="sr-only"
                  />
                  {opcion === "fan" ? "🎧 Fan" : "🎤 Artista"}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Datos de cuenta */}
          <label className={labelClase}>
            Nombre de usuario
            <input
              name="nombre_usuario"
              value={form.nombre_usuario}
              onChange={cambiar}
              maxLength={30}
              required
              className={inputClase}
            />
          </label>

          <label className={labelClase}>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={cambiar}
              required
              className={inputClase}
            />
          </label>

          <label className={labelClase}>
            Contraseña (mínimo 8 caracteres)
            <input
              type="password"
              name="contrasenia"
              value={form.contrasenia}
              onChange={cambiar}
              autoComplete="new-password"
              required
              className={inputClase}
            />
          </label>

          <label className={labelClase}>
            Repetir contraseña
            <input
              type="password"
              name="confirmar"
              value={form.confirmar}
              onChange={cambiar}
              autoComplete="new-password"
              required
              className={inputClase}
            />
          </label>

          <label className={labelClase}>
            Fecha de nacimiento
            <input
              type="date"
              name="fecha_nac"
              value={form.fecha_nac}
              onChange={cambiar}
              className={`${inputClase} [color-scheme:dark]`}
            />
          </label>

          <label className={labelClase}>
            Biografía (opcional)
            <textarea
              name="biografia"
              value={form.biografia}
              onChange={cambiar}
              rows={3}
              className="mt-1 w-full px-4 py-2 rounded-2xl bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </label>

          {/* Datos según el tipo de cuenta */}
          <div className="border-t border-gray-700 pt-5 space-y-5">
            <h2 className="text-purple-400 font-semibold">
              {esArtista ? "Datos de artista" : "Datos de fan"}
            </h2>

            {esArtista ? (
              <>
                <label className={labelClase}>
                  Nombre artístico
                  <input
                    name="nombre_artistico"
                    value={form.nombre_artistico}
                    onChange={cambiar}
                    required
                    className={inputClase}
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className={labelClase}>
                    Nacionalidad
                    <input
                      name="nacionalidad"
                      value={form.nacionalidad}
                      onChange={cambiar}
                      className={inputClase}
                    />
                  </label>
                  <label className={labelClase}>
                    Género musical
                    <input
                      name="genero"
                      value={form.genero}
                      onChange={cambiar}
                      className={inputClase}
                    />
                  </label>
                </div>

                <label className={labelClase}>
                  Tipo de artista (solista, banda, DJ...)
                  <input
                    name="tipo_artista"
                    value={form.tipo_artista}
                    onChange={cambiar}
                    className={inputClase}
                  />
                </label>
              </>
            ) : (
              <label className={labelClase}>
                Canción favorita
                <input
                  name="cancion_favorita"
                  value={form.cancion_favorita}
                  onChange={cambiar}
                  className={inputClase}
                />
              </label>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-sm" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold disabled:opacity-50"
          >
            {enviando ? "Creando cuenta..." : "Registrarme"}
          </button>

          <p className="text-center text-sm text-gray-400">
            ¿Ya tenés cuenta?{" "}
            <Link to="/login" className="text-purple-400 hover:text-purple-300">
              Iniciá sesión
            </Link>
          </p>
        </form>
      </main>
    </>
  );
}
import { useState } from "react";
import { Link, useNavigate} from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../components/Navbar";
import CamposFan from "../components/CamposFan";
import CamposArtista from "../components/CamposArtista";
import { inputClase, labelClase, FOTO_VACIA} from "../utils/formularios";
import CampoContrasena from "../components/CampoContrasena";
import FotoPerfil from "../components/FotoPerfil";

const INICIAL = {
  foto: FOTO_VACIA,
  rol: "", // vacío = todavía no eligió
  nombre_usuario: "",
  email: "",
  contrasenia: "",
  confirmar: "",
  fecha_nac: "",
  biografia: "",
  // fan
  cancion_favorita: "",
  // artista
  nombre_artistico: "",
  nacionalidad: "",
  genero: "",
  tipo_artista: "solista", // por defecto
  integrantes: [],
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(INICIAL);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  function cambiarCampo(nombre, valor) {
    setForm((actual) => ({ ...actual, [nombre]: valor }));
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

    // Se arma solo lo que corresponde al tipo de cuenta elegido
    const comunes = {
      rol: form.rol,
      nombre_usuario: form.nombre_usuario,
      email: form.email,
      contrasenia: form.contrasenia,
      fecha_nac: form.fecha_nac,
      biografia: form.biografia,
    };

    const datos =
      form.rol === "fan"
        ? { ...comunes, cancion_favorita: form.cancion_favorita }
        : {
            ...comunes,
            nombre_artistico: form.nombre_artistico,
            nacionalidad: form.nacionalidad,
            genero: form.genero,
            tipo_artista: form.tipo_artista,
            integrantes: form.tipo_artista === "banda" ? form.integrantes : [],
          };

    setEnviando(true);
    try {
      const { fotoError } = await register(datos, form.foto.archivo);

      if (fotoError) {
        // La cuenta se creó, pero la foto falló: se avisa en el perfil
        navigate("/perfil", {
          state: {
            aviso: `Tu cuenta se creó, pero no pudimos subir la foto (${fotoError}). Podés intentarlo de nuevo desde acá.`,
          },
        });
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const piePagina = (
    <p className="text-center text-sm text-crema/70">
      ¿Ya tenés cuenta?{" "}
      <Link to="/login" className="text-cielo hover:text-cremahover:text-purple-300">
        Iniciá sesión
      </Link>
    </p>
  );

  /* ---------- PASO 1: elegir tipo de cuenta ---------- */
  if (!form.rol) {
    return (
      <>
        <Navbar />
        <main className="flex justify-center px-4 py-12">
          <div className="w-full max-w-lg bg-crema/5border border-crema/20rounded-2xl p-8 space-y-6">
            <h1 className="text-3xl font-bold text-crema text-center">
              ¿Cómo querés registrarte?
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => cambiarCampo("rol", "fan")}
                className="p-6 rounded-2xl border border-crema/30 bg-crema/10hover:border-fucsia hover:bg-gray-600 transition text-center"
              >
                <span className="block text-4xl mb-2">🎧</span>
                <span className="block text-xl font-bold text-crema">Fan</span>
                <span className="block text-sm text-crema/70 mt-1">
                  Quiero descubrir conciertos y artistas
                </span>
              </button>

              <button
                type="button"
                onClick={() => cambiarCampo("rol", "artista")}
                className="p-6 rounded-2xl border border-crema/30 bg-crema/10hover:border-fucsia hover:bg-gray-600 transition text-center"
              >
                <span className="block text-4xl mb-2">🎤</span>
                <span className="block text-xl font-bold text-crema">Artista</span>
                <span className="block text-sm text-crema/70 mt-1">
                  Quiero mostrar mi música y mis eventos
                </span>
              </button>
            </div>

            {piePagina}
          </div>
        </main>
      </>
    );
  }

  /* ---------- PASO 2: formulario según el tipo ---------- */
  const esArtista = form.rol === "artista";

  return (
    <>
      <Navbar />

      <main className="flex justify-center px-4 py-12">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg bg-crema/5border border-crema/20rounded-2xl p-8 space-y-5"
        >
          <button
            type="button"
            onClick={() => cambiarCampo("rol", "")}
            className="text-sm text-crema/70 hover:text-purple-300"
          >
            ← Cambiar tipo de cuenta
          </button>

          <h1 className="text-3xl font-bold text-crema text-center">
            {esArtista ? "Cuenta de artista" : "Cuenta de fan"}
          </h1>

          <FotoPerfil
            urlActual={null}
            valor={form.foto}
            onChange={(v) => cambiarCampo("foto", v)}
            titulo="Foto de perfil (opcional)"
          />

          {/* Datos de cuenta (comunes) */}
          <label className={labelClase}>
            Nombre de usuario
            <input
              name="nombre_usuario"
              value={form.nombre_usuario}
              onChange={(e) => cambiarCampo(e.target.name, e.target.value)}
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
              onChange={(e) => cambiarCampo(e.target.name, e.target.value)}
              required
              className={inputClase}
            />
          </label>

          <CampoContrasena
            etiqueta="Contraseña (mínimo 8 caracteres)"
            name="contrasenia"
            value={form.contrasenia}
            onChange={(e) => cambiarCampo(e.target.name, e.target.value)}
            autoComplete="new-password"
          />

          <CampoContrasena
            etiqueta="Repetir contraseña"
            name="confirmar"
            value={form.confirmar}
            onChange={(e) => cambiarCampo(e.target.name, e.target.value)}
            autoComplete="new-password"
          />

          <label className={labelClase}>
            Fecha de nacimiento
            <input
              type="date"
              name="fecha_nac"
              value={form.fecha_nac}
              onChange={(e) => cambiarCampo(e.target.name, e.target.value)}
              className={`${inputClase} [color-scheme:dark]`}
            />
          </label>

          <label className={labelClase}>
            Biografía (opcional)
            <textarea
              name="biografia"
              value={form.biografia}
              onChange={(e) => cambiarCampo(e.target.name, e.target.value)}
              rows={3}
              className="mt-1 w-full px-4 py-2 rounded-2xl bg-crema/10text-crema focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </label>

          {/* Campos propios del tipo de cuenta */}
          {esArtista ? (
            <CamposArtista valores={form} onChange={cambiarCampo} />
          ) : (
            <CamposFan valores={form} onChange={cambiarCampo} />
          )}

          {error && (
            <p className="text-mandarina text-sm" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full py-2 rounded-full bg-fucsia hover:bg-chicle text-crema font-bold disabled:opacity-50"
          >
            {enviando ? "Creando cuenta..." : "Registrarme"}
          </button>

          {piePagina}
        </form>
      </main>
    </>
  );
}
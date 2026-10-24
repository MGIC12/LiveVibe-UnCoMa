import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Avatar from "../components/Avatar";
import FotoPerfil from "../components/FotoPerfil";
import CamposArtista from "../components/CamposArtista"; // ← misma ruta que en Register.jsx
import { useAuth } from "../../context/AuthContext";
import { FOTO_VACIA } from "../utils/formularios";
import { urlImagen } from "../utils/api";

export default function Perfil() {
  const { usuario, editarPerfil, cambiarFoto, quitarFoto } = useAuth();
  const { state } = useLocation();
  const aviso = state?.aviso;

  const esFan = usuario.rol === "fan";
  const esArtista = usuario.rol === "artista";
  const esBanda = usuario.tipo_artista === "banda";
  const puedeEditar = esFan || esArtista;

  const [editando, setEditando] = useState(false);

  // Borrador: lo que se edita en el formulario
  const [biografia, setBiografia] = useState("");
  const [cancion, setCancion] = useState("");
  const [artista, setArtista] = useState({});
  const [foto, setFoto] = useState(FOTO_VACIA);

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  function cambiarArtista(nombre, valor) {
    setArtista((actual) => ({ ...actual, [nombre]: valor }));
  }

  function empezarEdicion() {
    setBiografia(usuario.biografia ?? "");
    setCancion(usuario.cancion_favorita ?? "");
    setArtista({
      nombre_artistico: usuario.nombre_artistico ?? "",
      nacionalidad: usuario.nacionalidad ?? "",
      genero: usuario.genero ?? "",
      tipo_artista: usuario.tipo_artista ?? "solista",
      // Los campos de un formulario no aceptan null: se pasan a texto vacío
      integrantes: (usuario.integrantes ?? []).map((i) => ({
        nombre: i.nombre ?? "",
        apellido: i.apellido ?? "",
        instrumento: i.instrumento ?? "",
        fecha_nac: i.fecha_nac ?? "",
        nacionalidad: i.nacionalidad ?? "",
      })),
    });
    setFoto(FOTO_VACIA);
    setMensaje("");
    setError("");
    setEditando(true);
  }

  function cancelar() {
    setError("");
    setEditando(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      if (esFan) {
        await editarPerfil({ biografia, cancion_favorita: cancion });
      } else {
        await editarPerfil({
          biografia,
          ...artista,
          integrantes: artista.tipo_artista === "banda" ? artista.integrantes : [],
        });
      }

      if (foto.archivo) {
        await cambiarFoto(foto.archivo);
      } else if (foto.quitar) {
        await quitarFoto();
      }
      setMensaje("Perfil actualizado correctamente");
      setEditando(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  // Qué se muestra en la cabecera según el tipo de cuenta
  const nombrePrincipal = esArtista
    ? usuario.nombre_artistico || usuario.nombre_usuario
    : usuario.nombre_usuario;
  const etiqueta = esArtista ? (usuario.tipo_artista ?? "artista") : usuario.rol;

  return (
    // Contenedor principal con altura mínima completa y distribución flexible para anclar el footer abajo
    <div className="min-h-screen bg-tinta text-crema font-sans flex flex-col justify-between">
      <Navbar />

      {/* pt-28 evita que el Navbar fijo tape el contenido, w-full y max-w-2xl mejoran la adaptabilidad */}
      <main className="flex-grow container mx-auto px-4 pt-28 pb-16 w-full max-w-2xl space-y-6">
        {/* Cabecera: siempre visible */}
        <section className="bg-crema/5 backdrop-blur-xl border border-crema/20 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-2xl">
          <Avatar
            usuario={usuario}
            clases="w-20 h-20 text-4xl shadow-lg border-2 border-fucsia"
            fondo="bg-tinta"
          />
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-black text-crema tracking-tight mb-1">
              {nombrePrincipal}
            </h1>
            <p className="text-crema/60 text-sm mb-3">
              {esArtista ? `@${usuario.nombre_usuario} · ` : ""}
              {usuario.email}
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="inline-block px-3 py-1 rounded-full bg-sol text-tinta text-xs font-bold uppercase tracking-wider">
                {etiqueta}
              </span>
              {esArtista && usuario.genero && (
                <span className="inline-block px-3 py-1 rounded-full bg-crema/10 text-crema/80 border border-crema/20 text-xs font-bold uppercase tracking-wider">
                  {usuario.genero}
                </span>
              )}
            </div>
          </div>
        </section>

        {editando ? (
          /* ---------- MODO EDICIÓN ---------- */
          <form
            onSubmit={handleSubmit}
            className="bg-crema/5 backdrop-blur-xl border border-crema/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
          >
            <h2 className="text-2xl font-black text-crema border-b border-crema/20 pb-4">
              Editar <span className="text-fucsia">mi perfil</span>
            </h2>

            <div className="flex flex-col items-center justify-center py-2">
              <FotoPerfil
                urlActual={urlImagen(usuario.foto_url)}
                valor={foto}
                onChange={setFoto}
                descripcion={usuario.foto_descripcion || "Foto de perfil"}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-crema/80 mb-2">
                  Biografía
                </label>
                <textarea
                  value={biografia}
                  onChange={(e) => setBiografia(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder={
                    esArtista
                      ? "Contale a tus fans quién sos y qué hacés..."
                      : "Cuéntanos algo sobre ti..."
                  }
                  className="w-full px-4 py-3 rounded-xl bg-crema/10 border border-crema/25 text-crema placeholder-crema/60 focus:outline-none focus:ring-2 focus:ring-cielo transition-all resize-none text-sm"
                />
                <span className="block text-right text-xs text-crema/50 mt-1">
                  {biografia.length}/500
                </span>
              </div>

              {esFan ? (
                <div>
                  <label className="block text-sm font-bold text-crema/80 mb-2">
                    Canción favorita
                  </label>
                  <input
                    value={cancion}
                    onChange={(e) => setCancion(e.target.value)}
                    maxLength={150}
                    placeholder="Ej. De música ligera - Soda Stereo"
                    className="w-full px-4 py-3.5 rounded-xl bg-crema/10 border border-crema/25 text-crema placeholder-crema/60 focus:outline-none focus:ring-2 focus:ring-cielo transition-all text-sm"
                  />
                </div>
              ) : (
                <div className="border-t border-crema/20 pt-5">
                  <CamposArtista valores={artista} onChange={cambiarArtista} />
                </div>
              )}
            </div>

            {error && (
              <div className="bg-mandarina/10 border border-mandarina/50 rounded-lg p-3 flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <p className="text-mandarina text-sm font-medium" role="alert">
                  {error}
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={cancelar}
                disabled={guardando}
                className="flex-1 py-3.5 rounded-xl border border-crema/30 text-crema/80 hover:border-fucsia hover:text-crema transition-all font-bold text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 py-3.5 rounded-xl bg-fucsia hover:bg-chicle text-tinta font-bold transition-all shadow-lg text-sm disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        ) : (
          /* ---------- MODO VISTA ---------- */
          <section className="bg-crema/5 backdrop-blur-xl border border-crema/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            {aviso && (
              <div className="bg-sol/10 border border-sol/40 rounded-xl p-4 text-sol text-sm">
                {aviso}
              </div>
            )}
            {mensaje && (
              <div className="bg-cielo/10 border border-cielo/40 rounded-xl p-4 text-cielo text-sm font-medium">
                ✨ {mensaje}
              </div>
            )}

            <div className="bg-crema/5 p-5 rounded-2xl border border-crema/20">
              <h2 className="text-xs font-bold text-cielo uppercase tracking-wider mb-2">
                Biografía
              </h2>
              <p className="whitespace-pre-line text-crema/90 text-sm sm:text-base leading-relaxed">
                {usuario.biografia || (
                  <span className="text-crema/40 italic">
                    Todavía no escribiste tu biografía.
                  </span>
                )}
              </p>
            </div>

            {esFan && (
              <div className="bg-crema/5 p-5 rounded-2xl border border-crema/20">
                <h2 className="text-xs font-bold text-cielo uppercase tracking-wider mb-2">
                  Canción favorita
                </h2>
                <p className="text-crema/90 text-sm sm:text-base font-medium flex items-center gap-2">
                  {usuario.cancion_favorita ? (
                    <>🎵 {usuario.cancion_favorita}</>
                  ) : (
                    <span className="text-crema/40 italic font-normal">
                      Todavía no elegiste una canción favorita.
                    </span>
                  )}
                </p>
              </div>
            )}

            {esArtista && (
              <div className="bg-crema/5 p-5 rounded-2xl border border-crema/20">
                <h2 className="text-xs font-bold text-cielo uppercase tracking-wider mb-3">
                  Datos artísticos
                </h2>
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <dt className="text-crema/60">Formación</dt>
                    <dd className="font-bold text-crema capitalize">
                      {usuario.tipo_artista ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-crema/60">Género</dt>
                    <dd className="font-bold text-crema">{usuario.genero || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-crema/60">Nacionalidad</dt>
                    <dd className="font-bold text-crema">{usuario.nacionalidad || "—"}</dd>
                  </div>
                </dl>
              </div>
            )}

            {esBanda && (usuario.integrantes?.length ?? 0) > 0 && (
              <div className="bg-crema/5 p-5 rounded-2xl border border-crema/20">
                <h2 className="text-xs font-bold text-cielo uppercase tracking-wider mb-3">
                  Integrantes
                </h2>
                <ul className="space-y-2">
                  {usuario.integrantes.map((i, n) => (
                    <li
                      key={n}
                      className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
                    >
                      <span className="font-bold text-crema">
                        {i.nombre} {i.apellido}
                      </span>
                      {i.instrumento && (
                        <span className="text-crema/70">{i.instrumento}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {usuario.fecha_alta && (
              <p className="text-xs text-crema/50 text-center pt-2">
                Miembro desde{" "}
                {new Date(usuario.fecha_alta).toLocaleDateString("es-AR", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}

            <div className="flex flex-col gap-3 pt-2">
              {esArtista && (
                <>
                <Link
                  to="/eventos/nuevo"
                  className="w-full text-center py-4 rounded-xl border border-cielo text-cielo hover:bg-cielo hover:text-tinta font-bold transition-all text-sm"
                >
                  ➕ Crear evento nuevo
                </Link>
                <Link
                  to={`/artista/${encodeURIComponent(usuario.nombre_usuario)}`}
                  className="w-full text-center py-4 rounded-xl border border-crema/30 text-crema/80 hover:border-fucsia hover:text-crema font-bold transition-all text-sm"
                >
                  👀 Ver mi perfil público
                </Link>
                </>
              )}

              {puedeEditar && (
                <button
                  onClick={empezarEdicion}
                  className="w-full py-4 rounded-xl bg-fucsia hover:bg-chicle text-tinta font-bold transition-all shadow-[0_0_15px_rgba(255,46,147,0.35)] text-sm"
                >
                  Editar perfil
                </button>
              )}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
import { useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import Insignia from "./Insignia";
import Comentarios from "./Comentarios";
import EditorTexto from "./EditorTexto";
import { IconoCorazon, IconoComentario } from "./IconosSociales";
import { useAuth } from "../../context/AuthContext";
import { API, urlImagen } from "../utils/api";
import { tiempoRelativo } from "../utils/tiempo";
import { puedeEditar } from "../utils/edicion";

const MAX_CONTENIDO = 500;

export default function TarjetaPublicacion({
  publicacion,
  esMia,
  onEliminada,
}) {
  const { usuario, token } = useAuth();
  const puedeInteractuar = usuario?.rol === "fan" || usuario?.rol === "artista";
  const id = publicacion.id_publicacion;

  // Los artistas se muestran con su nombre artístico y tienen su propia página
  const esArtistaAutor = publicacion.rol_autor === "artista";
  const nombreMostrado =
    publicacion.nombre_artistico || publicacion.nombre_autor;
  const rutaAutor = `${esArtistaAutor ? "/artista" : "/usuario"}/${encodeURIComponent(
    publicacion.nombre_autor,
  )}`;

  const [likes, setLikes] = useState({
    cant: publicacion.cant_likes,
    mio: publicacion.me_gusto,
  });
  const [cantComentarios, setCantComentarios] = useState(
    publicacion.cant_comentarios,
  );
  const [animarCorazon, setAnimarCorazon] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState("");

  // El texto se guarda acá para poder mostrarlo editado sin volver a pedir la lista
  const [contenido, setContenido] = useState(publicacion.contenido);
  const [fechaEdicion, setFechaEdicion] = useState(publicacion.fecha_edicion);
  const [editando, setEditando] = useState(false);

  // Solo el autor, y solo durante las primeras 24 horas (el servidor lo vuelve a comprobar)
  const puedeEditarla = esMia && puedeEditar(publicacion.fecha_publicacion);

  // Da o quita el me gusta. El servidor decide el resultado, y la pantalla lo muestra
  async function alternarMeGusta() {
    setError("");
    setGuardando(true);
    try {
      const res = await fetch(`${API}/api/publicaciones/${id}/me-gusta`, {
        method: likes.mio ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data.error || "No se pudo guardar tu me gusta");
      setLikes({ cant: data.cant_likes, mio: data.me_gusto });
      if (data.me_gusto) setAnimarCorazon(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    setError("");
    setGuardando(true);
    try {
      const res = await fetch(`${API}/api/publicaciones/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data.error || "No se pudo eliminar la publicación");
      onEliminada(id);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
      setConfirmando(false);
    }
  }

  // Guarda el texto editado. Si falla, el editor muestra el mensaje del error.
  async function guardarEdicion(nuevoTexto) {
    const res = await fetch(`${API}/api/publicaciones/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ contenido: nuevoTexto }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(data.error || "No se pudo editar la publicación");

    setContenido(data.contenido);
    setFechaEdicion(data.fecha_edicion);
    setEditando(false);
  }

  // Botón de "me gusta": cambia según quién mira
  const contador = (
    <>
      <IconoCorazon
        lleno={likes.mio}
        animar={animarCorazon}
        onAnimationEnd={() => setAnimarCorazon(false)}
      />
      <span className="text-sm font-semibold tabular-nums">{likes.cant}</span>
    </>
  );
  const base = "inline-flex items-center gap-2 p-1.5 rounded-lg transition";

  let botonMeGusta;
  if (puedeInteractuar && !esMia) {
    botonMeGusta = (
      <button
        onClick={alternarMeGusta}
        disabled={guardando}
        aria-pressed={likes.mio}
        aria-label={likes.mio ? "Quitar me gusta" : "Me gusta"}
        className={`${base} disabled:opacity-50 ${
          likes.mio ? "text-crema" : "text-crema/80 hover:text-crema/50"
        }`}
      >
        {contador}
      </button>
    );
  } else if (!usuario) {
    botonMeGusta = (
      <Link
        to="/login"
        title="Iniciá sesión para dar me gusta"
        aria-label="Iniciá sesión para dar me gusta"
        className={`${base} text-crema/80 hover:text-crema/50`}
      >
        {contador}
      </Link>
    );
  } else {
    // El autor (y las cuentas que no pueden reaccionar) solo ven la cantidad
    botonMeGusta = (
      <span
        className={`${base} text-crema/50`}
        title={
          esMia
            ? "No podés dar me gusta a tu propia publicación"
            : "Tu cuenta no puede dar me gusta"
        }
      >
        {contador}
      </span>
    );
  }

  return (
    <article className="bg-crema/5 border border-crema/20 rounded-2xl p-5">
      {/* Cabecera */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar
          usuario={{
            nombre_usuario: nombreMostrado,
            foto_url: publicacion.autor_foto_url,
            foto_descripcion: publicacion.autor_foto_descripcion,
          }}
          clases="w-10 h-10 text-sm"
          fondo="bg-tinta border border-crema/30"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={rutaAutor}
              className="font-bold text-crema hover:text-cielo transition"
            >
              {nombreMostrado}
            </Link>
            {esArtistaAutor && (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-sol text-tinta">
                Artista
              </span>
            )}
            <Insignia nivel={publicacion.autor_insignia} />
          </div>
          <p className="text-xs text-crema/50">
            {tiempoRelativo(publicacion.fecha_publicacion)}
            {fechaEdicion && (
              <span title={`Editada ${tiempoRelativo(fechaEdicion)}`}>
                {" "}
                · editada
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Contenido: el texto, o el editor si se está editando */}
      {editando ? (
        <EditorTexto
          valorInicial={contenido}
          maximo={MAX_CONTENIDO}
          etiqueta="Editar publicación"
          onGuardar={guardarEdicion}
          onCancelar={() => setEditando(false)}
        />
      ) : (
        <p className="text-crema/90 whitespace-pre-line break-words leading-relaxed">
          {contenido}
        </p>
      )}

      {publicacion.imagen_url && (
        <img
          src={urlImagen(publicacion.imagen_url)}
          alt={publicacion.imagen_descripcion || "Imagen de la publicación"}
          loading="lazy"
          className="mt-3 w-full max-h-[28rem] object-cover rounded-xl border border-crema/20"
        />
      )}

      {/* Acciones */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
        <div className="flex items-center gap-3">
          {botonMeGusta}
          <button
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-label={`Comentarios (${cantComentarios})`}
            className={`${base} ${
              abierto ? "text-crema" : "text-crema/80 hover:text-crema/50"
            }`}
          >
            <IconoComentario lleno={abierto} />
            <span className="text-sm font-semibold tabular-nums">
              {cantComentarios}
            </span>
          </button>
        </div>

        {esMia &&
          (confirmando ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-crema/80">¿Eliminar esta publicación?</span>
              <button
                onClick={() => setConfirmando(false)}
                disabled={guardando}
                className="px-3 py-1 rounded-full border border-crema/30 text-crema/80 hover:border-crema font-bold disabled:opacity-50"
              >
                No
              </button>
              <button
                onClick={eliminar}
                disabled={guardando}
                className="px-3 py-1 rounded-full bg-mandarina hover:bg-sol text-tinta font-bold disabled:opacity-50"
              >
                {guardando ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {puedeEditarla && !editando && (
                <button
                  onClick={() => setEditando(true)}
                  className="px-3 py-1.5 rounded-full text-sm font-bold text-crema/60 hover:text-cielo hover:bg-cielo/10 transition"
                >
                  ✏️ Editar
                </button>
              )}
              <button
                onClick={() => setConfirmando(true)}
                className="px-3 py-1.5 rounded-full text-sm font-bold text-crema/60 hover:text-mandarina hover:bg-mandarina/10 transition"
              >
                🗑️ Eliminar
              </button>
            </div>
          ))}
      </div>

      {error && (
        <p className="text-mandarina text-sm mt-2" role="alert">
          {error}
        </p>
      )}

      {abierto && (
        <Comentarios
          idPublicacion={id}
          autorPublicacion={publicacion.nombre_autor}
          onNuevoComentario={() => setCantComentarios((n) => n + 1)}
        />
      )}
    </article>
  );
}
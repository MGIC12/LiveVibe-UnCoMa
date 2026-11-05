import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";
import { tiempoRelativo } from "../utils/tiempo";

const MAX_COMENTARIO = 300;

// Formulario reutilizable: sirve para comentar y para responder
function FormularioComentario({
  valorInicial = "",
  placeholder,
  textoEnviar,
  onEnviar,
  onCancelar,
}) {
  const [texto, setTexto] = useState(valorInicial);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    setError("");
    setEnviando(true);
    try {
      await onEnviar(texto);
      setTexto("");
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={2}
        maxLength={MAX_COMENTARIO}
        placeholder={placeholder}
        autoFocus={Boolean(onCancelar)}
        // Al responder, el cursor queda al final del "@usuario "
        onFocus={(e) =>
          e.target.setSelectionRange(e.target.value.length, e.target.value.length)
        }
        className="w-full px-3 py-2 rounded-xl bg-crema/10 border border-crema/25 text-crema placeholder-crema/60 focus:outline-none focus:ring-2 focus:ring-cielo text-sm resize-none"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-crema/50">
          {texto.length}/{MAX_COMENTARIO}
        </span>
        <div className="flex gap-2">
          {onCancelar && (
            <button
              type="button"
              onClick={onCancelar}
              className="px-3 py-1 rounded-full text-xs font-bold text-crema/70 hover:text-crema transition"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={enviando || !texto.trim()}
            className="px-4 py-1.5 rounded-full bg-fucsia hover:bg-chicle text-tinta text-xs font-bold disabled:opacity-50 transition"
          >
            {enviando ? "Enviando..." : textoEnviar}
          </button>
        </div>
      </div>
      {error && (
        <p className="text-mandarina text-xs" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

// Un comentario (principal o respuesta)
function Comentario({
  c,
  autorPublicacion,
  puedeResponder,
  respondiendoA,
  setRespondiendoA,
  onResponder,
}) {
  const esAutor = c.nombre_autor === autorPublicacion;
  const respondiendo = respondiendoA === c.id_comentario;

  // Los artistas se muestran con su nombre artístico y tienen su propia página
  const nombre = c.nombre_artistico || c.nombre_autor;
  const ruta = `${c.rol_autor === "artista" ? "/artista" : "/usuario"}/${encodeURIComponent(
    c.nombre_autor,
  )}`;

  return (
    <div className="flex gap-3">
      <Avatar
        usuario={{
          nombre_usuario: nombre,
          foto_url: c.foto_url,
          foto_descripcion: c.foto_descripcion,
        }}
        clases="w-8 h-8 text-xs"
        fondo="bg-tinta border border-crema/30"
      />

      <div className="flex-grow min-w-0 space-y-1">
        <div className="bg-crema/5 border border-crema/20 rounded-2xl px-3 py-2">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <Link
              to={ruta}
              className="text-sm font-bold text-crema hover:text-cielo transition"
            >
              {nombre}
            </Link>
            {esAutor && (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-sol text-tinta">
                Autor
              </span>
            )}
            <span className="text-xs text-crema/50">{tiempoRelativo(c.fecha_hora)}</span>
          </div>
          <p className="text-sm text-crema/90 whitespace-pre-line break-words">
            {c.contenido}
          </p>
        </div>

        {puedeResponder && (
          <button
            onClick={() => setRespondiendoA(respondiendo ? null : c.id_comentario)}
            className="text-xs font-bold text-cielo hover:text-crema transition px-2"
          >
            Responder
          </button>
        )}

        {respondiendo && (
          <FormularioComentario
            valorInicial={`@${nombre} `}
            placeholder="Escribí tu respuesta..."
            textoEnviar="Responder"
            onEnviar={(texto) => onResponder(texto, c.id_comentario)}
            onCancelar={() => setRespondiendoA(null)}
          />
        )}
      </div>
    </div>
  );
}

export default function Comentarios({ idPublicacion, autorPublicacion, onNuevoComentario }) {
  const { usuario, token } = useAuth();
  const puedeInteractuar = usuario?.rol === "fan" || usuario?.rol === "artista";

  const [hilos, setHilos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0); // al cambiarla, se vuelve a cargar la lista
  const [respondiendoA, setRespondiendoA] = useState(null);

  useEffect(() => {
    let activo = true;
    fetch(`${API}/api/publicaciones/${idPublicacion}/comentarios`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "No se pudieron cargar los comentarios");
        return data;
      })
      .then((data) => {
        if (activo) setHilos(data);
      })
      .catch((err) => {
        if (activo) setError(err.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [idPublicacion, version]);

  // Sirve para comentar (idPadre = null) y para responder
  async function enviar(contenido, idPadre = null) {
    const res = await fetch(`${API}/api/publicaciones/${idPublicacion}/comentarios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ contenido, id_comentario_padre: idPadre }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "No se pudo enviar el comentario");

    setRespondiendoA(null);
    setVersion((v) => v + 1); // se vuelve a pedir la lista: siempre queda igual que en el servidor
    onNuevoComentario();
  }

  const propsComentario = {
    autorPublicacion,
    puedeResponder: puedeInteractuar,
    respondiendoA,
    setRespondiendoA,
    onResponder: enviar,
  };

  return (
    <div className="mt-4 pt-4 border-t border-crema/20 space-y-4">
      {cargando ? (
        <p className="text-crema/60 text-sm animate-pulse">Cargando comentarios...</p>
      ) : error ? (
        <p className="text-mandarina text-sm" role="alert">
          {error}
        </p>
      ) : hilos.length === 0 ? (
        <p className="text-crema/50 text-sm">Todavía no hay comentarios.</p>
      ) : (
        <ul className="space-y-4">
          {hilos.map((c) => (
            <li key={c.id_comentario} className="space-y-3">
              <Comentario c={c} {...propsComentario} />

              {c.respuestas.length > 0 && (
                <ul className="ml-10 space-y-3 border-l-2 border-crema/20 pl-4">
                  {c.respuestas.map((r) => (
                    <li key={r.id_comentario}>
                      <Comentario c={r} {...propsComentario} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Formulario para comentar */}
      {puedeInteractuar ? (
        <FormularioComentario
          placeholder="Escribí un comentario..."
          textoEnviar="Comentar"
          onEnviar={(texto) => enviar(texto)}
        />
      ) : !usuario ? (
        <p className="text-sm text-crema/70">
          <Link to="/login" className="text-cielo hover:text-crema font-bold">
            Iniciá sesión
          </Link>{" "}
          para comentar.
        </p>
      ) : (
        <p className="text-xs text-crema/50">Tu cuenta no puede comentar.</p>
      )}
    </div>
  );
}
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FormularioPublicacion from "./FormularioPublicacion";
import TarjetaPublicacion from "./TarjetaPublicacion";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";
import { EsqueletoPublicaciones } from "./Esqueleto";

// encabezado: título de la sección (si no se indica, usa el de la página Comunidad)
// max: cuántas publicaciones mostrar (si no se indica, todas las que trae el servidor)
// soloArtistas: muestra únicamente publicaciones de artistas
export default function FeedComunidad({ encabezado, max, soloArtistas = false }) {
  const { usuario, token } = useAuth();
  const puedeInteractuar = usuario?.rol === "fan" || usuario?.rol === "artista";

  // En un feed solo de artistas, la publicación de un fan no se vería:
  // por eso ahí el formulario es solo para artistas
  const puedePublicar = soloArtistas ? usuario?.rol === "artista" : puedeInteractuar;

  const [filtro, setFiltro] = useState("todas"); // todas | siguiendo
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    const params = new URLSearchParams();
    if (filtro === "siguiendo") params.set("filtro", "siguiendo");
    if (soloArtistas) params.set("rol", "artista");
    const texto = params.toString();

    fetch(`${API}/api/publicaciones/feed${texto ? `?${texto}` : ""}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "No se pudo cargar el feed");
        return data;
      })
      .then((data) => {
        if (activo) setLista(data);
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
  }, [filtro, token, soloArtistas]);

  function cambiarFiltro(nuevo) {
    if (nuevo === filtro) return;
    setCargando(true);
    setError("");
    setFiltro(nuevo);
  }

  const pestana = (id, texto) => (
    <button
      onClick={() => cambiarFiltro(id)}
      aria-pressed={filtro === id}
      className={`px-5 py-1.5 rounded-full text-sm font-bold transition ${
        filtro === id ? "bg-fucsia text-tinta" : "bg-crema/10 text-crema/80 hover:bg-crema/20"
      }`}
    >
      {texto}
    </button>
  );

  const visibles = max ? lista.slice(0, max) : lista;

  return (
    <section className="space-y-5">
      {encabezado ?? (
        <h1 className="text-3xl sm:text-4xl font-black text-crema">
          <span className="text-fucsia">Comunidad</span>
        </h1>
      )}

      <div className="flex gap-2">
        {pestana("todas", "Todas")}
        {usuario && pestana("siguiendo", "Siguiendo")}
      </div>

      {puedePublicar && filtro === "todas" && (
        <FormularioPublicacion onPublicada={(nueva) => setLista((actual) => [nueva, ...actual])} />
      )}

      {/* Los fans no publican acá: se los lleva a la comunidad */}
      {soloArtistas && usuario?.rol === "fan" && (
        <p className="text-sm text-crema/60">
          ¿Querés compartir algo?{" "}
          <Link to="/comunidad" className="text-cielo hover:text-crema font-bold">
            Publicá en la comunidad →
          </Link>
        </p>
      )}

      {cargando ? (
        <EsqueletoPublicaciones />
      ) : error ? (
        <p className="text-mandarina text-center py-10" role="alert">
          {error}
        </p>
      ) : lista.length === 0 ? (
        <div className="bg-crema/5 border border-crema/20 rounded-2xl p-8 text-center text-crema/60 space-y-2">
          {filtro === "siguiendo" ? (
            <>
              <p>
                {soloArtistas
                  ? "Todavía no hay publicaciones de los artistas que seguís."
                  : "Todavía no hay publicaciones de quienes seguís."}
              </p>
              <p className="text-sm">
                {soloArtistas
                  ? "Seguí a tus artistas favoritos desde su perfil y sus publicaciones van a aparecer acá."
                  : "Seguí a otros fans desde su perfil, o a tus artistas favoritos, y sus publicaciones van a aparecer acá."}
              </p>
            </>
          ) : (
            <p>
              {soloArtistas
                ? "Todavía no hay publicaciones de artistas."
                : "Todavía no hay publicaciones."}{" "}
              {puedePublicar ? (
                "¡Sé el primero!"
              ) : !usuario ? (
                <Link to="/login" className="text-cielo hover:text-crema font-bold">
                  Iniciá sesión para publicar.
                </Link>
              ) : null}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {visibles.map((p) => (
            <TarjetaPublicacion
              key={`${p.id_publicacion}-${usuario?.nombre_usuario ?? "visitante"}`}
              publicacion={p}
              esMia={usuario?.nombre_usuario === p.nombre_autor}
              onEliminada={(id) => setLista((a) => a.filter((x) => x.id_publicacion !== id))}
            />
          ))}

          {max && lista.length > max && (
            <div className="text-center">
              <Link to="/comunidad" className="text-cielo hover:text-crema font-bold transition">
                Ver toda la comunidad →
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
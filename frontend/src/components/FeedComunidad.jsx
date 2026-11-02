import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FormularioPublicacion from "./FormularioPublicacion";
import TarjetaPublicacion from "./TarjetaPublicacion";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";

export default function FeedComunidad() {
  const { usuario, token } = useAuth();
  const puedePublicar = usuario?.rol === "fan" || usuario?.rol === "artista";

  const [filtro, setFiltro] = useState("todas"); // todas | siguiendo
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    const consulta = filtro === "siguiendo" ? "?filtro=siguiendo" : "";
    fetch(`${API}/api/publicaciones/feed${consulta}`, {
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
  }, [filtro, token]);

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

  return (
    <section className="space-y-5">
      <h1 className="text-3xl sm:text-4xl font-black text-crema">
        <span className="text-fucsia">Comunidad</span>
      </h1>

      <div className="flex gap-2">
        {pestana("todas", "Todas")}
        {usuario && pestana("siguiendo", "Siguiendo")}
      </div>

      {puedePublicar && filtro === "todas" && (
        <FormularioPublicacion onPublicada={(nueva) => setLista((actual) => [nueva, ...actual])} />
      )}

      {cargando ? (
        <p className="text-crema/60 text-center py-10 animate-pulse">Cargando publicaciones...</p>
      ) : error ? (
        <p className="text-mandarina text-center py-10" role="alert">
          {error}
        </p>
      ) : lista.length === 0 ? (
        <div className="bg-crema/5 border border-crema/20 rounded-2xl p-8 text-center text-crema/60 space-y-2">
          {filtro === "siguiendo" ? (
            <>
              <p>Todavía no hay publicaciones de quienes seguís.</p>
              <p className="text-sm">
                Seguí a otros fans desde su perfil, o a tus artistas favoritos, y sus
                publicaciones van a aparecer acá.
              </p>
            </>
          ) : (
            <p>
              Todavía no hay publicaciones.{" "}
              {puedePublicar ? "¡Sé el primero!" : (
                <Link to="/login" className="text-cielo hover:text-crema font-bold">
                  Iniciá sesión para publicar.
                </Link>
              )}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {lista.map((p) => (
            <TarjetaPublicacion
              key={`${p.id_publicacion}-${usuario?.nombre_usuario ?? "visitante"}`}
              publicacion={p}
              esMia={usuario?.nombre_usuario === p.nombre_autor}
              onEliminada={(id) => setLista((a) => a.filter((x) => x.id_publicacion !== id))}
            />
          ))}
        </div>
      )}
    </section>
  );
}
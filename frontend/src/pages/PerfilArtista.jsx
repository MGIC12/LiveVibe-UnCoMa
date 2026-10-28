import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CabeceraPerfil from "../components/CabeceraPerfil";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";
import { formatearPrecio } from "../utils/formularios";
import BotonesSeguimiento from "../components/BotonesSeguimiento";

// Marco común: Navbar, contenido y Footer
function Marco({ children }) {
  return (
    <div className="min-h-screen bg-tinta text-crema font-sans flex flex-col justify-between">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-28 pb-16 w-full max-w-3xl space-y-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default function PerfilArtista() {
  const { usuario: nombreUsuario } = useParams();
  const { usuario } = useAuth();
  const [artista, setArtista] = useState(null);
  const [estado, setEstado] = useState("cargando"); // cargando | ok | noEncontrado | error

  useEffect(() => {
    let activo = true;
    fetch(`${API}/api/artistas/${encodeURIComponent(nombreUsuario)}`)
      .then(async (res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Error al cargar el perfil");
        return res.json();
      })
      .then((data) => {
        if (!activo) return;
        if (data) {
          setArtista(data);
          setEstado("ok");
        } else {
          setEstado("noEncontrado");
        }
      })
      .catch(() => {
        if (activo) setEstado("error");
      });
    return () => {
      activo = false;
    };
  }, [nombreUsuario]);

  if (estado === "cargando") {
    return (
      <Marco>
        <p className="text-center text-crema/70 py-20 animate-pulse">Cargando perfil...</p>
      </Marco>
    );
  }

  if (estado !== "ok") {
    return (
      <Marco>
        <div className="text-center bg-crema/5 border border-crema/20 rounded-2xl p-10 space-y-4">
          <p className="text-crema/80">
            {estado === "noEncontrado"
              ? "Este artista no existe."
              : "No pudimos cargar el perfil. Probá de nuevo en unos minutos."}
          </p>
          <Link to="/" className="inline-block text-cielo hover:text-crema font-bold">
            Volver al inicio
          </Link>
        </div>
      </Marco>
    );
  }

  const esMiPerfil = usuario?.nombre_usuario === artista.nombre_usuario;
  const esBanda = artista.tipo_artista === "banda";
  const shows = artista.proximos_eventos;
  // Los botones de seguir los ve un fan o quien no inició sesión;
  // el dueño del perfil ve en su lugar el acceso para editarlo
  const mostrarAcciones = esMiPerfil || !usuario || usuario.rol === "fan";

  return (
    <Marco>
      {/* Cabecera */}
      <CabeceraPerfil
        avatar={{ ...artista, nombre_usuario: artista.nombre_artistico }}
        titulo={artista.nombre_artistico}
        subtitulo={`@${artista.nombre_usuario} · ${artista.seguidores} ${
          artista.seguidores === 1 ? "seguidor" : "seguidores"
        }`}
        etiquetas={[
          { texto: artista.tipo_artista, destacada: true },
          artista.genero && { texto: `🎵 ${artista.genero}` },
          artista.nacionalidad && { texto: `🌍 ${artista.nacionalidad}` },
        ].filter(Boolean)}
      >
        {mostrarAcciones &&
          (esMiPerfil ? (
            <Link
              to="/perfil"
              className="inline-block px-6 py-2.5 rounded-full border border-cielo text-cielo hover:bg-cielo hover:text-tinta text-sm font-bold transition"
            >
              Editar mi perfil
            </Link>
          ) : (
            <BotonesSeguimiento artista={artista.nombre_usuario} />
          ))}
      </CabeceraPerfil>

      {/* Biografía */}
      {artista.biografia && (
        <section className="bg-crema/5 border border-crema/20 rounded-2xl p-6">
          <h2 className="text-xs font-bold text-cielo uppercase tracking-wider mb-2">
            Sobre {artista.nombre_artistico}
          </h2>
          <p className="whitespace-pre-line text-crema/90 leading-relaxed">
            {artista.biografia}
          </p>
        </section>
      )}

      {/* Integrantes */}
      {esBanda && artista.integrantes.length > 0 && (
        <section className="bg-crema/5 border border-crema/20 rounded-2xl p-6">
          <h2 className="text-xs font-bold text-cielo uppercase tracking-wider mb-3">
            Integrantes
          </h2>
          <ul className="space-y-2">
            {artista.integrantes.map((i, n) => (
              <li
                key={n}
                className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
              >
                <span className="font-bold text-crema">
                  {i.nombre} {i.apellido}
                </span>
                {i.instrumento && <span className="text-crema/70">{i.instrumento}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Próximos shows */}
      <section className="space-y-3">
        <h2 className="text-2xl font-black text-crema">
          Próximos <span className="text-fucsia">shows</span>{" "}
          <span className="text-base font-bold text-crema/60">({shows.length})</span>
        </h2>

        {shows.length === 0 ? (
          <p className="bg-crema/5 border border-crema/20 rounded-2xl p-6 text-center text-crema/70">
            Por ahora no tiene shows programados.
          </p>
        ) : (
          <ul className="space-y-3">
            {shows.map((e) => {
              const fecha = new Date(`${e.fecha}T00:00:00`);
              return (
                <li key={e.id_evento}>
                  <Link
                    to={`/evento/${e.id_evento}`}
                    className="group flex items-center gap-4 bg-crema/5 hover:bg-crema/10 border border-crema/20 hover:border-fucsia/60 rounded-xl p-4 transition-all"
                  >
                    <div className="text-center min-w-[64px] bg-tinta/80 rounded-lg py-2 px-3 border border-crema/20 group-hover:border-fucsia/50 transition-colors">
                      <p className="text-2xl font-black text-crema">{fecha.getDate()}</p>
                      <p className="text-xs font-bold uppercase tracking-widest text-crema/70">
                        {fecha.toLocaleString("es-AR", { month: "short" })}
                      </p>
                    </div>

                    <div className="flex-grow min-w-0">
                      <h3 className="text-lg font-bold text-crema truncate group-hover:text-cielo transition-colors">
                        {e.nombre}
                      </h3>
                      <p className="text-sm text-crema/70 truncate">
                        📍 {e.lugar}, <strong className="text-crema/80">{e.ciudad}</strong>
                        {e.hora_apertura ? ` · ${e.hora_apertura} hs` : ""}
                      </p>
                    </div>

                    {e.precio_desde != null && (
                      <p className="text-sol font-bold shrink-0">
                        {formatearPrecio(e.precio_desde)}
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Marco>
  );
}
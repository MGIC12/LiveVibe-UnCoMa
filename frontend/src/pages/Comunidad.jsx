import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FeedComunidad from "../components/FeedComunidad";
import Avatar from "../components/Avatar";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";

const tarjeta = "bg-crema/5 border border-crema/20 rounded-2xl p-5";
const subtitulo = "text-xs font-bold text-cielo uppercase tracking-wider mb-3";

function PanelPersonal() {
  const { usuario } = useAuth();
  const esFan = usuario?.rol === "fan";
  const esArtista = usuario?.rol === "artista";

  const enlaces = [
    { a: "/", texto: "Inicio" },
    { a: "/buscar", texto: "Buscar" },
    ...(esFan
      ? [
          { a: "/mis-reservas", texto: "Mis entradas" },
          { a: "/carrito", texto: "Mi carrito" },
          { a: "/mis-compras", texto: "Mis compras" },
        ]
      : []),
    ...(esArtista
      ? [
          { a: "/mis-eventos", texto: "Mis eventos" },
          { a: "/mi-merch", texto: "Mi merch" },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className={tarjeta}>
        {usuario ? (
          <Link
            to={
              esArtista
                ? `/artista/${encodeURIComponent(usuario.nombre_usuario)}`
                : "/perfil"
            }
            className="flex items-center gap-3 group"
          >
            <Avatar usuario={usuario} clases="w-12 h-12 text-lg" />
            <div className="min-w-0">
              <p className="font-black text-crema truncate group-hover:text-cielo transition">
                {usuario.nombre_usuario}
              </p>
              <p className="text-xs text-crema/60">Ver mi perfil</p>
            </div>
          </Link>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-crema/80">
              Iniciá sesión para publicar, comentar y seguir a otros.
            </p>
            <Link
              to="/login"
              className="block text-center bg-fucsia text-tinta font-bold py-2 rounded-full hover:opacity-90 transition text-sm"
            >
              Iniciar sesión
            </Link>
          </div>
        )}
      </div>

      <nav
        className={`${tarjeta} hidden lg:block`}
        aria-label="Accesos rápidos"
      >
        <h2 className={subtitulo}>Accesos</h2>
        <ul className="space-y-1">
          {enlaces.map((e) => (
            <li key={e.a}>
              <Link
                to={e.a}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-crema/80 hover:bg-crema/10 hover:text-crema transition"
              >
                {e.texto}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function PanelDescubrir() {
  const [artistas, setArtistas] = useState([]);
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    let activo = true;
    const pedir = (ruta) =>
      fetch(`${API}${ruta}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => (Array.isArray(d) ? d : []))
        .catch(() => []);

    pedir("/api/artistas").then((d) => activo && setArtistas(d.slice(0, 5)));
    pedir("/api/eventos").then((d) => activo && setEventos(d.slice(0, 4)));
    return () => {
      activo = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      {artistas.length > 0 && (
        <section className={tarjeta}>
          <h2 className={subtitulo}>Artistas para seguir</h2>
          <ul className="space-y-3">
            {artistas.map((a) => (
              <li key={a.nombre_usuario}>
                <Link
                  to={`/artista/${encodeURIComponent(a.nombre_usuario)}`}
                  className="flex items-center gap-3 group"
                >
                  <Avatar
                    usuario={{
                      nombre_usuario: a.nombre_artistico,
                      foto_url: a.foto_url,
                    }}
                    clases="w-10 h-10"
                    fondo="bg-fucsia/30"
                  />
                  <span className="min-w-0">
                    <span className="block font-bold text-crema text-sm truncate group-hover:text-cielo transition">
                      {a.nombre_artistico}
                    </span>
                    <span className="block text-xs text-crema/60 truncate">
                      {[
                        a.genero,
                        a.seguidores != null &&
                          `${a.seguidores} ${a.seguidores === 1 ? "seguidor" : "seguidores"}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {eventos.length > 0 && (
        <section className={tarjeta}>
          <h2 className={subtitulo}>Próximos shows</h2>
          <ul className="space-y-3">
            {eventos.map((e) => {
              const dia = String(e.fecha).slice(0, 10);
              const f = new Date(`${dia}T00:00:00`);
              return (
                <li key={e.id_evento}>
                  <Link
                    to={`/evento/${e.id_evento}`}
                    className="flex items-center gap-3 group"
                  >
                    <span className="shrink-0 w-11 text-center bg-tinta/80 border border-crema/20 rounded-lg py-1 group-hover:border-fucsia/50 transition">
                      <span className="block text-lg font-black text-crema leading-none">
                        {f.getDate()}
                      </span>
                      <span className="block text-[10px] font-bold uppercase text-crema/70">
                        {f.toLocaleString("es-AR", { month: "short" })}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="block font-bold text-crema text-sm truncate group-hover:text-cielo transition">
                        {e.nombre}
                      </span>
                      <span className="block text-xs text-crema/60 truncate">
                        {e.ciudad}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            to="/"
            className="block mt-4 text-sm font-bold text-cielo hover:text-crema transition"
          >
            Ver todos los eventos →
          </Link>
        </section>
      )}
    </div>
  );
}

export default function Comunidad() {
  return (
    <div className="min-h-screen bg-tinta text-crema font-sans flex flex-col justify-between">
      <Navbar />
      <main className="flex-grow w-full max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_20rem] gap-6 xl:gap-8 items-start">
          <aside className="lg:sticky lg:top-24">
            <PanelPersonal />
          </aside>

          <div className="min-w-0 max-w-3xl w-full mx-auto lg:mx-0">
            <FeedComunidad />
          </div>

          <aside className="lg:col-span-2 xl:col-span-1 xl:sticky xl:top-24">
            <PanelDescubrir />
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API, urlImagen } from "../utils/api";

// Foto del artista; si no tiene (o no carga), una portada con su inicial en los colores de la marca
function FotoArtista({ foto, nombre }) {
  const [fallo, setFallo] = useState(false);
  if (foto && !fallo) {
    return (
      <img
        src={foto}
        alt={nombre}
        onError={() => setFallo(true)}
        className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-300"
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={nombre}
      className="w-full h-full flex items-center justify-center bg-gradient-to-br from-fucsia via-fucsia/70 to-sol/80"
    >
      <span className="text-6xl md:text-7xl font-black text-tinta/80 select-none">
        {(nombre || "?").trim().charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

const Carrusel = () => {
  const [artistas, setArtistas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    fetch(`${API}/api/artistas`)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar los artistas");
        return res.json();
      })
      .then((data) => {
        if (activo) setArtistas(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Error al cargar los artistas:", error);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const duplicatedArtists = [...artistas, ...artistas];

  if (cargando) {
    return (
      <section className="my-8 relative px-4 md:px-0">
        <h3 className="text-2xl font-bold mb-2 text-crema">
          Artistas en Tendencia
        </h3>
        <div className="py-8 text-crema/70 animate-pulse">
          Cargando artistas...
        </div>
      </section>
    );
  }

  if (artistas.length === 0) return null;

  return (
    <section className="my-8 overflow-hidden relative">
      <h3 className="text-2xl font-bold mb-2 px-4 md:px-0 text-crema">
        Artistas en Tendencia
      </h3>
      <div className="py-8">
        <div className="flex gap-6 animate-infinite-scroll px-4 hover:[animation-play-state:paused]">
          {duplicatedArtists.map((artist, index) => {
            const foto = urlImagen(artist.foto_url);

            return (
              <Link
                to={`/artista/${encodeURIComponent(artist.nombre_usuario)}`}
                key={`${artist.nombre_usuario}-${index}`}
                className="relative shrink-0 w-40 md:w-48 h-60 md:h-72 bg-crema/5 rounded-lg overflow-hidden cursor-pointer transform transition-transform duration-300 hover:scale-110 hover:z-10 shadow-2xl block"
              >
                <FotoArtista foto={foto} nombre={artist.nombre_artistico} />

                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-tinta to-transparent pointer-events-none"></div>

                <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
                  <h4 className="text-crema font-bold leading-tight drop-shadow-md">
                    {artist.nombre_artistico}
                  </h4>
                  <p className="text-cielo text-xs font-semibold drop-shadow-md">
                    {artist.genero}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Carrusel;
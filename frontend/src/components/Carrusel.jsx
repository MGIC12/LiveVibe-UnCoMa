import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API, urlImagen } from "../utils/api";

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
            // Si no hay foto, se genera una imagen con la inicial, con los colores de la paleta
            const placeholderImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.nombre_artistico)}&background=FF2E93&color=0F0D14&bold=true&size=300&font-size=0.33`;

            return (
              <Link
                to={`/artista/${encodeURIComponent(artist.nombre_usuario)}`}
                key={`${artist.nombre_usuario}-${index}`}
                className="relative shrink-0 w-40 md:w-48 h-60 md:h-72 bg-crema/5 rounded-lg overflow-hidden cursor-pointer transform transition-transform duration-300 hover:scale-110 hover:z-10 shadow-2xl block"
              >
                <img
                  src={urlImagen(artist.foto_url) || placeholderImg}
                  alt={artist.nombre_artistico}
                  className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-300"
                />

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
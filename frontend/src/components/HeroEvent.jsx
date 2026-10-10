import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const HeroEvent = () => {
  const [eventoDestacado, setEventoDestacado] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Imagen según el género
  const getImagenPorGenero = (genero) => {
    const generosBuscados = genero ? genero.toLowerCase() : "";
    if (generosBuscados.includes("rock"))
      return "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=2000&auto=format&fit=crop";
    if (generosBuscados.includes("jazz"))
      return "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=2000&auto=format&fit=crop";
    if (generosBuscados.includes("urbano") || generosBuscados.includes("trap"))
      return "https://images.unsplash.com/photo-1470229722913-7c090be01246?q=80&w=2000&auto=format&fit=crop";
    if (generosBuscados.includes("indie"))
      return "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=2000&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1540039155732-d674d6e3f0be?q=80&w=2000&auto=format&fit=crop";
  };

  useEffect(() => {
    // Buscamos los eventos de la API
    fetch("http://localhost:5000/api/eventos")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          // Evento random
          const randomIndex = Math.floor(Math.random() * data.length);
          setEventoDestacado(data[randomIndex]);
        }
        setCargando(false);
      })
      .catch((error) => {
        console.error("Error al cargar evento destacado:", error);
        setCargando(false);
      });
  }, []);

  if (cargando) {
    return (
      <header className="h-[70vh] min-h-[500px] flex items-center justify-center bg-neutral-900 border-b border-neutral-800">
        <div className="text-gray-400 text-xl font-bold">
          Cargando evento destacado...
        </div>
      </header>
    );
  }

  if (!eventoDestacado) {
    return (
      <header className="h-[70vh] min-h-[500px] flex items-center justify-center bg-neutral-900 border-b border-neutral-800">
        <div className="text-gray-400 text-xl font-bold">
          No hay eventos destacados en este momento.
        </div>
      </header>
    );
  }

  const fechaFormateada = new Date(eventoDestacado.fecha).toLocaleDateString(
    "es-AR",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const imagenFondo = getImagenPorGenero(eventoDestacado.genero);

  return (
    <header
      className="relative h-[70vh] min-h-[500px] flex items-end bg-cover bg-center"
      style={{ backgroundImage: `url('${imagenFondo}')` }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/60 to-transparent"></div>

      <div className="relative z-10 container mx-auto px-4 pb-12 md:pb-16">
        <span className="text-green-400 font-bold tracking-widest text-sm uppercase drop-shadow-md mb-2 block">
          NUEVO SHOW DESTACADO
        </span>
        <h1 className="text-5xl md:text-7xl font-black text-white mb-4 drop-shadow-lg leading-tight uppercase line-clamp-2">
          {eventoDestacado.nombre}
        </h1>
        <p className="text-gray-300 text-lg md:text-xl max-w-2xl mb-8 drop-shadow-md font-medium">
          <span className="capitalize">{fechaFormateada}</span>{" "}
          {eventoDestacado.hora_apertura} | {eventoDestacado.lugar},{" "}
          {eventoDestacado.ciudad} <br />
          <span className="text-sm mt-2 block text-gray-400">
            Género: {eventoDestacado.genero}
          </span>
        </p>

        <div className="flex flex-wrap gap-4">
          {/* Botón Reservar Ahora inactivo */}
          <button
            onClick={() =>
              alert(
                "La reserva directa estará disponible pronto. Ve a Más Información para reservar.",
              )
            }
            className="bg-neutral-600 cursor-not-allowed text-gray-300 font-bold py-3 px-8 rounded-full flex items-center gap-2"
            title="Próximamente"
          >
            RESERVAR AHORA
          </button>

          {/* Botón Más Información activo que lleva al detalle */}
          <Link
            to={`/evento/${eventoDestacado.id_evento}`}
            className="bg-green-500 hover:bg-green-400 text-black font-bold py-3 px-8 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.4)] transition flex items-center gap-2"
          >
            Más Información
          </Link>
        </div>
      </div>
    </header>
  );
};

export default HeroEvent;

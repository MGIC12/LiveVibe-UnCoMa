import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const EventoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);

  // Función auxiliar para asignar una imagen según el género
  const getImagenPorGenero = (genero) => {
    const generosBuscados = genero ? genero.toLowerCase() : "";

    if (generosBuscados.includes("rock")) {
      return "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=2000&auto=format&fit=crop"; // Concierto de rock, guitarras
    } else if (generosBuscados.includes("jazz")) {
      return "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=2000&auto=format&fit=crop"; // Banda de jazz, saxofón
    } else if (
      generosBuscados.includes("urbano") ||
      generosBuscados.includes("trap")
    ) {
      return "https://images.unsplash.com/photo-1470229722913-7c090be01246?q=80&w=2000&auto=format&fit=crop"; // Escenario con luces de colores neón
    } else if (generosBuscados.includes("indie")) {
      return "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=2000&auto=format&fit=crop"; // Festival al aire libre o ambiente relajado
    } else {
      // Imagen por defecto (la que tenías antes)
      return "https://images.unsplash.com/photo-1540039155732-d674d6e3f0be?q=80&w=2000&auto=format&fit=crop";
    }
  };

  useEffect(() => {
    fetch(`http://localhost:5000/api/eventos/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setEvento({
          ...data,
          // Ahora usamos la función para determinar la imagen
          imagenHero: getImagenPorGenero(data.genero),
          precio: "$15.000",
          disponibles: data.cant_entradas,
        });
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error al cargar el evento:", error);
        setLoading(false);
      });
  }, [id]);

  const handleReserva = async () => {
    setIsReserving(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/eventos/${id}/reservar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario_id: 1, cantidad_entradas: 1 }),
        },
      );

      if (response.ok) {
        setReservationSuccess(true);
      } else {
        alert("Hubo un problema al procesar la reserva.");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        Cargando evento...
      </div>
    );
  }

  if (!evento || evento.error) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        Evento no encontrado.
      </div>
    );
  }

  const fechaFormateada = new Date(evento.fecha).toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {reservationSuccess ? (
          <div className="container mx-auto p-4 md:p-8 mt-10">
            <div className="bg-neutral-800 rounded-2xl p-10 text-center shadow-2xl max-w-2xl mx-auto border border-neutral-700">
              <div className="text-6xl mb-6 text-green-500">✅</div>
              <h2 className="text-4xl font-black text-white mb-2">
                ¡Reserva Confirmada!
              </h2>
              <p className="text-gray-400 mb-8 text-lg">
                Ya tienes tu lugar asegurado para{" "}
                <strong className="text-white">{evento.nombre}</strong>.
              </p>
              <div className="bg-neutral-900 p-6 rounded-xl inline-block mb-8 text-left border border-neutral-800 w-full max-w-md">
                <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-3">
                  Detalles de tu ticket
                </p>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-gray-400">📍</span>
                  <p className="font-semibold text-lg">
                    {evento.lugar}, {evento.ciudad}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">📅</span>
                  <p className="font-semibold text-lg text-green-400 capitalize">
                    {fechaFormateada} {evento.hora_apertura}
                  </p>
                </div>
              </div>
              <br />
              <Link
                to="/"
                className="bg-green-500 hover:bg-green-400 text-black font-bold py-4 px-10 rounded-full transition shadow-lg inline-block text-lg"
              >
                Volver al Catálogo
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div
              className="absolute top-0 left-0 w-full h-[50vh] bg-cover bg-center opacity-40"
              style={{ backgroundImage: `url('${evento.imagenHero}')` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent"></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 pt-8 md:pt-16 pb-12">
              <Link
                to="/"
                className="text-gray-400 hover:text-white flex items-center gap-2 mb-10 transition w-fit font-semibold uppercase text-sm tracking-wider"
              >
                <span>&larr;</span> Volver
              </Link>

              <div className="flex flex-col lg:flex-row gap-12">
                <div className="lg:w-2/3">
                  <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight drop-shadow-lg uppercase">
                    {evento.nombre}
                  </h1>

                  <div className="flex flex-wrap items-center gap-6 mb-8 text-gray-300 font-medium text-lg">
                    <div className="flex items-center gap-2">
                      <span>📍</span> <span>{evento.lugar}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📅</span>{" "}
                      <span className="capitalize">{fechaFormateada}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-neutral-800 px-3 py-1 rounded-full border border-neutral-700">
                        {evento.clasificacion}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mb-12">
                    <button
                      onClick={handleReserva}
                      disabled={isReserving}
                      className={`font-bold py-4 px-10 rounded-full transition shadow-xl text-lg flex justify-center items-center gap-3 ${
                        isReserving
                          ? "bg-neutral-700 cursor-not-allowed text-gray-400"
                          : "bg-green-500 hover:bg-green-400 text-black transform hover:scale-105"
                      }`}
                    >
                      {isReserving ? "Procesando..." : "Reservar Entrada"}
                    </button>

                    {!isReserving && (
                      <span className="text-sm text-gray-400 font-medium">
                        Disponibles:{" "}
                        <strong className="text-white">
                          {evento.disponibles}
                        </strong>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white mb-3">
                      Género Principal
                    </h3>
                    <p className="text-gray-400 leading-relaxed text-lg max-w-3xl">
                      {evento.genero}{" "}
                      {evento.gira ? `- Tour: ${evento.gira}` : ""}
                    </p>
                  </div>
                </div>

                {/* Columna Derecha: Playlist */}
                <div className="lg:w-1/3">
                  <div className="bg-neutral-800/80 backdrop-blur-md rounded-2xl p-6 border border-neutral-700 sticky top-24 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center text-2xl">
                        🎧
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg">
                          Playlist del Evento
                        </h4>
                        <p className="text-xs text-green-400 font-semibold uppercase tracking-wider">
                          Generada por IA
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-6">
                      Música de los artistas y temas favoritos de los fans que
                      ya reservaron.
                    </p>
                    <ul className="space-y-4 mb-6">
                      <li className="flex items-center gap-4 group cursor-pointer">
                        <div className="text-gray-500 font-medium w-4 text-center group-hover:hidden">
                          1
                        </div>
                        <div className="text-green-500 font-medium w-4 text-center hidden group-hover:block">
                          ▶
                        </div>
                        <div>
                          <p className="text-white font-medium group-hover:text-green-400 transition">
                            Tema Principal
                          </p>
                          <p className="text-gray-500 text-sm">
                            Artista del Evento
                          </p>
                        </div>
                      </li>
                      <li className="flex items-center gap-4 group cursor-pointer">
                        <div className="text-gray-500 font-medium w-4 text-center group-hover:hidden">
                          2
                        </div>
                        <div className="text-green-500 font-medium w-4 text-center hidden group-hover:block">
                          ▶
                        </div>
                        <div>
                          <p className="text-white font-medium group-hover:text-green-400 transition">
                            Sugerencia IA
                          </p>
                          <p className="text-gray-500 text-sm">
                            Basado en {evento.genero}
                          </p>
                        </div>
                      </li>
                    </ul>
                    <button className="w-full bg-transparent hover:bg-neutral-700 text-white font-bold py-3 rounded-full border border-gray-600 hover:border-gray-400 transition text-sm flex items-center justify-center gap-2">
                      <span className="text-green-500">Spotify</span> Abrir
                      Playlist
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default EventoDetalle;

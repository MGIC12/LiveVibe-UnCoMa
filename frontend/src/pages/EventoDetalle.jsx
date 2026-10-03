import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const EventoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isReserving, setIsReserving] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);

  // Mock data del evento
  const eventoMock = {
    id: id,
    titulo: "LOS FUNDAMENTALES DEL ROCK",
    fechaHora: "2026-10-15T21:00:00",
    lugar: "Estadio Único",
    disponibles: 342,
    descripcion:
      "La gira de despedida más esperada del año. Un repaso histórico por los himnos que marcaron a más de tres generaciones en una noche que promete ser inolvidable. Cierre con artistas invitados sorpresa.",
    // Usamos una imagen ancha y oscura para el efecto inmersivo
    imagenHero:
      "https://images.pexels.com/photos/14591832/pexels-photo-14591832.jpeg",
    precio: "$15.000",
  };

  const handleReserva = () => {
    setIsReserving(true);
    setTimeout(() => {
      setIsReserving(false);
      setReservationSuccess(true);
    }, 1500);
  };

  const fechaFormateada = new Date(eventoMock.fechaHora).toLocaleDateString(
    "es-AR",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans flex flex-col">
      <Navbar />

      <main className="grow">
        {reservationSuccess ? (
          // VISTA DE ÉXITO
          <div className="container mx-auto p-4 md:p-8 mt-10">
            <div className="bg-neutral-800 rounded-2xl p-10 text-center shadow-2xl max-w-2xl mx-auto border border-neutral-700">
              <div className="text-6xl mb-6 text-green-500">✅</div>
              <h2 className="text-4xl font-black text-white mb-2">
                ¡Reserva Confirmada!
              </h2>
              <p className="text-gray-400 mb-8 text-lg">
                Ya tienes tu lugar asegurado para{" "}
                <strong className="text-white">{eventoMock.titulo}</strong>.
              </p>
              <div className="bg-neutral-900 p-6 rounded-xl inline-block mb-8 text-left border border-neutral-800 w-full max-w-md">
                <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-3">
                  Detalles de tu ticket
                </p>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-gray-400">📍</span>
                  <p className="font-semibold text-lg">{eventoMock.lugar}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">📅</span>
                  <p className="font-semibold text-lg text-green-400 capitalize">
                    {fechaFormateada}
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
          // VISTA DETALLE DE EVENTO
          <div className="relative">
            <div
              className="absolute top-0 left-0 w-full h-[50vh] bg-cover bg-center opacity-40"
              style={{ backgroundImage: `url('${eventoMock.imagenHero}')` }}
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
                {/* Info del Evento */}
                <div className="lg:w-2/3">
                  <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight drop-shadow-lg">
                    {eventoMock.titulo}
                  </h1>

                  <div className="flex flex-wrap items-center gap-6 mb-8 text-gray-300 font-medium text-lg">
                    <div className="flex items-center gap-2">
                      <span>📍</span> <span>{eventoMock.lugar}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📅</span>{" "}
                      <span className="capitalize">{fechaFormateada}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🎟️</span>{" "}
                      <span className="text-green-400 font-bold">
                        {eventoMock.precio}
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
                      {isReserving ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 h-5 w-5 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Procesando...
                        </>
                      ) : (
                        "Reservar Entrada"
                      )}
                    </button>

                    {!isReserving && (
                      <span className="text-sm text-gray-400 font-medium">
                        Solo quedan{" "}
                        <strong className="text-white">
                          {eventoMock.disponibles}
                        </strong>{" "}
                        lugares
                      </span>
                    )}
                  </div>

                  {/* Descripción */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3">
                      Sobre el concierto
                    </h3>
                    <p className="text-gray-400 leading-relaxed text-lg max-w-3xl">
                      {eventoMock.descripcion}
                    </p>
                  </div>
                </div>

                {/* COLUMNA DERECHA: La Playlist Sugerida */}
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
                            Juguetes Perdidos
                          </p>
                          <p className="text-gray-500 text-sm">Los Redondos</p>
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
                            Crimen
                          </p>
                          <p className="text-gray-500 text-sm">
                            Gustavo Cerati (Fan Fav)
                          </p>
                        </div>
                      </li>
                      <li className="flex items-center gap-4 group cursor-pointer">
                        <div className="text-gray-500 font-medium w-4 text-center group-hover:hidden">
                          3
                        </div>
                        <div className="text-green-500 font-medium w-4 text-center hidden group-hover:block">
                          ▶
                        </div>
                        <div>
                          <p className="text-white font-medium group-hover:text-green-400 transition">
                            Seminare
                          </p>
                          <p className="text-gray-500 text-sm">Serú Girán</p>
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

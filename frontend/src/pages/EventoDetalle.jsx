import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../../context/AuthContext"; // Importamos el contexto de usuario

const EventoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth(); // Extraemos el usuario autenticado

  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para el Feature 8 (Reservas)
  const [isReserving, setIsReserving] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Función para determinar imagen inmersiva según género
  const getImagenPorGenero = (genero) => {
    const gen = genero ? genero.toLowerCase() : "";
    if (gen.includes("rock"))
      return "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=2000&auto=format&fit=crop";
    if (gen.includes("jazz"))
      return "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=2000&auto=format&fit=crop";
    if (
      gen.includes("urbano") ||
      gen.includes("trap") ||
      gen.includes("reggaeton")
    )
      return "https://images.unsplash.com/photo-1470229722913-7c090be01246?q=80&w=2000&auto=format&fit=crop";
    if (gen.includes("indie"))
      return "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=2000&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1540039155732-d674d6e3f0be?q=80&w=2000&auto=format&fit=crop"; // Default concert
  };

  useEffect(() => {
    // 1. Cargar datos del evento desde el backend
    fetch(`http://localhost:5000/api/eventos/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setEvento({
          ...data,
          imagenHero: getImagenPorGenero(data.genero),
          disponibles: data.cant_entradas || 100, // Fallback si no hay cant_entradas
        });
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error al cargar el evento:", error);
        setLoading(false);
      });
  }, [id]);

  // 2. Lógica del FEATURE 8: Procesar Reserva
  const handleReserva = async () => {
    setErrorMessage("");

    // Validación: El usuario debe estar logueado para reservar
    if (!usuario) {
      alert("Debes iniciar sesión o registrarte para poder reservar entradas.");
      navigate("/login");
      return;
    }

    setIsReserving(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/eventos/${id}/reservar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Enviamos el token si usas JWT
          },
          // Enviamos el nombre de usuario (o el ID, ajusta según cómo lo dejaste en tu backend)
          body: JSON.stringify({ nombre_usuario: usuario.nombre_usuario }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setReservationSuccess(true);
      } else {
        setErrorMessage(
          data.error || "Hubo un problema al procesar tu reserva.",
        );
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setErrorMessage("Error de conexión con el servidor.");
    } finally {
      setIsReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center font-bold text-xl animate-pulse">
        Cargando evento...
      </div>
    );
  }

  if (!evento || evento.error) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center text-xl">
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
          // PANTALLA DE ÉXITO DE RESERVA
          <div className="container mx-auto p-4 md:p-8 mt-20">
            <div className="bg-neutral-800 rounded-3xl p-10 text-center shadow-2xl max-w-2xl mx-auto border border-neutral-700">
              <div className="text-7xl mb-6 text-green-500 animate-bounce">
                ✅
              </div>
              <h2 className="text-4xl font-black text-white mb-2">
                ¡Reserva Confirmada!
              </h2>
              <p className="text-gray-400 mb-8 text-lg">
                Ya tienes tu lugar asegurado para{" "}
                <strong className="text-white uppercase">
                  {evento.nombre}
                </strong>
                .
              </p>

              <div className="bg-neutral-900 p-6 rounded-2xl inline-block mb-8 text-left border border-neutral-800 w-full max-w-md shadow-inner">
                <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-4 border-b border-neutral-800 pb-2">
                  Detalles de tu ticket
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-gray-400 text-xl">📍</span>
                  <p className="font-semibold text-lg">
                    {evento.lugar}, {evento.ciudad}
                  </p>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-gray-400 text-xl">📅</span>
                  <p className="font-semibold text-lg text-green-400 capitalize">
                    {fechaFormateada} {evento.hora_apertura}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-xl">👤</span>
                  <p className="font-semibold text-lg text-gray-300">
                    Titular: {usuario.nombre_completo || usuario.nombre_usuario}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
                <Link
                  to="/mis-reservas"
                  className="bg-green-500 hover:bg-green-400 text-black font-bold py-4 px-8 rounded-full transition shadow-lg text-lg"
                >
                  Ver Mis Entradas
                </Link>
                <Link
                  to="/"
                  className="bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-4 px-8 rounded-full transition border border-neutral-600 text-lg"
                >
                  Volver al Catálogo
                </Link>
              </div>
            </div>
          </div>
        ) : (
          // PANTALLA DE DETALLE DEL EVENTO
          <div className="relative">
            {/* Fondo inmersivo */}
            <div
              className="absolute top-0 left-0 w-full h-[60vh] bg-cover bg-center opacity-30"
              style={{ backgroundImage: `url('${evento.imagenHero}')` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/80 to-transparent"></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 pt-8 md:pt-24 pb-12">
              <Link
                to="/"
                className="text-gray-400 hover:text-white flex items-center gap-2 mb-8 transition w-fit font-semibold uppercase text-sm tracking-wider bg-neutral-800/50 px-4 py-2 rounded-full backdrop-blur-sm border border-neutral-700/50"
              >
                <span>&larr;</span> Volver al catálogo
              </Link>

              <div className="flex flex-col lg:flex-row gap-12">
                {/* Info del Evento */}
                <div className="lg:w-2/3">
                  <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight drop-shadow-lg uppercase tracking-tight">
                    {evento.nombre}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 mb-8 text-gray-300 font-medium text-lg">
                    <span className="bg-neutral-800 border border-neutral-700 px-4 py-2 rounded-full flex items-center gap-2">
                      📍 {evento.lugar}, {evento.ciudad}
                    </span>
                    <span className="bg-neutral-800 border border-neutral-700 px-4 py-2 rounded-full flex items-center gap-2 capitalize">
                      📅 {fechaFormateada}
                    </span>
                    <span className="bg-purple-900/30 text-purple-400 border border-purple-500/30 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider">
                      {evento.genero}
                    </span>
                  </div>

                  {/* Panel de Reserva */}
                  <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-2xl p-6 mb-12 backdrop-blur-sm">
                    {errorMessage && (
                      <div className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400 text-sm font-bold">
                        ⚠️ {errorMessage}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">
                          Estado de tickets
                        </p>
                        <p className="text-2xl font-black text-white">
                          Disponibles:{" "}
                          <span className="text-green-400">
                            {evento.disponibles}
                          </span>
                        </p>
                      </div>

                      <button
                        onClick={handleReserva}
                        disabled={isReserving}
                        className={`w-full sm:w-auto font-bold py-4 px-10 rounded-full transition shadow-xl text-lg flex justify-center items-center gap-3 ${
                          isReserving
                            ? "bg-neutral-700 cursor-not-allowed text-gray-400"
                            : "bg-green-500 hover:bg-green-400 text-black transform hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
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
                    </div>
                  </div>

                  {/* Descripción del evento */}
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4 border-b border-neutral-800 pb-2">
                      Sobre el concierto
                    </h3>
                    <p className="text-gray-400 leading-relaxed text-lg max-w-3xl">
                      {evento.descripcion ||
                        "Únete a este increíble evento y vive la mejor música en directo junto a tu comunidad. Un show imperdible que marcará la agenda musical del mes."}
                    </p>
                  </div>
                </div>

                {/* Columna Derecha: Playlist Inteligente */}
                <div className="lg:w-1/3 mt-8 lg:mt-0">
                  <div className="bg-neutral-800/80 backdrop-blur-md rounded-3xl p-8 border border-neutral-700 sticky top-24 shadow-2xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-3xl shadow-lg">
                        🎧
                      </div>
                      <div>
                        <h4 className="font-black text-white text-xl">
                          Soundtrack
                        </h4>
                        <p className="text-xs text-green-400 font-bold uppercase tracking-wider">
                          Sugerencia IA
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 mb-8 font-medium leading-relaxed">
                      Prepárate para el show con las canciones favoritas de los
                      fans de{" "}
                      <strong className="text-gray-200">{evento.genero}</strong>{" "}
                      que ya reservaron su lugar.
                    </p>

                    <ul className="space-y-4 mb-8">
                      {[1, 2, 3].map((num) => (
                        <li
                          key={num}
                          className="flex items-center gap-4 group cursor-pointer p-2 rounded-xl hover:bg-neutral-700/50 transition"
                        >
                          <div className="text-gray-500 font-bold w-4 text-center group-hover:hidden">
                            {num}
                          </div>
                          <div className="text-green-500 font-bold w-4 text-center hidden group-hover:block">
                            ▶
                          </div>
                          <div>
                            <p className="text-white font-bold group-hover:text-green-400 transition">
                              Hit Sensación {num}
                            </p>
                            <p className="text-gray-500 text-sm">
                              Artista Sorpresa
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>

                    <button className="w-full bg-transparent hover:bg-neutral-700 text-white font-bold py-3.5 rounded-full border-2 border-neutral-600 hover:border-gray-400 transition text-sm flex items-center justify-center gap-2">
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

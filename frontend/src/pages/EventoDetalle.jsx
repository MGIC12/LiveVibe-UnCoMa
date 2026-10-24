import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../../context/AuthContext";
import { formatearPrecio } from "../utils/formularios";
import { API } from "../utils/api";

const EventoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isReserving, setIsReserving] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { usuario, token } = useAuth();

  // Cancelación del evento (solo el artista dueño)
  const [confirmando, setConfirmando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [errorCancelar, setErrorCancelar] = useState("");

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
    return "https://images.unsplash.com/photo-1540039155732-d674d6e3f0be?q=80&w=2000&auto=format&fit=crop";
  };

  useEffect(() => {
    fetch(`http://localhost:5000/api/eventos/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setEvento({
          ...data,
          imagenHero: getImagenPorGenero(data.genero),
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
    setErrorMessage("");

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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
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

  // El artista dueño cancela su evento
  const cancelarEvento = async () => {
    setErrorCancelar("");
    setCancelando(true);
    try {
      const res = await fetch(`${API}/api/eventos/${id}/cancelar`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data.error || "No se pudo cancelar el evento");

      // La página se actualiza sin recargar
      setEvento((actual) => ({ ...actual, estado: "cancelado" }));
      setConfirmando(false);
    } catch (err) {
      setErrorCancelar(err.message);
    } finally {
      setCancelando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-tinta text-crema flex items-center justify-center">
        Cargando evento...
      </div>
    );
  }

  if (!evento || evento.error) {
    return (
      <div className="min-h-screen bg-tinta text-crema flex items-center justify-center">
        Evento no encontrado.
      </div>
    );
  }

  // La base manda la fecha como "2026-10-20T00:00:00.000Z": nos quedamos con el día
  // y lo armamos como fecha local, para que no se corra al día anterior.
  const dia = String(evento.fecha).slice(0, 10);
  const fechaFormateada = new Date(`${dia}T00:00:00`).toLocaleDateString(
    "es-AR",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const cancelado = evento.estado === "cancelado";
  const yaOcurrio = dia < new Date().toLocaleDateString("en-CA");
  const esDueno = usuario && usuario.nombre_usuario === evento.nombre_artista;
  const puedeModificar = esDueno && !cancelado && !yaOcurrio;

  // Qué se muestra en lugar del botón de reservar, según quién mira
  let acciones;
  if (puedeModificar) {
    acciones = confirmando ? (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-crema/80">
          ¿Cancelar este evento? No se puede deshacer.
        </span>
        <button
          onClick={() => setConfirmando(false)}
          disabled={cancelando}
          className="py-3 px-6 rounded-full border border-crema/30 text-crema/80 hover:border-crema font-bold disabled:opacity-50"
        >
          No, volver
        </button>
        <button
          onClick={cancelarEvento}
          disabled={cancelando}
          className="py-3 px-6 rounded-full bg-mandarina hover:bg-sol text-tinta font-bold disabled:opacity-50"
        >
          {cancelando ? "Cancelando..." : "Sí, cancelar evento"}
        </button>
      </div>
    ) : (
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to={`/eventos/${id}/editar`}
          className="font-bold py-4 px-10 rounded-full bg-fucsia hover:bg-chicle text-tinta text-lg shadow-xl transition transform hover:scale-105"
        >
          Editar evento
        </Link>
        <button
          onClick={() => setConfirmando(true)}
          className="font-bold py-4 px-8 rounded-full border border-mandarina text-mandarina hover:bg-mandarina hover:text-tinta text-lg transition"
        >
          Cancelar evento
        </button>
      </div>
    );
  } else if (esDueno) {
    acciones = (
      <span className="text-sm text-crema/70 font-medium">
        {cancelado
          ? "Cancelaste este evento."
          : "Este evento ya ocurrió: no se puede modificar ni cancelar."}
      </span>
    );
  } else {
    const bloqueado = isReserving || cancelado || yaOcurrio;
    acciones = (
      <button
        onClick={handleReserva}
        disabled={bloqueado}
        className={`font-bold py-4 px-10 rounded-full transition shadow-xl text-lg flex justify-center items-center gap-3 ${
          bloqueado
            ? "bg-crema/10 cursor-not-allowed text-crema/50"
            : "bg-fucsia hover:bg-chicle text-tinta transform hover:scale-105"
        }`}
      >
        {cancelado
          ? "Evento cancelado"
          : yaOcurrio
            ? "Evento finalizado"
            : isReserving
              ? "Procesando..."
              : "Reservar Entrada"}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-tinta text-crema font-sans flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {reservationSuccess ? (
          <div className="container mx-auto p-4 md:p-8 mt-10">
            <div className="bg-crema/5 rounded-2xl p-10 text-center shadow-2xl max-w-2xl mx-auto border border-crema/20">
              <div className="text-6xl mb-6">✅</div>
              <h2 className="text-4xl font-black text-crema mb-2">
                ¡Reserva Confirmada!
              </h2>
              <p className="text-gray-400 mb-8 text-lg">
                Ya tienes tu lugar asegurado para{" "}
                <strong className="text-white uppercase">
                  {evento.nombre}
                </strong>
                {evento.nombre_artista && ` de ${evento.nombre_artista}`}.
              </p>
              <div className="bg-tinta p-6 rounded-xl inline-block mb-8 text-left border border-crema/20 w-full max-w-md">
                <p className="text-sm text-crema/60 uppercase font-bold tracking-wider mb-3">
                  Detalles de tu ticket
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-gray-400 text-xl">📍</span>
                  <p className="font-semibold text-lg">
                    {evento.lugar}, {evento.ciudad}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-crema/70">📅</span>
                  <p className="font-semibold text-lg text-cielo capitalize">
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
          <div className="relative">
            <div
              className="absolute top-0 left-0 w-full h-[60vh] bg-cover bg-center opacity-30"
              style={{ backgroundImage: `url('${evento.imagenHero}')` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-tinta to-transparent"></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 pt-8 md:pt-24 pb-12">
              <Link
                to="/"
                className="text-gray-400 hover:text-white flex items-center gap-2 mb-8 transition w-fit font-semibold uppercase text-sm tracking-wider bg-neutral-800/50 px-4 py-2 rounded-full backdrop-blur-sm border border-neutral-700/50"
              >
                <span>&larr;</span> Volver al catálogo
              </Link>

              <div className="flex flex-col lg:flex-row gap-12">
                <div className="lg:w-2/3">
                  {cancelado && (
                    <span className="inline-block mb-4 text-xs font-bold px-3 py-1 rounded-full bg-mandarina text-tinta uppercase tracking-wider">
                      Evento cancelado
                    </span>
                  )}

                  <h1 className="text-5xl md:text-7xl font-black text-crema mb-4 leading-tight drop-shadow-lg uppercase">
                    {evento.nombre}
                  </h1>

                  {/* NUEVO DISEÑO PARA EL ARTISTA (Enlace directo a su perfil) */}
                  {evento.nombre_artista && (
                    <Link
                      to={`/artista/${encodeURIComponent(evento.nombre_artista)}`}
                      className="inline-block mb-3 text-cielo hover:text-crema font-bold transition"
                    >
                      🎤 {evento.artista_nombre || evento.nombre_artista}
                    </Link>
                  )}

                  <div className="flex flex-wrap items-center gap-6 mb-8 text-crema/80 font-medium text-lg">
                    <div className="flex items-center gap-2">
                      <span>📍</span> <span>{evento.lugar}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📅</span>{" "}
                      <span className="capitalize">{fechaFormateada}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-crema/5 px-3 py-1 rounded-full border border-crema/20">
                        {evento.clasificacion}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-4 mb-12">
                    {acciones}
                  </div>

                  <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-2xl p-6 mb-12 backdrop-blur-sm">
                    {errorMessage && (
                      <div className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400 text-sm font-bold">
                        ⚠️ {errorMessage}
                      </div>
                    )}

                    {evento.precio_desde != null && (
                      <div className="flex items-center gap-2 text-sm text-crema/70 font-medium">
                        <span>Entradas desde:</span>
                        <span className="text-sol font-bold">
                          {formatearPrecio(evento.precio_desde)} 🎟️
                        </span>
                      </div>
                    )}

                    {errorCancelar && (
                      <p
                        className="w-full text-mandarina text-sm mt-2"
                        role="alert"
                      >
                        {errorCancelar}
                      </p>
                    )}
                  </div>

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

                {/* Columna Derecha: Playlist */}
                <div className="lg:w-1/3">
                  <div className="bg-tinta/80 backdrop-blur-md rounded-2xl p-6 border border-crema/20 sticky top-24 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-crema/10 rounded-full flex items-center justify-center text-2xl">
                        🎧
                      </div>
                      <div>
                        <h4 className="font-black text-white text-xl">
                          Soundtrack
                        </h4>
                        <p className="text-xs text-cielo font-semibold uppercase tracking-wider">
                          Generada por IA
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 mb-8 font-medium leading-relaxed">
                      Prepárate para el show con las canciones favoritas de los
                      fans de{" "}
                      <strong className="text-gray-200">{evento.genero}</strong>{" "}
                      que ya reservaron su lugar.
                    </p>
                    <ul className="space-y-4 mb-6">
                      <li className="flex items-center gap-4 group cursor-pointer">
                        <div className="text-crema/60 font-medium w-4 text-center group-hover:hidden">
                          1
                        </div>
                        <div className="text-fucsia font-medium w-4 text-center hidden group-hover:block">
                          ▶
                        </div>
                        <div>
                          <p className="text-crema font-medium group-hover:text-cielo transition">
                            Tema Principal
                          </p>
                          <p className="text-crema/60 text-sm">
                            {evento.nombre_artista || "Artista del Evento"}
                          </p>
                        </div>
                      </li>
                      <li className="flex items-center gap-4 group cursor-pointer">
                        <div className="text-crema/60 font-medium w-4 text-center group-hover:hidden">
                          2
                        </div>
                        <div className="text-fucsia font-medium w-4 text-center hidden group-hover:block">
                          ▶
                        </div>
                        <div>
                          <p className="text-crema font-medium group-hover:text-cielo transition">
                            Sugerencia IA
                          </p>
                          <p className="text-crema/60 text-sm">
                            Basado en {evento.genero}
                          </p>
                        </div>
                      </li>
                    </ul>
                    <button className="w-full bg-transparent hover:bg-crema/10 text-crema font-bold py-3 rounded-full border border-crema/30 hover:border-crema/60 transition text-sm flex items-center justify-center gap-2">
                      <span className="text-cielo">Spotify</span> Abrir Playlist
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

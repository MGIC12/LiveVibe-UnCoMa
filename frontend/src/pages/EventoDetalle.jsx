import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ImagenEvento from "../components/ImagenEvento";
import { useAuth } from "../../context/AuthContext";
import { formatearPrecio } from "../utils/formularios";
import { API } from "../utils/api";

const EventoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario, token } = useAuth();

  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isReserving, setIsReserving] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Cancelación del evento (solo el artista dueño)
  const [confirmando, setConfirmando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [errorCancelar, setErrorCancelar] = useState("");

  useEffect(() => {
    let activo = true;
    fetch(`${API}/api/eventos/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (activo) setEvento(data);
      })
      .catch((error) => {
        console.error("Error al cargar el evento:", error);
      })
      .finally(() => {
        if (activo) setLoading(false);
      });
    return () => {
      activo = false;
    };
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
      const response = await fetch(`${API}/api/eventos/${id}/reservar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setReservationSuccess(true);
      } else {
        setErrorMessage(data.error || "Hubo un problema al procesar tu reserva.");
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
      if (!res.ok) throw new Error(data.error || "No se pudo cancelar el evento");

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
  const fechaFormateada = new Date(`${dia}T00:00:00`).toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
  } else if (usuario?.rol === "artista") {
    // Si es un artista viendo el evento de otro artista, se le bloquea la reserva
    acciones = (
      <span className="text-sm text-crema/70 font-medium px-4 py-2 bg-crema/5 border border-crema/20 rounded-full">
        Solo las cuentas de Fans pueden reservar entradas.
      </span>
    );
  } else {
    // Flujo normal para Fans o usuarios no logueados (que serán redirigidos)
    const agotado = evento.entradas_disponibles === 0;
    const bloqueado = isReserving || cancelado || yaOcurrio || agotado;
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
            : agotado
              ? "Entradas agotadas"
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
          <div className="container mx-auto p-4 md:p-8 pt-28">
            <div className="bg-crema/5 rounded-2xl p-10 text-center shadow-2xl max-w-2xl mx-auto border border-crema/20">
              <div className="text-6xl mb-6">✅</div>
              <h2 className="text-4xl font-black text-crema mb-2">
                ¡Reserva Confirmada!
              </h2>
              <p className="text-crema/70 mb-8 text-lg">
                Ya tienes tu lugar asegurado para{" "}
                <strong className="text-crema uppercase">{evento.nombre}</strong>
                {evento.nombre_artista &&
                  ` de ${evento.artista_nombre || evento.nombre_artista}`}
                .
              </p>
              <div className="bg-tinta p-6 rounded-xl inline-block mb-8 text-left border border-crema/20 w-full max-w-md">
                <p className="text-sm text-crema/60 uppercase font-bold tracking-wider mb-3">
                  Detalles de tu ticket
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-crema/70 text-xl">📍</span>
                  <p className="font-semibold text-lg">
                    {evento.lugar}, {evento.ciudad}
                  </p>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-crema/70 text-xl">📅</span>
                  <p className="font-semibold text-lg text-cielo capitalize">
                    {fechaFormateada} {evento.hora_apertura}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-crema/70 text-xl">👤</span>
                  <p className="font-semibold text-lg text-crema/80">
                    Titular: {usuario.nombre_completo || usuario.nombre_usuario}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
                <Link
                  to="/mis-reservas"
                  className="bg-fucsia hover:bg-chicle text-tinta font-bold py-4 px-8 rounded-full transition shadow-lg text-lg"
                >
                  Ver Mis Entradas
                </Link>
                <Link
                  to="/"
                  className="border border-crema/30 text-crema hover:bg-crema hover:text-tinta font-bold py-4 px-8 rounded-full transition text-lg"
                >
                  Volver al Catálogo
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="container mx-auto px-4 pt-24 md:pt-28 pb-12">
            <Link
              to="/"
              className="text-crema/70 hover:text-crema flex items-center gap-2 mb-6 transition w-fit font-semibold uppercase text-sm tracking-wider bg-crema/10 px-4 py-2 rounded-full backdrop-blur-sm border border-crema/20"
            >
              <span>&larr;</span> Volver al catálogo
            </Link>

            <div className="flex flex-col lg:flex-row gap-12">
              <div className="lg:w-2/3">
                {/* Imagen del evento con el título encima */}
                <div className="relative min-h-[10rem] sm:min-h-[13rem] flex items-end rounded-2xl overflow-hidden border border-crema/20 shadow-2xl mb-6">
                  <ImagenEvento
                    evento={evento}
                    className={`absolute inset-0 w-full h-full object-cover ${
                      cancelado ? "grayscale opacity-60" : ""
                    }`}
                  />
                  {/* El degradado hace legible el título y funde la imagen con el fondo */}
                  <div className="absolute inset-0 bg-gradient-to-t from-tinta via-tinta/60 to-transparent"></div>

                  {cancelado && (
                    <span className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full bg-mandarina text-tinta uppercase tracking-wider">
                      Evento cancelado
                    </span>
                  )}

                  <h1 className="relative z-10 min-w-0 px-5 pb-5 pt-16 text-4xl sm:text-5xl md:text-6xl font-black text-crema leading-tight drop-shadow-lg uppercase">
                    {evento.nombre}
                  </h1>
                </div>

                <div className="px-1">

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
                    {evento.clasificacion && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-crema/5 px-3 py-1 rounded-full border border-crema/20">
                          {evento.clasificacion}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-4 mb-12">
                    {acciones}
                  </div>

                  <div className="bg-crema/5 border border-crema/20 rounded-2xl p-6 mb-12 backdrop-blur-sm">
                    {errorMessage && (
                      <div
                        className="mb-4 p-4 bg-mandarina/15 border border-mandarina/50 rounded-xl text-mandarina text-sm font-bold"
                        role="alert"
                      >
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
                      <p className="w-full text-mandarina text-sm mt-2" role="alert">
                        {errorCancelar}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-crema mb-4 border-b border-crema/20 pb-2">
                      Sobre el concierto
                    </h3>
                    <p className="text-crema/70 leading-relaxed text-lg max-w-3xl">
                      {evento.descripcion ||
                        "Únete a este increíble evento y vive la mejor música en directo junto a tu comunidad. Un show imperdible que marcará la agenda musical del mes."}
                    </p>
                  </div>
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
                      <h4 className="font-black text-crema text-xl">Soundtrack</h4>
                      <p className="text-xs text-cielo font-semibold uppercase tracking-wider">
                        Generada por IA
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-crema/70 mb-8 font-medium leading-relaxed">
                    Prepárate para el show con las canciones favoritas de los fans de{" "}
                    <strong className="text-crema">{evento.genero}</strong> que ya
                    reservaron su lugar.
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
                          {evento.artista_nombre || evento.nombre_artista || "Artista del Evento"}
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
                        <p className="text-crema/60 text-sm">Basado en {evento.genero}</p>
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
        )}
      </main>

      <Footer />
    </div>
  );
};

export default EventoDetalle;
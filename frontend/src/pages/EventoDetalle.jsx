import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ImagenEvento from "../components/ImagenEvento";
import { useAuth } from "../../context/AuthContext";
import { formatearPrecio } from "../utils/formularios";
import { API } from "../utils/api";
import { primeraMayuscula } from "../utils/tiempo";
import Avatar from "../components/Avatar";

const EventoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario, token } = useAuth();

  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cantMerch, setCantMerch] = useState(0);
  const [soundtrack, setSoundtrack] = useState([]); // temas sugeridos por IA

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

  // Si el artista del evento vende merch, se ofrece el enlace a su tienda
  const artistaEvento = evento?.nombre_artista;
  useEffect(() => {
    if (!artistaEvento) return;
    let activo = true;
    fetch(`${API}/api/merch?artista=${encodeURIComponent(artistaEvento)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (activo) setCantMerch(Array.isArray(data) ? data.length : 0);
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [artistaEvento]);

  // Soundtrack sugerido por IA; si falla, la tarjeta simplemente no aparece
  useEffect(() => {
    let activo = true;
    fetch(`${API}/api/ia/eventos/${id}/soundtrack`)
      .then((res) => (res.ok ? res.json() : { temas: [] }))
      .then((data) => {
        if (activo) setSoundtrack(Array.isArray(data.temas) ? data.temas : []);
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [id]);

  const handleReserva = async () => {
    setErrorMessage("");

    if (!usuario) {
      alert("Tenés que iniciar sesión o registrarte para poder reservar entradas.");
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
                : "Reservar entrada"}
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
                Ya tenés tu lugar asegurado para{" "}
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
                  <p className="font-semibold text-lg text-cielo">
                    {primeraMayuscula(fechaFormateada)} {evento.hora_apertura}
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
                  Ver mis entradas
                </Link>
                <Link
                  to="/"
                  className="border border-crema/30 text-crema hover:bg-crema hover:text-tinta font-bold py-4 px-8 rounded-full transition text-lg"
                >
                  Volver al catálogo
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
                      <span>{primeraMayuscula(fechaFormateada)}</span>
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
                        `${evento.gira ? `Parte de la gira "${evento.gira}". ` : ""}Un show de ${evento.genero || "música en vivo"}${evento.lugar ? ` en ${evento.lugar}` : ""}${evento.ciudad ? `, ${evento.ciudad}` : ""}.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Columna derecha: datos del evento y del artista */}
              <div className="lg:w-1/3">
                <div className="bg-tinta/80 backdrop-blur-md rounded-2xl p-6 border border-crema/20 sticky top-24 shadow-2xl space-y-6">
                  <div>
                    <h4 className="font-black text-crema text-xl mb-4">Datos del evento</h4>
                    <dl className="space-y-3 text-sm">
                      {[
                        ["Género", evento.genero],
                        ["Ciudad", [evento.ciudad, evento.pais].filter(Boolean).join(", ")],
                        ["Lugar", evento.lugar],
                        ["Apertura de puertas", evento.hora_apertura ? `${String(evento.hora_apertura).slice(0, 5)} hs` : null],
                        ["Clasificación", evento.clasificacion],
                        ["Gira", evento.gira],
                      ]
                        .filter(([, valor]) => valor)
                        .map(([etiqueta, valor]) => (
                          <div key={etiqueta} className="flex justify-between gap-4">
                            <dt className="text-crema/60">{etiqueta}</dt>
                            <dd className="font-bold text-crema text-right">{valor}</dd>
                          </div>
                        ))}
                    </dl>
                  </div>

                  {evento.nombre_artista && (
                    <div className="border-t border-crema/20 pt-6">
                      <p className="text-xs text-cielo font-semibold uppercase tracking-wider mb-3">
                        El artista
                      </p>
                      <Link
                        to={`/artista/${encodeURIComponent(evento.nombre_artista)}`}
                        className="flex items-center gap-3 group"
                      >
                        <Avatar
                          usuario={{ nombre_usuario: evento.artista_nombre || evento.nombre_artista }}
                          clases="w-12 h-12 text-lg"
                        />
                        <span className="font-black text-crema text-lg group-hover:text-cielo transition">
                          {evento.artista_nombre || evento.nombre_artista}
                        </span>
                      </Link>
                      <div className="mt-4 flex flex-col gap-2">
                        <Link
                          to={`/artista/${encodeURIComponent(evento.nombre_artista)}`}
                          className="w-full text-center bg-transparent hover:bg-crema/10 text-crema font-bold py-3 rounded-full border border-crema/30 hover:border-crema/60 transition text-sm"
                        >
                          Ver perfil
                        </Link>
                        {cantMerch > 0 && (
                          <Link
                            to={`/artista/${encodeURIComponent(evento.nombre_artista)}#merch`}
                            className="w-full text-center bg-fucsia/15 hover:bg-fucsia/30 text-fucsia font-bold py-3 rounded-full border border-fucsia/40 transition text-sm"
                          >
                            🛍️ Ver merch de {evento.artista_nombre || evento.nombre_artista}
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {soundtrack.length > 0 && (
                    <div className="border-t border-crema/20 pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">🎧</span>
                        <div>
                          <h4 className="font-black text-crema text-lg leading-tight">
                            Para ir entrando en clima
                          </h4>
                          <p className="text-xs text-cielo font-semibold uppercase tracking-wider">
                            Sugerido por IA
                          </p>
                        </div>
                      </div>
                      <ul className="space-y-3">
                        {soundtrack.map((t, i) => (
                          <li key={`${t.titulo}-${i}`}>
                            <a
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${t.titulo} ${t.artista}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={t.motivo || undefined}
                              className="flex items-start gap-3 group"
                            >
                              <span className="w-4 text-center text-crema/60 text-sm pt-0.5 group-hover:text-fucsia">
                                {i + 1}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-crema font-medium group-hover:text-cielo transition">
                                  {t.titulo}
                                </span>
                                <span className="block text-crema/60 text-sm">{t.artista}</span>
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                      <p className="text-[11px] text-crema/40 mt-4">
                        Generado con IA: puede equivocarse. Cada tema abre una búsqueda en YouTube.
                      </p>
                    </div>
                  )}
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
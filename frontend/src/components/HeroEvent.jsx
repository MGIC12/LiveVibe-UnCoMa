import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";
import { formatearPrecio } from "../utils/formularios";

const HeroEvent = () => {
  const { usuario, token } = useAuth();
  const navigate = useNavigate();

  const [eventoDestacado, setEventoDestacado] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Reserva directa desde el hero
  const [reservando, setReservando] = useState(false);
  const [reservado, setReservado] = useState(false);
  const [error, setError] = useState("");

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
    let activo = true;
    fetch(`${API}/api/eventos`)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar los eventos");
        return res.json();
      })
      .then((data) => {
        if (!activo) return;
        // Solo eventos que todavía no ocurrieron: son los que se pueden reservar
        const hoy = new Date().toLocaleDateString("en-CA");
        const vigentes = Array.isArray(data)
          ? data.filter((e) => String(e.fecha).slice(0, 10) >= hoy)
          : [];
        if (vigentes.length > 0) {
          // Evento random
          setEventoDestacado(vigentes[Math.floor(Math.random() * vigentes.length)]);
        }
      })
      .catch((error) => {
        console.error("Error al cargar evento destacado:", error);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const handleReservar = async () => {
    setError("");

    // Para reservar hay que haber iniciado sesión
    if (!usuario) {
      navigate("/login");
      return;
    }

    setReservando(true);
    try {
      const res = await fetch(
        `${API}/api/eventos/${eventoDestacado.id_evento}/reservar`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo procesar la reserva");

      setReservado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setReservando(false);
    }
  };

  if (cargando) {
    return (
      <header className="h-[70vh] min-h-[500px] flex items-center justify-center bg-tinta border-b border-crema/20">
        <div className="text-crema/70 text-xl font-bold">
          Cargando evento destacado...
        </div>
      </header>
    );
  }

  if (!eventoDestacado) {
    return (
      <header className="h-[70vh] min-h-[500px] flex items-center justify-center bg-tinta border-b border-crema/20">
        <div className="text-crema/70 text-xl font-bold">
          No hay eventos próximos por el momento.
        </div>
      </header>
    );
  }

  // La fecha se arma como local para que no se corra al día anterior
  const dia = String(eventoDestacado.fecha).slice(0, 10);
  const fechaFormateada = new Date(`${dia}T00:00:00`).toLocaleDateString(
    "es-AR",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );
  const hora = eventoDestacado.hora_apertura
    ? `${String(eventoDestacado.hora_apertura).slice(0, 5)} hs`
    : "";

  const imagenFondo = getImagenPorGenero(eventoDestacado.genero);

  const esDueno =
    usuario && usuario.nombre_usuario === eventoDestacado.nombre_artista;
  const agotado = eventoDestacado.entradas_disponibles === 0;

  // Qué se muestra en lugar del botón de reservar, según la situación
  let accionReserva;
  if (reservado) {
    accionReserva = (
      <div className="flex flex-wrap items-center gap-4 bg-tinta/80 backdrop-blur-sm rounded-full px-6 py-3">
        <span className="font-bold text-cielo">✅ ¡Reserva confirmada!</span>
        <Link
          to="/mis-reservas"
          className="font-bold text-crema hover:text-sol underline underline-offset-4 transition"
        >
          Ver mis entradas
        </Link>
      </div>
    );
  } else if (esDueno) {
    accionReserva = (
      <Link
        to={`/evento/${eventoDestacado.id_evento}`}
        className="border-2 border-cielo text-cielo hover:bg-cielo hover:text-tinta font-bold py-3 px-8 rounded-full transition"
      >
        Administrar evento
      </Link>
    );
  } else {
    const bloqueado = reservando || agotado;
    accionReserva = (
      <button
        onClick={handleReservar}
        disabled={bloqueado}
        className={`font-bold py-3 px-8 rounded-full transition flex items-center gap-2 ${
          bloqueado
            ? "bg-crema/10 text-crema/50 cursor-not-allowed"
            : "bg-fucsia hover:bg-chicle text-tinta shadow-[0_0_15px_rgba(255,46,147,0.45)]"
        }`}
      >
        {agotado
          ? "ENTRADAS AGOTADAS"
          : reservando
            ? "PROCESANDO..."
            : "RESERVAR AHORA"}
      </button>
    );
  }

  return (
    <header
      className="relative h-[70vh] min-h-[500px] flex items-end bg-cover bg-center"
      style={{ backgroundImage: `url('${imagenFondo}')` }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-tinta via-tinta/60 to-transparent"></div>

      <div className="relative z-10 container mx-auto px-4 pb-12 md:pb-16">
        <span className="text-cielo font-bold tracking-widest text-sm uppercase drop-shadow-md mb-2 block">
          NUEVO SHOW DESTACADO
        </span>
        <h1 className="text-5xl md:text-7xl font-black text-crema mb-4 drop-shadow-lg leading-tight uppercase line-clamp-2">
          {eventoDestacado.nombre}
        </h1>
        <p className="text-crema/80 text-lg md:text-xl max-w-2xl mb-8 drop-shadow-md font-medium">
          <span className="capitalize">{fechaFormateada}</span> {hora} |{" "}
          {eventoDestacado.lugar}, {eventoDestacado.ciudad} <br />
          <span className="text-sm mt-2 block text-crema/70">
            Género: {eventoDestacado.genero}
            {eventoDestacado.precio_desde != null && (
              <>
                {" · "}Entradas desde{" "}
                <span className="text-sol font-bold">
                  {formatearPrecio(eventoDestacado.precio_desde)}
                </span>
              </>
            )}
          </span>
        </p>

        <div className="flex flex-wrap gap-4">
          {accionReserva}

          {/* Botón Más Información: lleva al detalle */}
          <Link
            to={`/evento/${eventoDestacado.id_evento}`}
            className="border-2 border-crema/60 text-crema hover:bg-crema hover:text-tinta font-bold py-3 px-8 rounded-full backdrop-blur-sm transition flex items-center gap-2"
          >
            Más Información
          </Link>
        </div>

        {error && (
          <p
            className="mt-4 inline-block bg-tinta/80 backdrop-blur-sm text-mandarina font-bold text-sm px-4 py-2 rounded-lg"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    </header>
  );
};

export default HeroEvent;
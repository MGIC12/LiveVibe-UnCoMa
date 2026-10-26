import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";

export default function BotonesSeguimiento({ artista }) {
  const { usuario, token } = useAuth();
  const esFan = usuario?.rol === "fan";
  const ruta = `${API}/api/artistas/${encodeURIComponent(artista)}/seguimiento`;

  const [estado, setEstado] = useState(null); // { sigue, novedades }
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Al entrar, se consulta qué viene haciendo este fan con este artista
  useEffect(() => {
    if (!esFan) return;
    let activo = true;
    fetch(ruta, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar tu seguimiento");
        return res.json();
      })
      .then((data) => {
        if (activo) setEstado(data);
      })
      .catch((err) => {
        if (activo) setError(err.message);
      });
    return () => {
      activo = false;
    };
  }, [ruta, token, esFan]);

  // Manda solo el cambio que se pidió, y se queda con el estado que devuelve el servidor
  async function cambiar(cambio) {
    setError("");
    setGuardando(true);
    try {
      const res = await fetch(ruta, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cambio),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo guardar el cambio");
      setEstado(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  // Sin sesión: se invita a ingresar
  if (!usuario) {
    return (
      <p className="text-sm text-crema/70 text-center">
        ¿Sos fan?{" "}
        <Link to="/login" className="text-cielo hover:text-crema font-bold">
          Iniciá sesión
        </Link>{" "}
        para seguir a este artista.
      </p>
    );
  }

  // Los artistas (y admins) no siguen artistas
  if (!esFan) return null;

  if (!estado) {
    return error ? (
      <p className="text-mandarina text-sm text-center">{error}</p>
    ) : (
      <p className="text-crema/60 text-sm text-center animate-pulse">Cargando...</p>
    );
  }

  const boton =
    "px-6 py-2.5 min-w-[11rem] rounded-full font-bold text-sm transition disabled:opacity-50";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => cambiar({ sigue: !estado.sigue })}
          disabled={guardando}
          className={`${boton} ${
            estado.sigue
              ? "border-2 border-fucsia text-fucsia hover:bg-fucsia hover:text-tinta"
              : "bg-fucsia hover:bg-chicle text-tinta"
          }`}
        >
          {estado.sigue ? "✓ Siguiendo" : "Seguir"}
        </button>

        <button
          onClick={() => cambiar({ novedades: !estado.novedades })}
          disabled={guardando}
          aria-pressed={estado.novedades}
          className={`${boton} ${
            estado.novedades
              ? "bg-sol text-tinta hover:bg-chicle"
              : "border-2 border-crema/30 text-crema/80 hover:border-sol hover:text-crema"
          }`}
        >
          {estado.novedades ? "🔔 Novedades activadas" : "🔕 Activar novedades"}
        </button>
      </div>

      <p className="text-xs text-crema/50 text-center">
        Podés recibir las novedades sin seguirlo, y seguirlo sin recibir avisos.
      </p>

      {error && (
        <p className="text-mandarina text-sm text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
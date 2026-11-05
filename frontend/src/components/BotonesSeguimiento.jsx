import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";

// En el perfil de un artista: <BotonesSeguimiento artista="usuario_del_artista" />
// En el perfil de un fan:    <BotonesSeguimiento usuarioPerfil="usuario_del_fan" onCambio={...} />
export default function BotonesSeguimiento({ artista, usuarioPerfil, onCambio }) {
  const { usuario, token } = useAuth();
  const puedeSeguir = usuario?.rol === "fan" || usuario?.rol === "artista";

  const esDeArtista = artista !== undefined;
  const destino = esDeArtista ? artista : usuarioPerfil;
  const ruta = `${API}/api/usuarios/${encodeURIComponent(destino ?? "")}/seguimiento`;

  const [estado, setEstado] = useState(null); // { sigue, novedades, seguidores }
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Al entrar, se consulta qué viene haciendo quien mira con este perfil
  useEffect(() => {
    if (!puedeSeguir || !destino) return;
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
  }, [ruta, token, puedeSeguir, destino]);

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
      onCambio?.(data.seguidores); // el contador del perfil se actualiza con el dato real
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (!destino) return null;

  // Sin sesión: se invita a ingresar
  if (!usuario) {
    return (
      <p className="text-sm text-crema/70 text-center">
        <Link to="/login" className="text-cielo hover:text-crema font-bold">
          Iniciá sesión
        </Link>{" "}
        para seguir {esDeArtista ? "a este artista" : "a este usuario"}.
      </p>
    );
  }

  // Los admins no siguen
  if (!puedeSeguir) return null;

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
        {esDeArtista
          ? "Las novedades son sus eventos nuevos, cambios, cancelaciones y publicaciones."
          : "Las novedades son sus publicaciones nuevas."}{" "}
        Podés recibirlas sin seguirlo, y seguirlo sin recibir avisos.
      </p>

      {error && (
        <p className="text-mandarina text-sm text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
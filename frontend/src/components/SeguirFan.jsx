import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";

export default function BotonSeguirFan({ usuarioPerfil, onCambio }) {
  const { token } = useAuth();
  const ruta = `${API}/api/usuarios/${encodeURIComponent(usuarioPerfil)}/seguimiento`;

  const [sigue, setSigue] = useState(null); // null = todavía no se sabe
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    fetch(ruta, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar tu seguimiento");
        return res.json();
      })
      .then((data) => {
        if (activo) setSigue(data.sigue);
      })
      .catch((err) => {
        if (activo) setError(err.message);
      });
    return () => {
      activo = false;
    };
  }, [ruta, token]);

  async function alternar() {
    setError("");
    setGuardando(true);
    try {
      const res = await fetch(ruta, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sigue: !sigue }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo guardar el cambio");
      setSigue(data.sigue);
      onCambio?.(data.seguidores); // el contador del perfil se actualiza con el dato real
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (sigue === null) {
    return error ? (
      <p className="text-mandarina text-sm">{error}</p>
    ) : (
      <p className="text-crema/60 text-sm animate-pulse">Cargando...</p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={alternar}
        disabled={guardando}
        className={`px-6 py-2.5 min-w-[11rem] rounded-full font-bold text-sm transition disabled:opacity-50 ${
          sigue
            ? "border-2 border-fucsia text-fucsia hover:bg-fucsia hover:text-tinta"
            : "bg-fucsia hover:bg-chicle text-tinta"
        }`}
      >
        {sigue ? "✓ Siguiendo" : "Seguir"}
      </button>
      {error && (
        <p className="text-mandarina text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
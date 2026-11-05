import { useEffect, useState } from "react";
import FormularioPublicacion from "./FormularioPublicacion";
import TarjetaPublicacion from "./TarjetaPublicacion";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";

export default function Publicaciones({ perfil, esMiPerfil }) {
  const { usuario, token } = useAuth();
  const puedePublicar =
    esMiPerfil && (usuario?.rol === "fan" || usuario?.rol === "artista");

  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Si hay sesión, el servidor indica qué publicaciones ya tienen mi "me gusta"
  useEffect(() => {
    let activo = true;
    fetch(`${API}/api/publicaciones/usuario/${encodeURIComponent(perfil.nombre_usuario)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "No se pudieron cargar las publicaciones");
        return data;
      })
      .then((data) => {
        if (activo) setLista(data);
      })
      .catch((err) => {
        if (activo) setError(err.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [perfil.nombre_usuario, token]);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-black text-crema">
        Publicaciones{" "}
        {!cargando && !error && (
          <span className="text-base font-bold text-crema/60">({lista.length})</span>
        )}
      </h2>

      {/* Formulario: solo en el propio perfil */}
      {puedePublicar && (
        <FormularioPublicacion onPublicada={(nueva) => setLista((actual) => [nueva, ...actual])} />
      )}

      {cargando ? (
        <p className="text-crema/60 text-center py-8 animate-pulse">Cargando publicaciones...</p>
      ) : error ? (
        <p className="text-mandarina text-center py-8" role="alert">
          {error}
        </p>
      ) : lista.length === 0 ? (
        <p className="bg-crema/5 border border-crema/20 rounded-2xl p-8 text-center text-crema/60">
          {esMiPerfil
            ? "Todavía no publicaste nada. ¡Compartí lo primero!"
            : "Todavía no publicó nada."}
        </p>
      ) : (
        <div className="space-y-4">
          {lista.map((p) => (
            <TarjetaPublicacion
              // Si cambia la sesión, cada tarjeta se rearma con los datos nuevos
              key={`${p.id_publicacion}-${usuario?.nombre_usuario ?? "visitante"}`}
              publicacion={p}
              esMia={usuario?.nombre_usuario === p.nombre_autor}
              onEliminada={(id) => setLista((a) => a.filter((x) => x.id_publicacion !== id))}
            />
          ))}
        </div>
      )}
    </section>
  );
}
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../utils/api";

const Recomendador = () => {
  const [recomendados, setRecomendados] = useState([]);
  const token = localStorage.getItem("token"); // O el token de tu AuthContext

  useEffect(() => {
    if (token) {
      fetch(`${API}/api/ia/recomendaciones`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setRecomendados(data);
        })
        .catch(console.error);
    }
  }, [token]);

  if (!token || recomendados.length === 0) return null;

  return (
    <div className="mb-12 bg-neutral-800/40 p-6 rounded-2xl border border-neutral-700/60 shadow-xl backdrop-blur-md">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        Recomendados para vos
        <span className="text-xs font-semibold uppercase tracking-wider text-cielo bg-cielo/10 border border-cielo/30 rounded-full px-2 py-0.5">
          IA
        </span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recomendados.map((evento) => (
          <Link
            key={evento.id_evento}
            to={`/evento/${evento.id_evento}`}
            className="bg-neutral-800/80 p-5 rounded-xl hover:border-green-500/50 border border-neutral-700 transition-all block group"
          >
            <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors">
              {evento.nombre}
            </h3>
            <p className="text-green-400 text-sm font-medium mt-1">
              {[evento.artista, evento.genero].filter(Boolean).join(" · ")}
            </p>
            {evento.motivo && (
              <p className="text-neutral-200 text-sm mt-3 leading-snug">
                ✨ {evento.motivo}
              </p>
            )}
            <p className="text-neutral-400 text-xs mt-3">
              📍 {[evento.lugar, evento.ciudad].filter(Boolean).join(", ")}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Recomendador;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Recomendador = () => {
  const [recomendados, setRecomendados] = useState([]);
  const token = localStorage.getItem("token"); // O el token de tu AuthContext

  useEffect(() => {
    if (token) {
      fetch("http://localhost:5000/api/ia/recomendaciones", {
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
        Recomendados para ti
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
              {evento.genero}
            </p>
            <p className="text-neutral-400 text-xs mt-3">
              📍 {evento.lugar}, {evento.ciudad}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Recomendador;

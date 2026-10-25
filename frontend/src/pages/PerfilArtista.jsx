import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PerfilArtista = () => {
  const { username } = useParams();
  const [datos, setDatos] = useState({ artista: null, eventos: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/artistas/${username}`)
      .then((res) => res.json())
      .then((data) => {
        setDatos(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error al cargar el artista:", error);
        setLoading(false);
      });
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-tinta text-crema flex justify-center items-center">
        <div className="animate-pulse text-xl font-bold">
          Cargando artista...
        </div>
      </div>
    );
  }

  if (!datos.artista) {
    return (
      <div className="min-h-screen bg-tinta text-crema flex flex-col">
        <Navbar />
        <div className="flex-grow flex justify-center items-center pt-20">
          <p className="text-xl text-crema/60">Artista no encontrado.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tinta text-crema font-sans flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 pt-28 pb-16 w-full max-w-4xl space-y-10">
        {/* Cabecera del Artista */}
        <section className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
          {/* Luces de fondo */}
          <div className="absolute top-[-20%] left-[-10%] w-72 h-72 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-72 h-72 bg-fucsia/20 rounded-full blur-[100px] pointer-events-none"></div>

          <img
            src={
              datos.artista.foto_perfil ||
              "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=256&h=256&fit=crop"
            }
            alt={datos.artista.nombre_artistico}
            className="w-40 h-40 sm:w-48 sm:h-48 rounded-full object-cover border-4 border-neutral-800 shadow-[0_0_30px_rgba(168,85,247,0.2)] z-10"
          />

          <div className="z-10 flex-1 text-center sm:text-left flex flex-col items-center sm:items-start">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-1">
              {datos.artista.nombre_artistico}
            </h1>
            <p className="text-fucsia font-bold text-sm mb-4">
              @{datos.artista.nombre_usuario} • {datos.artista.tipo_artista}
            </p>

            <div className="flex flex-wrap gap-3 items-center justify-center sm:justify-start mb-6">
              <span className="bg-crema/10 hover:bg-crema/20 border border-crema/20 hover:border-fucsia/50 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-default">
                {datos.artista.genero}
              </span>
              <span className="bg-crema/10 hover:bg-crema/20 border border-crema/20 hover:border-fucsia/50 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-default">
                {datos.artista.nacionalidad}
              </span>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button className="cursor-pointer flex-1 sm:flex-none bg-fucsia hover:bg-chicle text-tinta px-8 py-3 rounded-full font-black uppercase tracking-wide transition-all shadow-[0_0_15px_rgba(217,70,239,0.4)]">
                Seguir
              </button>
            </div>
          </div>
        </section>

        {/* Sección Biografía */}
        <section className="bg-crema/5 border border-crema/10 rounded-3xl p-6 sm:p-8">
          <h2 className="text-sm font-bold text-fucsia uppercase tracking-widest mb-3">
            Acerca de
          </h2>
          <p className="text-crema/80 text-sm sm:text-base leading-relaxed whitespace-pre-line">
            {datos.artista.biografia ||
              "Este artista aún no ha agregado una biografía."}
          </p>
        </section>

        {/* Sección Próximos Shows */}
        <section>
          <h2 className="text-2xl font-black mb-6 text-white flex items-center gap-2">
            Próximos Shows
          </h2>

          {datos.eventos.length === 0 ? (
            <div className="bg-crema/5 rounded-3xl p-10 border border-crema/10 text-center">
              <p className="text-crema/60 font-medium">
                No hay fechas confirmadas por el momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {datos.eventos.map((evento) => {
                const fechaObj = new Date(evento.fecha);
                const dia = fechaObj.getDate();
                const mes = fechaObj
                  .toLocaleString("es-AR", { month: "short" })
                  .toUpperCase();

                return (
                  <div
                    key={evento.id_evento}
                    className="bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 hover:border-fucsia/50 transition-colors flex gap-5 items-center group cursor-pointer"
                  >
                    <div className="bg-tinta rounded-xl p-3 min-w-[65px] text-center border border-neutral-700 group-hover:border-fucsia/30 transition-colors">
                      <span className="block text-2xl font-black text-fucsia">
                        {dia}
                      </span>
                      <span className="block text-[10px] font-bold text-crema/70 tracking-widest">
                        {mes}
                      </span>
                    </div>

                    <div className="flex-grow min-w-0">
                      <h3 className="text-lg font-bold text-white truncate mb-1 group-hover:text-fucsia transition-colors">
                        {evento.nombre}
                      </h3>
                      <p className="text-crema/60 text-xs truncate mb-3">
                        📍 {evento.lugar}, {evento.ciudad}
                      </p>
                      <Link
                        to={`/evento/${evento.id_evento}`}
                        className="text-xs bg-crema/10 hover:bg-fucsia hover:text-tinta px-4 py-2 rounded-full font-bold transition-colors inline-block"
                      >
                        Ver Detalles
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PerfilArtista;

import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Buscador = () => {
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Extraer el término de la URL
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get("q") || "";

  useEffect(() => {
    const buscarDatos = async () => {
      setCargando(true);
      try {
        const response = await fetch(
          `http://localhost:5000/api/buscar?q=${encodeURIComponent(query)}`,
        );
        if (response.ok) {
          const data = await response.json();
          setResultados(data);
        }
      } catch (error) {
        console.error("Error en la búsqueda:", error);
      } finally {
        setCargando(false);
      }
    };

    if (query) {
      buscarDatos();
    } else {
      setResultados([]);
      setCargando(false);
    }
  }, [query]);

  // Separar los resultados
  const artistas = resultados.filter(
    (item) => item.tipo_resultado === "artista",
  );
  const eventos = resultados.filter((item) => item.tipo_resultado === "evento");

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      <Navbar />

      {/* Cabecera del buscador */}
      <div className="bg-gradient-to-b from-neutral-800 to-black pt-28 pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl md:text-5xl font-black mb-2">
            Resultados para <span className="text-green-500">"{query}"</span>
          </h1>
          <p className="text-gray-400 font-medium">
            Explora artistas, géneros y próximos conciertos
          </p>
        </div>
      </div>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        {cargando ? (
          // Skeletons de carga
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-neutral-900 rounded-xl p-4 h-56 animate-pulse flex flex-col items-center justify-center"
              >
                <div className="w-28 h-28 bg-neutral-800 rounded-full mb-4"></div>
                <div className="w-3/4 h-4 bg-neutral-800 rounded mb-2"></div>
                <div className="w-1/2 h-3 bg-neutral-800 rounded"></div>
              </div>
            ))}
          </div>
        ) : resultados.length === 0 ? (
          // Estado Vacío
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">🔍</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              No encontramos resultados para "{query}"
            </h3>
            <p className="text-gray-400 mb-8 max-w-md">
              Asegúrate de que las palabras estén escritas correctamente o
              intenta usar menos palabras clave.
            </p>
            <Link
              to="/"
              className="bg-white text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {/* SECCIÓN ARTISTAS (Diseño limpio, sin botón Play) */}
            {artistas.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6 text-white border-b border-neutral-800 pb-2">
                  Artistas
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {artistas.map((artista, index) => (
                    <Link
                      to={`/perfil-artista/${artista.id}`}
                      key={`artista-${artista.id}-${index}`}
                      className="bg-neutral-900 hover:bg-neutral-800 p-4 rounded-xl transition-all duration-300 group"
                    >
                      {/* Imagen circular del artista: limpia y estática */}
                      <div className="aspect-square mb-4 relative overflow-hidden rounded-full shadow-lg bg-neutral-800 flex items-center justify-center border border-neutral-700 group-hover:border-green-500 transition-colors">
                        <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                          🎤
                        </span>
                      </div>
                      <h3 className="font-bold text-white truncate text-lg mb-1">
                        {artista.titulo}
                      </h3>
                      <p className="text-sm text-gray-400 capitalize truncate">
                        Artista • {artista.genero}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* SECCIÓN EVENTOS */}
            {eventos.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6 text-white border-b border-neutral-800 pb-2">
                  Próximos Conciertos
                </h2>
                <div className="flex flex-col gap-4">
                  {eventos.map((evento, index) => (
                    <Link
                      to={`/evento/${evento.id}`}
                      key={`evento-${evento.id}-${index}`}
                      className="group flex flex-col sm:flex-row items-center gap-6 bg-neutral-900 hover:bg-neutral-800 p-4 rounded-xl transition-all duration-300 border border-transparent hover:border-neutral-700"
                    >
                      <div className="w-full sm:w-24 aspect-square sm:aspect-auto sm:h-24 bg-black rounded-lg flex flex-col items-center justify-center border border-neutral-800 shrink-0 shadow-inner group-hover:bg-neutral-900 transition-colors">
                        <span className="text-green-500 font-bold text-3xl mb-1">
                          🎟️
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                          TICKET
                        </span>
                      </div>

                      <div className="flex-grow text-center sm:text-left">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">
                          {evento.titulo}
                        </h3>
                        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3">
                          <p className="text-gray-400 text-sm">
                            📍 {evento.ubicacion}
                          </p>
                          <span className="w-1 h-1 bg-gray-600 rounded-full hidden sm:block"></span>
                          <p className="text-gray-400 text-sm">
                            🎸 {evento.genero}
                          </p>
                        </div>
                      </div>

                      <div className="w-full sm:w-auto mt-4 sm:mt-0">
                        <button className="w-full sm:w-auto px-8 py-3 rounded-full border border-gray-600 text-white font-bold group-hover:border-white group-hover:scale-105 transition-all duration-300">
                          Ver Entradas
                        </button>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Buscador;

import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Avatar from "../components/Avatar";
import { API } from "../utils/api";

// Tarjeta de una persona (artista o usuario): foto o inicial, nombre y una línea de detalle
function TarjetaPersona({ to, titulo, subtitulo, fotoUrl }) {
  return (
    <Link
      to={to}
      className="bg-crema/5 hover:bg-crema/10 border border-crema/20 hover:border-fucsia/60 p-4 rounded-xl transition-all duration-300 group text-center"
    >
      <div className="flex justify-center mb-4">
        <Avatar
          usuario={{ nombre_usuario: titulo, foto_url: fotoUrl }}
          clases="w-28 h-28 text-5xl shadow-lg"
          fondo="bg-tinta border-2 border-crema/20 group-hover:border-fucsia transition-colors"
        />
      </div>
      <h3 className="font-bold text-crema truncate text-lg mb-1">{titulo}</h3>
      <p className="text-sm text-crema/70 truncate">{subtitulo}</p>
    </Link>
  );
}

const Buscador = () => {
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Extraer el término de la URL
  const location = useLocation();
  const query = new URLSearchParams(location.search).get("q") || "";

  useEffect(() => {
    let activo = true; // si se busca otra cosa antes de que llegue la respuesta, se descarta la vieja

    const buscarDatos = async () => {
      setCargando(true);
      setError("");
      try {
        const response = await fetch(`${API}/api/buscar?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error("No se pudo completar la búsqueda");
        const data = await response.json();
        if (activo) setResultados(data);
      } catch (err) {
        console.error("Error en la búsqueda:", err);
        if (activo) {
          setError("No pudimos completar la búsqueda. Probá de nuevo en unos minutos.");
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    if (query) {
      buscarDatos();
    } else {
      setResultados([]);
      setCargando(false);
    }

    return () => {
      activo = false;
    };
  }, [query]);

  // Separar los resultados por tipo
  const artistas = resultados.filter((item) => item.tipo_resultado === "artista");
  const usuarios = resultados.filter((item) => item.tipo_resultado === "usuario");
  const eventos = resultados.filter((item) => item.tipo_resultado === "evento");

  const subtituloSeccion = "text-2xl font-bold mb-6 text-crema border-b border-crema/20 pb-2";

  return (
    <div className="min-h-screen bg-tinta text-crema font-sans flex flex-col">
      <Navbar />

      {/* Cabecera del buscador */}
      <div className="bg-gradient-to-b from-fucsia/20 to-tinta pt-28 pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl md:text-5xl font-black mb-2">
            Resultados para <span className="text-fucsia">"{query}"</span>
          </h1>
          <p className="text-crema/70 font-medium">
            Explora artistas, usuarios y próximos conciertos
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
                className="bg-crema/5 rounded-xl p-4 h-56 animate-pulse flex flex-col items-center justify-center"
              >
                <div className="w-28 h-28 bg-crema/10 rounded-full mb-4"></div>
                <div className="w-3/4 h-4 bg-crema/10 rounded mb-2"></div>
                <div className="w-1/2 h-3 bg-crema/10 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-mandarina text-center py-20" role="alert">
            {error}
          </p>
        ) : resultados.length === 0 ? (
          // Estado Vacío
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-crema/10 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">🔍</span>
            </div>
            <h3 className="text-2xl font-bold text-crema mb-3">
              No encontramos resultados para "{query}"
            </h3>
            <p className="text-crema/70 mb-8 max-w-md">
              Asegurate de que las palabras estén escritas correctamente o probá usar
              menos palabras clave.
            </p>
            <Link
              to="/"
              className="bg-fucsia hover:bg-chicle text-tinta font-bold py-3 px-8 rounded-full hover:scale-105 transition"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {/* SECCIÓN ARTISTAS */}
            {artistas.length > 0 && (
              <section>
                <h2 className={subtituloSeccion}>Artistas</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {artistas.map((artista, index) => (
                    <TarjetaPersona
                      key={`artista-${artista.id}-${index}`}
                      to={`/artista/${encodeURIComponent(artista.id)}`}
                      titulo={artista.titulo}
                      subtitulo={`Artista${artista.genero ? ` • ${artista.genero}` : ""}`}
                      fotoUrl={artista.foto_url}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* SECCIÓN USUARIOS */}
            {usuarios.length > 0 && (
              <section>
                <h2 className={subtituloSeccion}>Usuarios</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {usuarios.map((usuario, index) => (
                    <TarjetaPersona
                      key={`usuario-${usuario.id}-${index}`}
                      to={`/usuario/${encodeURIComponent(usuario.id)}`}
                      titulo={usuario.titulo}
                      subtitulo="Fan"
                      fotoUrl={usuario.foto_url}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* SECCIÓN EVENTOS */}
            {eventos.length > 0 && (
              <section>
                <h2 className={subtituloSeccion}>Conciertos</h2>
                <div className="flex flex-col gap-4">
                  {eventos.map((evento, index) => {
                    const fecha = evento.fecha ? new Date(`${evento.fecha}T00:00:00`) : null;

                    return (
                      <Link
                        to={`/evento/${evento.id}`}
                        key={`evento-${evento.id}-${index}`}
                        className="group flex flex-col sm:flex-row items-center gap-6 bg-crema/5 hover:bg-crema/10 p-4 rounded-xl transition-all duration-300 border border-crema/20 hover:border-fucsia/60"
                      >
                        {/* Fecha del concierto (o un ícono si no la trae) */}
                        <div className="w-full sm:w-24 sm:h-24 py-3 sm:py-0 bg-tinta rounded-lg flex flex-col items-center justify-center border border-crema/20 shrink-0 group-hover:border-fucsia/50 transition-colors">
                          {fecha ? (
                            <>
                              <span className="text-3xl font-black text-crema leading-none">
                                {fecha.getDate()}
                              </span>
                              <span className="text-xs font-bold uppercase tracking-widest text-crema/70">
                                {fecha.toLocaleString("es-AR", { month: "short" })}
                              </span>
                              <span className="text-[10px] text-crema/50">
                                {fecha.getFullYear()}
                              </span>
                            </>
                          ) : (
                            <span className="text-3xl">🎟️</span>
                          )}
                        </div>

                        <div className="flex-grow text-center sm:text-left">
                          <h3 className="text-xl font-bold text-crema mb-2 group-hover:text-cielo transition-colors">
                            {evento.titulo}
                          </h3>
                          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3">
                            {evento.ubicacion && (
                              <p className="text-crema/70 text-sm">📍 {evento.ubicacion}</p>
                            )}
                            {evento.ubicacion && evento.genero && (
                              <span className="w-1 h-1 bg-crema/40 rounded-full hidden sm:block"></span>
                            )}
                            {evento.genero && (
                              <p className="text-crema/70 text-sm">🎸 {evento.genero}</p>
                            )}
                          </div>
                        </div>

                        {/* Es un <span> (no un <button>): un botón adentro de un link no es HTML válido */}
                        <span className="w-full sm:w-auto text-center px-8 py-3 rounded-full border border-crema/30 text-crema font-bold group-hover:border-fucsia group-hover:text-fucsia transition-all duration-300">
                          Ver Entradas
                        </span>
                      </Link>
                    );
                  })}
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
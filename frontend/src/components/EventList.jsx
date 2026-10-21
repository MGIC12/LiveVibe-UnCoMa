import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Filtros from "../components/Filtros";
import { formatearPrecio } from "../utils/formularios";

const EventList = () => {
  const [eventos, setEventos] = useState([]);
  const [filtroGenero, setFiltroGenero] = useState("");
  const [filtroCiudad, setFiltroCiudad] = useState("");
  const [cargando, setCargando] = useState(true);

  // Agregamos useNavigate para manejar el clic de la tarjeta principal
  const navigate = useNavigate();

  // Estados para la paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const eventosPorPagina = 5;

  useEffect(() => {
    const fetchEventos = async () => {
      setCargando(true);
      try {
        const params = new URLSearchParams();
        if (filtroGenero) params.append("genero", filtroGenero);
        if (filtroCiudad) params.append("ciudad", filtroCiudad);

        const response = await fetch(
          `http://localhost:5000/api/eventos?${params.toString()}`,
        );
        const data = await response.json();

        // Validamos que data sea un arreglo por si el backend falla
        if (Array.isArray(data)) {
          setEventos(data);
        } else {
          setEventos([]);
        }
        setPaginaActual(1);
      } catch (error) {
        console.error("Error al cargar los eventos:", error);
        setEventos([]);
      } finally {
        setCargando(false);
      }
    };

    fetchEventos();
  }, [filtroGenero, filtroCiudad]);

  // Cálculos de paginación
  const indiceUltimoEvento = paginaActual * eventosPorPagina;
  const indicePrimerEvento = indiceUltimoEvento - eventosPorPagina;
  const eventosActuales = eventos.slice(indicePrimerEvento, indiceUltimoEvento);
  const totalPaginas = Math.ceil(eventos.length / eventosPorPagina);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  return (
    <div className="min-h-screen bg-tinta px-4 sm:px-6 py-8 md:py-12 w-full">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-crema mb-6 md:mb-10 tracking-tight text-center md:text-left">
          Descubrir <span className="text-fucsia">Eventos</span>
        </h1>

        <Filtros
          filtroGenero={filtroGenero}
          setFiltroGenero={setFiltroGenero}
          filtroCiudad={filtroCiudad}
          setFiltroCiudad={setFiltroCiudad}
        />

        <div className="mt-8 md:mt-12">
          {cargando ? (
            <div className="text-center text-crema/70 py-16 md:py-20 animate-pulse">
              <span className="text-4xl block mb-4">🎧</span>
              Buscando los mejores shows...
            </div>
          ) : eventos.length === 0 ? (
            <div className="text-center bg-crema/5 rounded-2xl p-8 md:p-12 border border-crema/20 backdrop-blur-sm mx-2">
              <span className="text-4xl md:text-5xl block mb-4">🥺</span>
              <h3 className="text-xl md:text-2xl font-bold text-crema mb-2">
                Sin resultados
              </h3>
              <p className="text-crema/70 text-sm md:text-base">
                No encontramos conciertos que coincidan con esos filtros.
                ¡Prueba buscando otra cosa!
              </p>
              <button
                onClick={() => {
                  setFiltroGenero("");
                  setFiltroCiudad("");
                }}
                className="mt-6 text-cielo font-bold hover:text-crema transition-colors"
              >
                Limpiar todos los filtros
              </button>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {eventosActuales.map((evento) => {
                const dia = String(evento.fecha).slice(0, 10);
                const fechaObj = new Date(`${dia}T00:00:00`);
                const day = fechaObj.getDate();
                const month = fechaObj.toLocaleString("es-AR", {
                  month: "short",
                });

                return (
                  <div
                    key={evento.id_evento}
                    onClick={() => navigate(`/evento/${evento.id_evento}`)}
                    className="group block cursor-pointer bg-crema/5 hover:bg-crema/10 rounded-xl p-4 sm:p-6 border border-crema/20 hover:border-fucsia/60 transition-all duration-300 backdrop-blur-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                      {/* Bloque de Fecha y Género */}
                      <div className="flex items-center gap-4 sm:gap-6 sm:w-1/4">
                        <div className="text-center min-w-[60px] sm:min-w-[70px] bg-tinta/80 rounded-lg py-2 px-3 border border-crema/20 group-hover:border-fucsia/50 transition-colors">
                          <p className="text-2xl sm:text-3xl font-black text-crema">
                            {day}
                          </p>
                          <p className="text-crema/70 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                            {month}
                          </p>
                        </div>
                        <div>
                          <p className="text-crema/70 text-xs font-bold uppercase tracking-wider mb-1">
                            {evento.genero}
                          </p>
                          <span className="inline-block whitespace-nowrap text-[10px] bg-crema/10 text-crema/80 px-2 py-0.5 rounded-full border border-crema/30">
                            {evento.clasificacion || "ATP"}
                          </span>
                        </div>
                      </div>

                      {/* Info Principal */}
                      <div className="flex-grow">
                        <h2 className="text-xl sm:text-2xl font-bold text-crema mb-1 group-hover:text-cielo transition-colors line-clamp-2">
                          {evento.nombre}
                        </h2>

                        {/* BLOQUE DEL ARTISTA: Enlace independiente */}
                        {evento.nombre_artista && (
                          <div className="mb-2 sm:mb-3">
                            <Link
                              to={`/artista/${evento.creador_usuario || evento.nombre_artista}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-fucsia hover:text-white bg-fucsia/10 hover:bg-fucsia/30 border border-fucsia/20 px-3 py-1 rounded-full transition-all"
                              title={`Ver perfil de ${evento.nombre_artista}`}
                            >
                              <span>🎤</span> {evento.nombre_artista}
                            </Link>
                          </div>
                        )}

                        <p className="text-crema/70 text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                          <span>📍</span>{" "}
                          <span className="truncate">
                            {evento.lugar},{" "}
                            <strong className="text-crema/80">
                              {evento.ciudad}
                            </strong>
                          </span>
                        </p>
                      </div>

                      {/* Acción / Botón */}
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 sm:gap-2 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-crema/20 sm:border-t-0">
                        <div className="text-xs sm:text-sm font-medium text-crema/70">
                          {evento.cant_entradas > 0 ? (
                            <span>
                              Quedan{" "}
                              <strong className="text-crema">
                                {evento.cant_entradas}
                              </strong>
                            </span>
                          ) : (
                            <span className="text-mandarina">Agotado</span>
                          )}
                        </div>

                        {evento.precio_desde != null && (
                          <p className="text-sol font-bold text-sm sm:text-base">
                            {formatearPrecio(evento.precio_desde)}
                          </p>
                        )}

                        <div className="bg-crema/10 group-hover:bg-fucsia text-crema group-hover:text-tinta font-bold py-1.5 sm:py-2 px-4 sm:px-6 rounded-full transition-all duration-300 flex items-center gap-2 text-xs sm:text-sm w-auto">
                          Detalles{" "}
                          <span className="hidden sm:inline">&rarr;</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Controles de Paginación */}
          {!cargando && totalPaginas > 1 && eventos.length > 0 && (
            <div className="flex justify-center items-center gap-4 mt-10">
              <button
                onClick={() => cambiarPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                  paginaActual === 1
                    ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                    : "bg-white/10 text-crema hover:bg-fucsia hover:text-tinta"
                }`}
              >
                &larr; Anterior
              </button>

              <span className="text-crema/70 text-sm font-medium">
                Página <strong className="text-crema">{paginaActual}</strong> de{" "}
                {totalPaginas}
              </span>

              <button
                onClick={() => cambiarPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                  paginaActual === totalPaginas
                    ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                    : "bg-white/10 text-crema hover:bg-fucsia hover:text-tinta"
                }`}
              >
                Siguiente &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventList;

import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Filtros from "../components/Filtros";

const EventList = () => {
  const [eventos, setEventos] = useState([]);
  const [filtroGenero, setFiltroGenero] = useState("");
  const [filtroCiudad, setFiltroCiudad] = useState("");
  const [cargando, setCargando] = useState(true);

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

        setEventos(data);
      } catch (error) {
        console.error("Error al cargar los eventos:", error);
      } finally {
        setCargando(false);
      }
    };

    fetchEventos();
  }, [filtroGenero, filtroCiudad]);

  return (
    <div className="min-h-screenbg-tinta px-4 sm:px-6 py-8 md:py-12 w-full">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-crema mb-6 md:mb-10 tracking-tight text-center md:text-left">
          Descubrir <span className="text-green-500">Eventos</span>
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
            <div className="text-centerbg-crema/5/50 rounded-2xl p-8 md:p-12 borderborder-crema/20/50 backdrop-blur-sm mx-2">
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
                className="mt-6 text-green-500 font-bold hover:text-cielo transition-colors"
              >
                Limpiar todos los filtros
              </button>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {eventos.map((evento) => {
                const fechaObj = new Date(evento.fecha);
                const day = fechaObj.getDate();
                const month = fechaObj.toLocaleString("es-AR", {
                  month: "short",
                });

                return (
                  <Link
                    to={`/evento/${evento.id_evento}`}
                    key={evento.id_evento}
                    className="group blockbg-crema/5/40 hover:bg-neutral-800 rounded-xl p-4 sm:p-6 borderborder-crema/20/50 hover:border-green-500/50 transition-all duration-300 backdrop-blur-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                      {/* Bloque de Fecha y Género (Arriba en móvil, Izquierda en PC) */}
                      <div className="flex items-center gap-4 sm:gap-6 sm:w-1/4">
                        <div className="text-center min-w-[60px] sm:min-w-[70px]bg-tinta/80 rounded-lg py-2 px-3 border border-neutral-800 group-hover:border-green-500/30 transition-colors">
                          <p className="text-2xl sm:text-3xl font-blacktext-cielo hover:text-crema">
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
                          <span className="text-[10px]bg-crema/10 text-crema/80  px-2 py-0.5 rounded-full border border-neutral-600">
                            {evento.clasificacion || "ATP"}
                          </span>
                        </div>
                      </div>

                      {/* Info Principal (Centro) */}
                      <div className="flex-grow">
                        <h2 className="text-xl sm:text-2xl font-bold text-crema mb-1 sm:mb-2 group-hover:text-cielo transition-colors line-clamp-2">
                          {evento.nombre}
                        </h2>
                        <p className="text-crema/70 text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                          <span>📍</span>{" "}
                          <span className="truncate">
                            {evento.lugar},{" "}
                            <strong className="text-crema/80 ">
                              {evento.ciudad}
                            </strong>
                          </span>
                        </p>
                      </div>

                      {/* Acción / Botón (Abajo en móvil, Derecha en PC) */}
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 sm:gap-2 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0border-crema/20/50">
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
                        <div className="bg-white/10 group-hover:bg-green-500 text-crema group-hover:text-tinta font-bold py-1.5 sm:py-2 px-4 sm:px-6 rounded-full transition-all duration-300 flex items-center gap-2 text-xs sm:text-sm w-auto">
                          Detalles{" "}
                          <span className="hidden sm:inline">&rarr;</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventList;

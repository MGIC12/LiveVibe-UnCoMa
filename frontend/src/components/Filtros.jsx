const Filtros = ({
  filtroGenero,
  setFiltroGenero,
  filtroCiudad,
  setFiltroCiudad,
}) => {
  const generos = ["Todos", "Indie", "Rock", "Rock Nacional", "Jazz", "Urbano"];
  const ciudades = ["Todas", "Neuquén", "Cipolletti", "General Roca"];

  return (
    <div className="mb-8 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Filtrar por Género
        </h3>
        <div className="flex flex-wrap gap-3">
          {generos.map((genero) => {
            const valor = genero === "Todos" ? "" : genero;
            const isActive = filtroGenero === valor;

            return (
              <button
                key={genero}
                onClick={() => setFiltroGenero(valor)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? "bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    : "bg-neutral-800 text-gray-300 hover:bg-neutral-700 hover:text-white border border-neutral-700 hover:border-neutral-500"
                }`}
              >
                {genero}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Ubicación
        </h3>
        <div className="flex flex-wrap gap-3">
          {ciudades.map((ciudad) => {
            const valor = ciudad === "Todas" ? "" : ciudad;
            const isActive = filtroCiudad === valor;

            return (
              <button
                key={ciudad}
                onClick={() => setFiltroCiudad(valor)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]" // Usamos morado para diferenciar la ubicación
                    : "bg-neutral-800 text-gray-300 hover:bg-neutral-700 hover:text-white border border-neutral-700 hover:border-neutral-500"
                }`}
              >
                {ciudad}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Filtros;

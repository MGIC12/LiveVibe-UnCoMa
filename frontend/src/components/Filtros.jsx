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
        <h3 className="text-sm font-semibold text-crema/70 uppercase tracking-wider mb-3">
          Filtrar por género
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
                    ? "bg-fucsia text-tinta shadow-[0_0_15px_rgba(255,46,147,0.35)]"
                    : "bg-neutral-800 text-crema/80  hover:bg-neutral-700 hover:text-crema border border-crema/20 hover:border-neutral-500"
                }`}
              >
                {genero}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-crema/70 uppercase tracking-wider mb-3">
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
                    ? "bg-sol text-tinta shadow-[0_0_15px_rgba(255,200,60,0.3)]" // El sol distingue la ubicación del género
                    : "bg-neutral-800 text-crema/80  hover:bg-neutral-700 hover:text-crema border border-crema/20 hover:border-neutral-500"
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

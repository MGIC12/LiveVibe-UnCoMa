const HeroEvent = () => {
  return (
    <header
      className="relative h-[70vh] min-h-[500px] flex items-end bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.pexels.com/photos/14591832/pexels-photo-14591832.jpeg')",
      }}
    >
      {/* Gradiente estilo Netflix: Oscuro abajo, transparente arriba */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/60 to-transparent"></div>

      {/* Contenido sobre el gradiente */}
      <div className="relative z-10 container mx-auto px-4 pb-12 md:pb-16">
        <span className="text-green-400 font-bold tracking-widest text-sm uppercase drop-shadow-md mb-2 block">
          NUEVO SHOW DESTACADO
        </span>
        <h1 className="text-5xl md:text-7xl font-black text-white mb-4 drop-shadow-lg leading-tight">
          LOS FUNDAMENTALES <br /> DEL ROCK
        </h1>
        <p className="text-gray-300 text-lg md:text-xl max-w-2xl mb-8 drop-shadow-md font-medium">
          Sábado 15 de Octubre, 21:00 hs. | Estadio Único <br />
          No te pierdas la gira de despedida más esperada del año.
        </p>

        <div className="flex gap-4">
          <button className="bg-green-500 hover:bg-green-400 text-black font-bold py-3 px-8 rounded-full transition transform hover:scale-105 shadow-lg flex items-center gap-2">
            RESERVAR AHORA
          </button>
          <button className="bg-neutral-500/50 hover:bg-neutral-500/80 text-white font-bold py-3 px-8 rounded-full backdrop-blur-sm transition border border-neutral-400/30">
            Más Información
          </button>
        </div>
      </div>
    </header>
  );
};

export default HeroEvent;

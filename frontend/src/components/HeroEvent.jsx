const HeroEvent = () => {
  return (
    <header className="p-8 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 text-center">
      <h2 className="text-xl text-purple-400 font-semibold mb-2">
        🌟 EVENTO DESTACADO
      </h2>
      <h1 className="text-4xl font-bold mb-4 text-white">
        LOS FUNDAMENTALES DEL ROCK - ESTADIO ÚNICO
      </h1>
      <p className="text-gray-300 mb-6">
        Sábado 15 de Octubre, 21:00 hs. | Quedan pocas entradas
      </p>
      <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full transition duration-300">
        RESERVAR MI LUGAR
      </button>
    </header>
  );
};

export default HeroEvent;

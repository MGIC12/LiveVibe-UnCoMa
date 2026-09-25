const Filtros = () => {
  const categories = [
    "🎸 Todos",
    "🤘 Rock",
    "🎹 Jazz",
    "🎤 Urbano",
    "🎧 Electrónica",
    "🥁 Indie",
    "🎸 Metal",
    "🎺 Reggae",
  ];

  return (
    // Cambiamos overflow-x-auto por flex-wrap para que bajen a la siguiente línea
    <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3 py-4 px-2 md:px-0">
      {categories.map((cat, index) => (
        <button
          key={index}
          className={`px-4 md:px-6 py-2 rounded-full text-sm md:text-base font-semibold transition duration-300 shadow-md ${
            index === 0
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};

export default Filtros;

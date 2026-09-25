const CommunityFeed = () => {
  return (
    <section className="md:w-3/5">
      {/* BANNER CTA (Llamado a la acción) */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 mb-8 shadow-lg text-center md:text-left flex flex-col md:flex-row items-center justify-between">
        <div>
          <h4 className="text-xl font-bold text-white mb-1">
            ¡Únete a la conversación! 🤘
          </h4>
          <p className="text-purple-100 text-sm">
            Crea tu cuenta para publicar, comentar y conectar con otros fans.
          </p>
        </div>
        <button className="mt-4 md:mt-0 bg-white text-purple-700 font-bold py-2 px-6 rounded-full hover:bg-gray-100 transition shadow-md whitespace-nowrap">
          Crear cuenta
        </button>
      </div>

      <h3 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">
        🗣️ FEED DE LA COMUNIDAD
      </h3>

      {/* Caja para nueva publicación (Simulando usuario logueado o deshabilitada) */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6 opacity-75">
        <textarea
          placeholder="Inicia sesión para publicar a qué recital vas esta semana..."
          className="w-full bg-gray-700 text-white p-3 rounded-md mb-3 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-not-allowed"
          rows="3"
          disabled
        ></textarea>
        <div className="flex justify-end">
          <button className="bg-gray-600 text-gray-400 px-4 py-2 rounded-md font-semibold cursor-not-allowed">
            Publicar
          </button>
        </div>
      </div>

      <article className="bg-gray-800 p-4 rounded-lg mb-4 shadow-md">
        <div className="flex items-center mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full mr-3"></div>
          <div>
            <h4 className="font-bold text-white">Mariano Infante</h4>
            <p className="text-xs text-purple-400 font-medium">
              🎵 Canción fav: "De música ligera"
            </p>
          </div>
        </div>
        <p className="text-gray-300 mb-4">
          ¡Ya aseguré mi entrada para el Indie Fest! Nos vemos ahí 🎸
        </p>
        <div className="flex space-x-4 text-sm text-gray-400 border-t border-gray-700 pt-3">
          <button className="hover:text-purple-400 transition flex items-center gap-1">
            ❤️ 12
          </button>
          <button className="hover:text-purple-400 transition flex items-center gap-1">
            💬 2
          </button>
        </div>
      </article>
    </section>
  );
};

export default CommunityFeed;

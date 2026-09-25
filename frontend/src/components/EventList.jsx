const EventList = () => {
  return (
    <aside className="md:w-2/5">
      <h3 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">
        📅 PRÓXIMOS CONCIERTOS
      </h3>

      <div className="flex flex-col gap-4">
        {/* Tarjeta de Evento 1 con Indicador Social */}
        <div className="bg-gray-800 p-4 rounded-lg flex justify-between items-center hover:bg-gray-750 transition cursor-pointer shadow-md">
          <div>
            <h4 className="font-bold text-lg text-white">Indie Fest 2026</h4>
            <p className="text-gray-400 text-sm">📍 Teatro Vorterix | 20 Nov</p>
            <p className="text-xs text-orange-400 mt-2 font-semibold">
              🔥 45 fans ya tienen su entrada
            </p>
          </div>
          <button className="text-purple-400 font-bold hover:text-purple-300">
            Reservar &gt;
          </button>
        </div>

        {/* Tarjeta de Evento 2 con Indicador Social */}
        <div className="bg-gray-800 p-4 rounded-lg flex justify-between items-center hover:bg-gray-750 transition cursor-pointer shadow-md">
          <div>
            <h4 className="font-bold text-lg text-white">Tributo Queen</h4>
            <p className="text-gray-400 text-sm">📍 Luna Park | 05 Dic</p>
            <p className="text-xs text-orange-400 mt-2 font-semibold">
              🎵 A 120 personas les interesa
            </p>
          </div>
          <button className="text-purple-400 font-bold hover:text-purple-300">
            Reservar &gt;
          </button>
        </div>
      </div>

      {/* SECCIÓN PLAYLIST GENERADA (Feedback del Profesor) */}
      <div className="mt-8 bg-gradient-to-br from-gray-800 to-purple-900 p-5 rounded-lg border border-purple-500/50 shadow-lg relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute -right-6 -top-6 text-6xl opacity-10">🎧</div>

        <h4 className="font-bold text-white mb-1 flex items-center gap-2">
          ✨ Tu Playlist Generada
        </h4>
        <p className="text-xs text-purple-200 mb-4">
          Basada en tu reserva para el "Indie Fest" y los gustos de otros
          asistentes.
        </p>

        <ul className="space-y-3">
          <li className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-purple-700 rounded flex items-center justify-center text-xs">
              ▶️
            </div>
            <div>
              <p className="text-white font-semibold">De música ligera</p>
              <p className="text-gray-400 text-xs">
                Soda Stereo (Fav de la comunidad)
              </p>
            </div>
          </li>
          <li className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-purple-700 rounded flex items-center justify-center text-xs">
              ▶️
            </div>
            <div>
              <p className="text-white font-semibold">Crimen</p>
              <p className="text-gray-400 text-xs">
                Gustavo Cerati (Top Artista)
              </p>
            </div>
          </li>
          <li className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-purple-700 rounded flex items-center justify-center text-xs">
              ▶️
            </div>
            <div>
              <p className="text-white font-semibold">Arrancarmelo</p>
              <p className="text-gray-400 text-xs">Wos (Sugerencia IA)</p>
            </div>
          </li>
        </ul>

        <button className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded transition text-sm">
          Escuchar en Spotify
        </button>
      </div>
    </aside>
  );
};

export default EventList;

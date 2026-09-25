const Navbar = () => {
  return (
    <nav className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
      <div className="text-2xl font-bold text-white">LiveVibe</div>
      <div className="flex-1 mx-4">
        <input
          type="text"
          placeholder="Buscar..."
          className="w-full max-w-md px-4 py-2 rounded-full bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      <div className="flex space-x-4 items-center text-white">
        <a href="#" className="hover:text-purple-400">
          Inicio
        </a>
        <a href="#" className="hover:text-purple-400">
          Mi Perfil
        </a>
        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
          👤
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

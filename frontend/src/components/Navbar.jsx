import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    // Fondo negro puro como Spotify
    <nav className="flex justify-between items-center p-4 bg-black sticky top-0 z-50">
      <Link
        to="/"
        className="text-2xl font-black text-white hover:text-green-400 transition flex items-center gap-2"
      >
        <span className="text-green-500">🎧</span> LiveVibe
      </Link>

      <div className="flex-1 mx-4 hidden md:flex justify-center">
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-4 flex items-center text-gray-400"></span>
          <input
            type="text"
            placeholder="¿Qué quieres escuchar en vivo?"
            className="w-full pl-12 pr-4 py-3 rounded-full bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-neutral-700 transition placeholder-gray-400 font-medium"
          />
        </div>
      </div>

      <div className="flex space-x-6 items-center text-gray-300 font-bold text-sm">
        <Link to="/" className="hover:text-white hover:scale-105 transition">
          Inicio
        </Link>
        <Link
          to="/login"
          className="hover:text-white hover:scale-105 transition"
        >
          Iniciar Sesión
        </Link>
        <Link
          to="/perfil"
          className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center hover:bg-neutral-700 transition cursor-pointer border border-neutral-700"
        >
          👤
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;

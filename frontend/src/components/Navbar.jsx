import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";

const Navbar = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const enPaginaAuth = pathname === "/login" || pathname === "/registro";

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Estado para el término de búsqueda
  const [terminoBusqueda, setTerminoBusqueda] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleLogout() {
    logout();
    navigate("/");
    setMenuAbierto(false);
  }

  const getInicial = () => {
    if (!usuario) return "U";
    return (
      usuario.nombre_usuario ||
      usuario.nombre_completo ||
      usuario.nombre ||
      usuario.email ||
      "U"
    ).charAt(0);
  };

  const fotoUsuario = usuario?.foto_perfil || usuario?.foto || usuario?.avatar;

  // Función para ejecutar la búsqueda al presionar Enter
  const handleBuscar = (e) => {
    if (e.key === "Enter" && terminoBusqueda.trim() !== "") {
      navigate(`/buscar?q=${encodeURIComponent(terminoBusqueda)}`);
      setMenuAbierto(false);
      setTerminoBusqueda(""); // Limpiamos el input después de buscar
    }
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-neutral-900/80 backdrop-blur-md border-b border-neutral-700/50 shadow-lg"
          : "bg-neutral-900/60 backdrop-blur-sm border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="text-2xl font-black text-white hover:text-green-400 transition flex items-center gap-2"
          >
            LiveVibe
          </Link>

          {/* Barra de Búsqueda (PC) */}
          <div className="flex-1 mx-4 hidden md:flex justify-center">
            <div className="relative w-full max-w-md">
              <input
                type="text"
                placeholder="Buscar artistas, eventos, géneros..."
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
                onKeyDown={handleBuscar}
                className="w-full pl-6 pr-4 py-2 rounded-full bg-neutral-800/80 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-neutral-800 transition placeholder-gray-400 font-medium text-sm"
              />
            </div>
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="text-gray-300 hover:text-white focus:outline-none p-2"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {menuAbierto ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-6 text-gray-300 font-bold text-sm">
            <Link
              to="/"
              className="hover:text-white hover:scale-105 transition"
            >
              Inicio
            </Link>

            {usuario ? (
              <>
                {/* NUEVO ENLACE: Mis Entradas (Escritorio) */}
                <Link
                  to="/mis-reservas"
                  className="hover:text-white hover:scale-105 transition text-green-400"
                >
                  Mis Entradas
                </Link>
                <Link
                  to="/perfil"
                  className="hover:text-white hover:scale-105 transition"
                >
                  Mi Perfil
                </Link>

                <div className="flex items-center gap-3">
                  {fotoUsuario ? (
                    <img
                      src={fotoUsuario}
                      alt="Perfil"
                      className="w-8 h-8 rounded-full object-cover border border-neutral-700"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center border border-neutral-700 text-xs text-white uppercase font-bold">
                      {getInicial()}
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-1.5 rounded-full bg-neutral-800/80 hover:bg-red-500/20 hover:text-red-400 border border-neutral-700 transition-colors"
                  >
                    Salir
                  </button>
                </div>
              </>
            ) : (
              !enPaginaAuth && (
                <>
                  <Link
                    to="/login"
                    className="hover:text-white hover:scale-105 transition"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/registro"
                    className="px-5 py-2 rounded-full bg-green-500 text-black hover:bg-green-400 hover:scale-105 transition-all shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                  >
                    Regístrate
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </div>

      {/* Menú Móvil */}
      <div
        className={`md:hidden absolute w-full left-0 top-16 transition-all duration-300 overflow-hidden ${
          menuAbierto
            ? "max-h-96 border-b border-neutral-800 shadow-xl"
            : "max-h-0"
        }`}
      >
        <div className="bg-neutral-900/95 backdrop-blur-md px-4 pt-4 pb-6 space-y-4">
          {/* Barra de Búsqueda (Móvil) */}
          <div className="relative w-full mb-6">
            <input
              type="text"
              placeholder="Buscar..."
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              onKeyDown={handleBuscar}
              className="w-full pl-6 pr-4 py-2 rounded-full bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>

          <Link
            to="/"
            onClick={() => setMenuAbierto(false)}
            className="block px-3 py-2 text-base font-bold text-gray-300 hover:text-white hover:bg-neutral-800 rounded-md"
          >
            Inicio
          </Link>

          {usuario ? (
            <>
              {/* NUEVO ENLACE: Mis Entradas (Móvil) */}
              <Link
                to="/mis-reservas"
                onClick={() => setMenuAbierto(false)}
                className="block px-3 py-2 text-base font-bold text-green-400 hover:text-green-300 hover:bg-neutral-800 rounded-md"
              >
                Mis Entradas
              </Link>
              <Link
                to="/perfil"
                onClick={() => setMenuAbierto(false)}
                className="block px-3 py-2 text-base font-bold text-gray-300 hover:text-white hover:bg-neutral-800 rounded-md"
              >
                Mi Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left block px-3 py-2 text-base font-bold text-red-400 hover:bg-neutral-800 rounded-md"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            !enPaginaAuth && (
              <div className="pt-4 border-t border-neutral-800 flex flex-col gap-3">
                <Link
                  to="/login"
                  onClick={() => setMenuAbierto(false)}
                  className="block text-center px-4 py-2 text-base font-bold text-white hover:bg-neutral-800 rounded-full border border-neutral-700"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/registro"
                  onClick={() => setMenuAbierto(false)}
                  className="block text-center px-4 py-2 text-base font-bold text-black bg-green-500 hover:bg-green-400 rounded-full"
                >
                  Regístrate
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

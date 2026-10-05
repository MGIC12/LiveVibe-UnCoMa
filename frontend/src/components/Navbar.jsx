import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const enPaginaAuth = pathname === "/login" || pathname === "/registro";

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
      <Link to="/" className="text-2xl font-bold text-white">
        LiveVibe
      </Link>

      <div className="flex-1 mx-4">
        <input
          type="text"
          placeholder="Buscar..."
          className="w-full max-w-md px-4 py-2 rounded-full bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="flex space-x-4 items-center text-white">
        <Link to="/" className="hover:text-purple-400">
          Inicio
        </Link>

        {usuario ? (
            <>
              <Link to="/perfil" className="hover:text-purple-400">
                Mi Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1 rounded-full bg-purple-600 hover:bg-purple-500"
              >
                Cerrar sesión
              </button>
            </>
        ) : (
          !enPaginaAuth && (
            <>
              <Link to="/login" className="hover:text-purple-400">
                Iniciar Sesión
              </Link>
              <Link
                to="/registro"
                className="px-3 py-1 rounded-full bg-purple-600 hover:bg-purple-500"
              >
                Registrarse
              </Link>
            </>
          )
        )}
      </div>
    </nav>
  );
};

export default Navbar;
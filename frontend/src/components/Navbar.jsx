import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Avatar from "./Avatar";
import CampanaNotificaciones from "./CampanaNotificaciones";
import { useState, useEffect } from "react";
import { useCarrito } from "../../context/CarritoContext";
import MenuDesplegable from "./MenuDesplegable";
import IconoCarrito from "./IconoCarrito";

const Navbar = () => {
  const { usuario, logout } = useAuth();
  const { unidades } = useCarrito();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const enPaginaAuth = pathname === "/login" || pathname === "/registro";

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Estado para el término de búsqueda (Feature 7)
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

  // Función para ejecutar la búsqueda al presionar Enter
  const handleBuscar = (e) => {
    if (e.key === "Enter" && terminoBusqueda.trim() !== "") {
      navigate(`/buscar?q=${encodeURIComponent(terminoBusqueda)}`);
      setMenuAbierto(false);
      setTerminoBusqueda(""); // Limpiamos el input después de buscar
    }
  };

  // Tu perfil público: de ahí se llega a "Editar mi perfil"
  const rutaPerfil = usuario
    ? `${usuario.rol === "artista" ? "/artista" : "/usuario"}/${encodeURIComponent(
        usuario.nombre_usuario,
      )}`
    : "/login";
  const puedePublicar = usuario?.rol === "fan" || usuario?.rol === "artista";

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-tinta/90 backdrop-blur-md border-b border-crema/20 shadow-lg"
          : "bg-tinta/70 backdrop-blur-sm border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="text-2xl font-black text-crema hover:text-sol transition flex items-center gap-2"
          >
            <span className="w-4 h-4 rounded-full bg-fucsia border-4 border-sol" />
            LiveVibe
          </Link>

          {/* Barra de Búsqueda (Escritorio) */}
          <div className="flex-1 mx-4 hidden lg:flex justify-center">
            <div className="relative w-full max-w-md">
              <input
                type="text"
                placeholder="Buscar artistas, eventos, géneros, usuarios..."
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
                onKeyDown={handleBuscar}
                className="w-full pl-6 pr-4 py-2 rounded-full bg-crema/10 border border-crema/25 text-crema focus:outline-none focus:ring-2 focus:ring-cielo focus:bg-crema/15 transition placeholder-crema/60 font-medium text-sm"
              />
            </div>
          </div>

          {/* Botón Menú Móvil */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
              className="text-crema hover:text-sol focus:outline-none p-2"
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

          {/* Enlaces de Navegación (Escritorio) */}
          <div className="hidden lg:flex items-center space-x-6 text-cielo font-bold text-sm">
            <Link
              to="/"
              className="hover:text-crema hover:scale-105 transition text-fucsia"
            >
              Inicio
            </Link>

            <Link
              to="/comunidad"
              className="hover:text-crema hover:scale-105 transition"
            >
              Comunidad
            </Link>

            {usuario ? (
              <>
                {usuario.rol === "artista" && (
                  <>
                    <Link
                      to="/mis-eventos"
                      className="hover:text-crema hover:scale-105 transition text-fucsia"
                    >
                      Mis eventos
                    </Link>
                    <Link
                      to="/eventos/nuevo"
                      className="hover:text-crema hover:scale-105 transition"
                    >
                      Crear evento
                    </Link>
                    <MenuDesplegable
                      etiqueta="Mi Tienda"
                      opciones={[
                        { to: "/mi-merch", texto: "Mi merch" },
                        { to: "/mis-ventas", texto: "Mis ventas" },
                      ]}
                    />
                  </>
                )}

                {usuario.rol === "fan" && (
                  <>
                    <Link
                      to="/mis-reservas"
                      className="hover:text-crema hover:scale-105 transition text-fucsia"
                    >
                      Mis entradas
                    </Link>
                    <Link
                      to="/mis-compras"
                      className="hover:text-crema hover:scale-105 transition"
                    >
                      Mis compras
                    </Link>
                    <Link
                      to="/carrito"
                      aria-label={`Mi carrito (${unidades} ${unidades === 1 ? "unidad" : "unidades"})`}
                      title="Mi carrito"
                      className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-crema/10 border border-crema/25 text-crema hover:border-fucsia hover:text-fucsia transition"
                    >
                      <IconoCarrito />
                      {unidades > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-fucsia text-tinta text-[10px] font-black flex items-center justify-center">
                          {unidades > 99 ? "99+" : unidades}
                        </span>
                      )}
                    </Link>
                  </>
                )}

                <div className="flex items-center gap-3">
                  {puedePublicar && (
                    <Link
                      to="/publicar"
                      aria-label="Crear publicación"
                      title="Crear publicación"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-sol hover:bg-chicle text-tinta transition hover:scale-105"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </Link>
                  )}

                  <CampanaNotificaciones />

                  {/* Tocar la foto lleva a tu perfil */}
                  <Link
                    to={rutaPerfil}
                    aria-label="Ir a mi perfil"
                    title="Mi perfil"
                    className="rounded-full hover:ring-2 hover:ring-fucsia transition"
                  >
                    <Avatar
                      usuario={usuario}
                      clases="w-8 h-8 text-xs"
                      fondo="bg-tinta border-2 border-fucsia"
                    />
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="px-4 py-1.5 rounded-full bg-crema/10 border border-crema/25 text-crema hover:border-fucsia hover:text-fucsia transition-colors"
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
                    className="hover:text-crema hover:scale-105 transition text-fucsia"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    to="/registro"
                    className="px-5 py-2 rounded-full bg-fucsia text-tinta hover:bg-chicle hover:scale-105 transition-all shadow-[0_0_12px_rgba(255,46,147,0.45)]"
                  >
                    Registrate
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </div>

      {/* Menú Móvil Desplegable: si no entra en pantalla, tiene su propio scroll */}
      <div
        className={`lg:hidden absolute w-full left-0 top-16 transition-all duration-300 ${
          menuAbierto
            ? "max-h-[85vh] overflow-y-auto border-b border-crema/15 shadow-xl"
            : "max-h-0 overflow-hidden"
        }`}
      >
        <div className="bg-tinta/95 backdrop-blur-md px-4 pt-4 pb-6 space-y-4">
          {/* Barra de Búsqueda (Móvil) */}
          <div className="relative w-full mb-6">
            <input
              type="text"
              placeholder="Buscar..."
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              onKeyDown={handleBuscar}
              className="w-full pl-6 pr-4 py-2 rounded-full bg-crema/10 border border-crema/25 text-crema placeholder-crema/60 focus:outline-none focus:ring-2 focus:ring-cielo text-sm"
            />
          </div>

          <Link
            to="/"
            onClick={() => setMenuAbierto(false)}
            className="block px-3 py-2 text-base font-bold text-crema hover:bg-crema/10 rounded-md"
          >
            Inicio
          </Link>

          <Link
            to="/comunidad"
            onClick={() => setMenuAbierto(false)}
            className="block px-3 py-2 text-base font-bold text-crema hover:bg-crema/10 rounded-md"
          >
            Comunidad
          </Link>

          {usuario ? (
            <>
              {usuario.rol === "artista" && (
                <>
                  <Link
                    to="/mis-eventos"
                    onClick={() => setMenuAbierto(false)}
                    className="block px-3 py-2 text-base font-bold text-crema hover:bg-crema/10 rounded-md"
                  >
                    Mis eventos
                  </Link>

                  <Link
                    to="/eventos/nuevo"
                    onClick={() => setMenuAbierto(false)}
                    className="block px-3 py-2 text-base font-bold text-crema hover:bg-crema/10 rounded-md"
                  >
                    Crear evento
                  </Link>
                  <p className="px-3 pt-2 text-xs font-bold uppercase tracking-wider text-crema/50">
                    Mi tienda
                  </p>

                  <Link
                    to="/mi-merch"
                    onClick={() => setMenuAbierto(false)}
                    className="block pl-6 pr-3 py-2 text-base font-bold text-crema hover:bg-crema/10 rounded-md"
                  >
                    Mi merch
                  </Link>

                  <Link
                    to="/mis-ventas"
                    onClick={() => setMenuAbierto(false)}
                    className="block pl-6 pr-3 py-2 text-base font-bold text-crema hover:bg-crema/10 rounded-md"
                  >
                    Mis ventas
                  </Link>
                </>
              )}

              {puedePublicar && (
                <Link
                  to="/publicar"
                  onClick={() => setMenuAbierto(false)}
                  className="block px-3 py-2 text-base font-bold text-sol hover:bg-crema/10 rounded-md"
                >
                  ➕ Crear publicación
                </Link>
              )}

              {usuario.rol === "fan" && (
                <>
                  <Link
                    to="/mis-reservas"
                    onClick={() => setMenuAbierto(false)}
                    className="block px-3 py-2 text-base font-bold text-crema hover:bg-crema/10 rounded-md"
                  >
                    Mis entradas
                  </Link>
                  <Link
                    to="/mis-compras"
                    onClick={() => setMenuAbierto(false)}
                    className="block px-3 py-2 text-base font-bold text-crema hover:bg-crema/10 rounded-md"
                  >
                    Mis compras
                  </Link>
                  <Link
                    to="/carrito"
                    onClick={() => setMenuAbierto(false)}
                    className="block px-3 py-2 text-base font-bold text-crema hover:bg-crema/10 rounded-md"
                  >
                    <span className="inline-flex items-center gap-2">
                      <IconoCarrito clases="w-5 h-5" />
                      Mi carrito{unidades > 0 ? ` (${unidades})` : ""}
                    </span>
                  </Link>
                </>
              )}

              <CampanaNotificaciones
                etiqueta
                onClick={() => setMenuAbierto(false)}
              />

              <Link
                to={rutaPerfil}
                onClick={() => setMenuAbierto(false)}
                className="flex items-center gap-3 px-3 py-2 text-base font-bold text-crema hover:bg-crema/10 rounded-md"
              >
                <Avatar
                  usuario={usuario}
                  clases="w-8 h-8 text-xs"
                  fondo="bg-tinta border-2 border-fucsia"
                />
                {usuario.nombre_usuario}
              </Link>

              <button
                onClick={handleLogout}
                className="w-full text-left block px-3 py-2 text-base font-bold text-fucsia hover:bg-crema/10 rounded-md"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            !enPaginaAuth && (
              <div className="pt-4 border-t border-crema/15 flex flex-col gap-3">
                <Link
                  to="/login"
                  onClick={() => setMenuAbierto(false)}
                  className="block text-center px-4 py-2 text-base font-bold text-crema hover:bg-crema/10 rounded-full border border-crema/30"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registro"
                  onClick={() => setMenuAbierto(false)}
                  className="block text-center px-4 py-2 text-base font-bold text-tinta bg-fucsia hover:bg-chicle rounded-full"
                >
                  Registrate
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

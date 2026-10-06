import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Uso:
//   <RutaProtegida><MiPerfil /></RutaProtegida>                    -> requiere sesión
//   <RutaProtegida roles={["artista"]}><PanelArtista /></RutaProtegida> -> requiere rol
export default function RutaProtegida({ children, roles }) {
  const { usuario, cargando } = useAuth();

  if (cargando) return <p>Cargando...</p>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" replace />;

  return children;
}
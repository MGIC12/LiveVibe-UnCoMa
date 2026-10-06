import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import EventoDetalle from "./pages/EventoDetalle";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Perfil from "./pages/Perfil";
import RutaProtegida from "./components/RutaProtegida";

// Temporales
const NotFound = () => (
  <div className="text-white p-8">Error 404: Página no encontrada</div>
);

function App() {
  return (
    <div className="bg-gray-900 min-h-screen">
      <Routes>
        {/* Ruta principal */}
        <Route path="/" element={<Home />} />

        {/* Ruta de inicio de sesión */}
        <Route path="/login" element={<Login />} />

        {/* Ruta de registro */}
        <Route path="/registro" element={<Register />} />

        {/* Ruta del perfil */}
        <Route
          path="/perfil"
          element={
            <RutaProtegida>
              {" "}
              <Perfil />{" "}
            </RutaProtegida>
          }
        />

        {/* Ruta con parámetro dinámico (el ID del evento) */}
        <Route path="/evento/:id" element={<EventoDetalle />} />

        {/* Ruta comodín */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;

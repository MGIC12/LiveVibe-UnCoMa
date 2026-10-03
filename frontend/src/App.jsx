import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import EventoDetalle from "./pages/EventoDetalle";

// Temporales
const Login = () => (
  <div className="text-white p-8">
    Página de Inicio de Sesión (En construcción)
  </div>
);
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
        <Route path="/registro" element={<Login />} />

        {/* Ruta con parámetro dinámico (el ID del evento) */}
        <Route path="/evento/:id" element={<EventoDetalle />} />

        {/* Ruta comodín */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;

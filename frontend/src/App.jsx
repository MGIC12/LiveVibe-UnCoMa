import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import EventoDetalle from "./pages/EventoDetalle";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Perfil from "./pages/Perfil";
import RutaProtegida from "./components/RutaProtegida";
import Buscador from "./pages/Buscador";
import CrearEvento from "./pages/CrearEvento";
import EditarEvento from "./pages/EditarEvento";
import PerfilArtista from "./pages/PerfilArtista";
import MisReservas from "./pages/MisReservas";

// Temporales
const NotFound = () => (
  <div className="text-crema p-8">Error 404: Página no encontrada</div>
);

function App() {
  return (
    <div className="bg-tinta text-crema min-h-screen">
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

        <Route path="/buscar" element={<Buscador />} />

        <Route
          path="/eventos/nuevo"
          element={
            <RutaProtegida roles={["artista"]}>
              <CrearEvento />
            </RutaProtegida>
          }
        />

        <Route
          path="/eventos/:id/editar"
          element={
            <RutaProtegida roles={["artista"]}>
              <EditarEvento />
            </RutaProtegida>
          }
        />

        <Route path="/perfil-artista/:username" element={<PerfilArtista />} />

        <Route
          path="/mis-reservas"
          element={
            <RutaProtegida>
              <MisReservas />
            </RutaProtegida>
          }
        />
        {/* Ruta comodín */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;

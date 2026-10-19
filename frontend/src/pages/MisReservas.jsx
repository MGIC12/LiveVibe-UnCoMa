import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../../context/AuthContext";
const MisReservas = () => {
  const { usuario } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Solo cargamos si tenemos el usuario disponible
    if (usuario?.nombre_usuario) {
      cargarReservas();
    }
  }, [usuario]);

  const cargarReservas = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/reservas/usuario/${usuario.nombre_usuario}`,
      );
      const data = await response.json();

      // Seguro anti-pantalla-blanca: Verificamos que data sea un arreglo válido
      if (Array.isArray(data)) {
        setReservas(data);
      } else {
        setReservas([]);
        console.error("Respuesta del servidor no es un arreglo:", data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar reservas:", error);
      setLoading(false);
    }
  };

  const handleCancelar = async (idReserva) => {
    if (!window.confirm("¿Estás seguro de que deseas cancelar esta reserva?"))
      return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/reservas/${idReserva}/cancelar`,
        {
          method: "PUT",
        },
      );

      const data = await response.json();

      if (response.ok) {
        alert("Reserva cancelada exitosamente.");
        cargarReservas(); // Recargamos la lista
      } else {
        alert(data.error || "No se pudo cancelar la reserva.");
      }
    } catch (error) {
      console.error("Error al cancelar:", error);
      alert("Hubo un problema de conexión.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex justify-center items-center">
        Cargando tus reservas...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto p-4 md:p-8 mt-24 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 border-b border-neutral-700 pb-4">
          🎟️ Mis Entradas
        </h1>

        {reservas.length === 0 ? (
          <div className="text-center py-12 bg-neutral-800 rounded-xl border border-neutral-700 shadow-xl">
            <p className="text-gray-400 mb-4 text-lg">
              Aún no tienes entradas reservadas.
            </p>
            <Link
              to="/"
              className="inline-block bg-green-500 text-black px-6 py-2 rounded-full font-bold hover:bg-green-400 transition"
            >
              Descubrir eventos
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reservas.map((reserva) => {
              const eventoPasado = new Date(reserva.evento_fecha) < new Date();
              const cancelada = reserva.estado === "cancelada";

              return (
                <div
                  key={reserva.id_reserva}
                  className={`p-6 rounded-xl border ${cancelada ? "bg-neutral-800/50 border-red-900/50 opacity-75" : "bg-neutral-800 border-neutral-700 shadow-lg"} flex flex-col md:flex-row justify-between items-center gap-4`}
                >
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {reserva.evento_nombre}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">
                      📅{" "}
                      {new Date(reserva.evento_fecha).toLocaleDateString(
                        "es-AR",
                      )}{" "}
                      | 📍 {reserva.lugar}, {reserva.ciudad}
                    </p>
                    <div className="flex gap-2 items-center mt-2">
                      <span
                        className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${cancelada ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-green-500/20 text-green-400 border border-green-500/30"}`}
                      >
                        Estado: {reserva.estado}
                      </span>
                    </div>
                  </div>

                  <div className="w-full md:w-auto">
                    {!cancelada && !eventoPasado && (
                      <button
                        onClick={() => handleCancelar(reserva.id_reserva)}
                        className="w-full md:w-auto px-6 py-2 bg-transparent border border-red-500 text-red-500 font-bold rounded-full hover:bg-red-500 hover:text-white transition"
                      >
                        Cancelar Reserva
                      </button>
                    )}
                    {eventoPasado && !cancelada && (
                      <span className="text-gray-500 italic text-sm">
                        Evento finalizado
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MisReservas;

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../../context/AuthContext";

const MisReservas = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    cargarReservas();
  }, []);

  const cargarReservas = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/reservas/mis-reservas",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setReservas(data);
      }
    } catch (error) {
      console.error("Error al cargar reservas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async (id) => {
    if (!window.confirm("¿Estás seguro de cancelar esta reserva?")) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/reservas/${id}/cancelar`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (res.ok) {
        alert("Reserva cancelada exitosamente.");
        cargarReservas(); // Recargar la lista
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-tinta text-crema flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-28 pb-12 max-w-4xl">
        <h1 className="text-4xl font-black mb-8 text-white">
          Mis <span className="text-fucsia">Entradas</span>
        </h1>

        {loading ? (
          <p className="text-center text-crema/60 animate-pulse">
            Cargando tus entradas...
          </p>
        ) : reservas.length === 0 ? (
          <div className="bg-neutral-900/50 p-10 rounded-2xl text-center border border-neutral-800">
            <p className="text-xl mb-4 text-crema/80">
              Aún no tienes entradas reservadas.
            </p>
            <Link
              to="/"
              className="bg-fucsia hover:bg-chicle text-tinta px-6 py-3 rounded-full font-bold transition-colors"
            >
              Explorar eventos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reservas.map((reserva) => (
              <div
                key={reserva.id_reserva}
                className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4"
              >
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {reserva.evento_nombre}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    📍 {reserva.lugar}, {reserva.ciudad}
                  </p>
                  <p className="text-crema/70 font-medium">
                    📅{" "}
                    {new Date(reserva.evento_fecha).toLocaleDateString("es-AR")}
                  </p>
                  <span
                    className={`inline-block mt-3 px-3 py-1 text-xs font-bold uppercase rounded-full border ${reserva.estado === "cancelada" ? "bg-red-900/30 text-red-500 border-red-500" : "bg-green-900/30 text-green-500 border-green-500"}`}
                  >
                    {reserva.estado}
                  </span>
                </div>

                {reserva.estado !== "cancelada" &&
                  new Date(reserva.evento_fecha) > new Date() && (
                    <button
                      onClick={() => handleCancelar(reserva.id_reserva)}
                      className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold py-2 px-6 rounded-full transition"
                    >
                      Cancelar Reserva
                    </button>
                  )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MisReservas;

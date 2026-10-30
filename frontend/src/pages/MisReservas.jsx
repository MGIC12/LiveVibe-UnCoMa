import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";
import { formatearPrecio } from "../utils/formularios";

const MisReservas = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    cargarReservas();
  }, []);

  const cargarReservas = async () => {
    try {
      const res = await fetch(`${API}/api/reservas/mis-reservas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const res = await fetch(`${API}/api/reservas/${id}/cancelar`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
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

  const hoy = new Date().toLocaleDateString("en-CA");

  return (
    <div className="min-h-screen bg-tinta text-crema flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-28 pb-12 max-w-4xl">
        <h1 className="text-4xl font-black mb-8 text-crema">
          Mis <span className="text-fucsia">Entradas</span>
        </h1>

        {loading ? (
          <p className="text-center text-crema/60 animate-pulse">
            Cargando tus entradas...
          </p>
        ) : reservas.length === 0 ? (
          <div className="bg-crema/5 p-10 rounded-2xl text-center border border-crema/20">
            <p className="text-xl mb-4 text-crema/80">
              Aún no tienes entradas reservadas.
            </p>
            <Link
              to="/"
              className="inline-block bg-fucsia hover:bg-chicle text-tinta px-6 py-3 rounded-full font-bold transition-colors"
            >
              Explorar eventos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reservas.map((r) => {
              const eventoCancelado = r.evento_estado === "cancelado";
              const reservaCancelada = r.estado === "cancelada";
              const puedeCancelar =
                !reservaCancelada && !eventoCancelado && r.evento_fecha >= hoy;
              const fecha = new Date(`${r.evento_fecha}T00:00:00`);

              return (
                <div
                  key={r.id_reserva}
                  className={`bg-crema/5 border border-crema/20 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 ${
                    eventoCancelado || reservaCancelada ? "opacity-80" : ""
                  }`}
                >
                  <div className="space-y-1 w-full">
                    <Link
                      to={`/evento/${r.id_evento}`}
                      className="text-2xl font-bold text-crema hover:text-cielo transition-colors"
                    >
                      {r.evento_nombre}
                    </Link>
                    <p className="text-crema/70 text-sm">
                      📍 {r.lugar}, {r.ciudad}
                    </p>
                    <p className="text-crema/70 font-medium capitalize">
                      📅{" "}
                      {fecha.toLocaleDateString("es-AR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {r.hora_apertura ? ` · ${r.hora_apertura} hs` : ""}
                    </p>
                    {r.precio != null && (
                      <p className="text-sol font-bold">
                        {formatearPrecio(r.precio)}
                      </p>
                    )}

                    <span
                      className={`inline-block mt-2 px-3 py-1 text-xs font-bold uppercase rounded-full border ${
                        eventoCancelado || reservaCancelada
                          ? "bg-mandarina/20 text-mandarina border-mandarina"
                          : "bg-cielo/20 text-cielo border-cielo"
                      }`}
                    >
                      {eventoCancelado ? "Evento cancelado" : r.estado}
                    </span>

                    {eventoCancelado && (
                      <p className="text-mandarina text-sm pt-1">
                        El artista canceló este evento.
                      </p>
                    )}
                  </div>

                  {puedeCancelar && (
                    <button
                      onClick={() => handleCancelar(r.id_reserva)}
                      className="shrink-0 border border-mandarina text-mandarina hover:bg-mandarina hover:text-tinta font-bold py-2 px-6 rounded-full transition"
                    >
                      Cancelar Reserva
                    </button>
                  )}
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
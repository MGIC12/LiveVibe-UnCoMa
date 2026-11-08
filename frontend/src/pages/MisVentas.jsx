import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../../context/AuthContext";
import { ESTADOS_COMPRA, fechaLarga, pedirMerch } from "../utils/merch";
import { formatearPrecio } from "../utils/formularios";

// Feature 16: el artista ve lo que le compraron y marca cuándo lo envía
export default function MisVentas() {
  const { token } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setVentas(await pedirMerch("/compras/ventas", token));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enviar(venta) {
    try {
      await pedirMerch(`/compras/${venta.id_compra}/enviar`, token, {
        metodo: "PUT",
      });
      setError("");
    } catch (e) {
      setError(e.message);
    }
    cargar();
  }

  return (
    <div className="min-h-screen bg-tinta text-crema flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-28 pb-12 max-w-4xl">
        <h1 className="text-4xl font-black mb-8">
          Mis <span className="text-fucsia">Ventas</span>
        </h1>

        {error && (
          <p
            role="alert"
            className="mb-4 px-4 py-2 rounded-xl bg-mandarina/15 border border-mandarina text-mandarina text-sm"
          >
            {error}
          </p>
        )}

        {cargando ? (
          <p className="text-center text-crema/60 animate-pulse">
            Cargando tus ventas...
          </p>
        ) : ventas.length === 0 ? (
          <div className="bg-crema/5 p-10 rounded-2xl text-center border border-crema/20">
            <p className="text-xl text-crema/80">
              Todavía no vendiste merchandising.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {ventas.map((v) => {
              const estado = ESTADOS_COMPRA[v.estado];
              return (
                <article
                  key={v.id_compra}
                  className="bg-crema/5 border border-crema/20 p-6 rounded-2xl space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold">
                        <Link
                          to={`/usuario/${encodeURIComponent(v.nombre_usuario)}`}
                          className="hover:text-cielo"
                        >
                          {v.nombre_usuario}
                        </Link>
                      </p>
                      <p className="text-crema/60 text-sm">
                        Compra #{v.id_compra} · {fechaLarga(v.fecha)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${estado.clases}`}
                    >
                      {estado.texto}
                    </span>
                  </div>

                  <ul className="divide-y divide-crema/10">
                    {v.items.map((i, n) => (
                      <li key={n} className="flex justify-between py-2 text-sm">
                        <span>
                          {i.cantidad} × {i.nombre}
                        </span>
                        <span className="text-crema/70">
                          {formatearPrecio(i.precio_unitario * i.cantidad)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex justify-between items-center">
                    <span className="text-crema/70">Total</span>
                    <span className="font-black text-sol text-xl">
                      {formatearPrecio(v.total)}
                    </span>
                  </div>

                  {v.estado === "en_preparacion" && (
                    <button
                      onClick={() => enviar(v)}
                      className="bg-sol hover:bg-chicle text-tinta font-bold py-2 px-6 rounded-full transition"
                    >
                      Marcar como enviada
                    </button>
                  )}
                  {v.estado === "pago_pendiente" && (
                    <p className="text-crema/60 text-sm">
                      Esperando el pago del fan.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

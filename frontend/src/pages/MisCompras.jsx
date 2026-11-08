import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../../context/AuthContext";
import { ESTADOS_COMPRA, fechaLarga, pedirMerch } from "../utils/merch";
import { formatearPrecio } from "../utils/formularios";

// Feature 16: compras de merchandising del fan
export default function MisCompras() {
  const { token } = useAuth();
  const [compras, setCompras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setCompras(await pedirMerch("/compras/mias", token));
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

  async function cambiar(compra, accion, confirmacion) {
    if (confirmacion && !window.confirm(confirmacion)) return;
    try {
      await pedirMerch(`/compras/${compra.id_compra}/${accion}`, token, {
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
          Mis <span className="text-fucsia">Compras</span>
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
            Cargando tus compras...
          </p>
        ) : compras.length === 0 ? (
          <div className="bg-crema/5 p-10 rounded-2xl text-center border border-crema/20">
            <p className="text-xl mb-4 text-crema/80">
              Todavía no compraste merchandising. Lo encontrás en el perfil de
              cada artista.
            </p>
            <Link
              to="/"
              className="inline-block bg-fucsia hover:bg-chicle text-tinta px-6 py-3 rounded-full font-bold transition-colors"
            >
              Explorar artistas
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {compras.map((c) => {
              const estado = ESTADOS_COMPRA[c.estado];
              return (
                <article
                  key={c.id_compra}
                  className={`bg-crema/5 border border-crema/20 p-6 rounded-2xl space-y-3 ${
                    c.estado === "cancelada" ? "opacity-80" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-cielo">
                        <Link
                          to={`/artista/${encodeURIComponent(c.nombre_artista)}`}
                        >
                          {c.nombre_artistico}
                        </Link>
                      </p>
                      <p className="text-crema/60 text-sm">
                        Compra #{c.id_compra} · {fechaLarga(c.fecha)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${estado.clases}`}
                    >
                      {estado.texto}
                    </span>
                  </div>

                  <ul className="divide-y divide-crema/10">
                    {c.items.map((i, n) => (
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
                      {formatearPrecio(c.total)}
                    </span>
                  </div>

                  {c.estado === "pago_pendiente" && (
                    <p className="text-mandarina text-sm">
                      Tenés hasta el {fechaLarga(c.fecha_vencimiento)} para
                      pagar; después se cancela y los artículos vuelven al
                      stock.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 pt-1">
                    {c.estado === "pago_pendiente" && (
                      <button
                        onClick={() => cambiar(c, "pagar")}
                        className="bg-fucsia hover:bg-chicle text-tinta font-bold py-2 px-6 rounded-full transition"
                      >
                        Pagar
                      </button>
                    )}
                    {(c.estado === "pago_pendiente" ||
                      c.estado === "en_preparacion") && (
                      <button
                        onClick={() =>
                          cambiar(
                            c,
                            "cancelar",
                            "¿Seguro que querés cancelar esta compra?",
                          )
                        }
                        className="border border-mandarina text-mandarina hover:bg-mandarina hover:text-tinta font-bold py-2 px-6 rounded-full transition"
                      >
                        Cancelar compra
                      </button>
                    )}
                    {c.estado === "en_camino" && (
                      <button
                        onClick={() => cambiar(c, "recibida")}
                        className="bg-cielo hover:bg-crema text-tinta font-bold py-2 px-6 rounded-full transition"
                      >
                        Ya la recibí
                      </button>
                    )}
                  </div>
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

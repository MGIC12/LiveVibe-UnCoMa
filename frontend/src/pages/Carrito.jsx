import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ImagenArticulo from "../components/ImagenArticulo";
import { useAuth } from "../../context/AuthContext";
import { useCarrito } from "../../context/CarritoContext";
import { pedirMerch } from "../utils/merch";
import { formatearPrecio } from "../utils/formularios";

export default function Carrito() {
  const { token } = useAuth();
  const { refrescar } = useCarrito();
  const navigate = useNavigate();

  const [carrito, setCarrito] = useState({ items: [], total: 0, avisos: [] });
  const [seleccion, setSeleccion] = useState(new Set()); // ids de artículos marcados
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      const data = await pedirMerch("/carrito", token);
      setCarrito(data);
      // Se mantienen marcados solo los que siguen en el carrito
      setSeleccion((previa) => {
        const ids = new Set(data.items.map((i) => i.id_articulo));
        return new Set([...previa].filter((id) => ids.has(id)));
      });
      refrescar();
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

  async function cambiarCantidad(item, cantidad) {
    if (cantidad < 1) return;
    try {
      await pedirMerch(`/carrito/${item.id_articulo}`, token, {
        metodo: "PUT",
        cuerpo: { cantidad },
      });
      setError("");
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function quitar(item) {
    try {
      await pedirMerch(`/carrito/${item.id_articulo}`, token, {
        metodo: "DELETE",
      });
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function comprar(articulos) {
    const items = carrito.items.filter((i) =>
      articulos.includes(i.id_articulo),
    );
    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    if (
      !window.confirm(
        `¿Comprar ${items.length} artículo(s) por ${formatearPrecio(total)}?`,
      )
    ) {
      return;
    }
    try {
      await pedirMerch("/compras", token, {
        metodo: "POST",
        cuerpo: { desde_carrito: true, articulos },
      });
      refrescar();
      navigate("/mis-compras");
    } catch (e) {
      setError(e.message);
      cargar();
    }
  }

  function alternar(id) {
    setSeleccion((previa) => {
      const nueva = new Set(previa);
      if (nueva.has(id)) nueva.delete(id);
      else nueva.add(id);
      return nueva;
    });
  }

  const todos = carrito.items.map((i) => i.id_articulo);
  const totalSeleccion = carrito.items
    .filter((i) => seleccion.has(i.id_articulo))
    .reduce((s, i) => s + i.precio * i.cantidad, 0);

  return (
    <div className="min-h-screen bg-tinta text-crema flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-28 pb-12 max-w-4xl">
        <h1 className="text-4xl font-black mb-8">
          Mi <span className="text-fucsia">Carrito</span>
        </h1>

        {carrito.avisos.map((aviso) => (
          <p
            key={aviso}
            role="status"
            className="mb-3 px-4 py-2 rounded-xl bg-sol/15 border border-sol text-sol text-sm"
          >
            {aviso}
          </p>
        ))}
        {error && (
          <p
            role="alert"
            className="mb-3 px-4 py-2 rounded-xl bg-mandarina/15 border border-mandarina text-mandarina text-sm"
          >
            {error}
          </p>
        )}

        {cargando ? (
          <p className="text-center text-crema/60 animate-pulse">
            Cargando tu carrito...
          </p>
        ) : carrito.items.length === 0 ? (
          <div className="bg-crema/5 p-10 rounded-2xl text-center border border-crema/20">
            <p className="text-xl mb-4 text-crema/80">
              Tu carrito está vacío. Sumá merchandising desde el perfil de un
              artista.
            </p>
            <Link
              to="/"
              className="inline-block bg-fucsia hover:bg-chicle text-tinta px-6 py-3 rounded-full font-bold transition-colors"
            >
              Explorar artistas
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {carrito.items.map((i) => (
                <div
                  key={i.id_articulo}
                  className="bg-crema/5 border border-crema/20 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <label className="flex items-center gap-3 sm:gap-4 flex-grow cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seleccion.has(i.id_articulo)}
                      onChange={() => alternar(i.id_articulo)}
                      aria-label={`Seleccionar ${i.nombre}`}
                      className="w-5 h-5 accent-fucsia shrink-0"
                    />
                    <ImagenArticulo
                      url={i.imagen_url}
                      descripcion={i.imagen_descripcion || i.nombre}
                      clases="w-20 h-20 rounded-xl shrink-0"
                    />
                    <span>
                      <span className="block text-xs font-bold uppercase tracking-wider text-cielo">
                        {i.nombre_artistico}
                      </span>
                      <span className="block font-bold text-lg leading-tight">
                        {i.nombre}
                      </span>
                      <span className="block text-sol font-bold">
                        {formatearPrecio(i.precio)}
                      </span>
                    </span>
                  </label>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div
                      className="flex items-center gap-2"
                      aria-label="Cantidad"
                    >
                      <button
                        onClick={() => cambiarCantidad(i, i.cantidad - 1)}
                        disabled={i.cantidad <= 1}
                        aria-label="Quitar una unidad"
                        className="w-8 h-8 rounded-full border border-crema/30 hover:border-fucsia disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-bold">
                        {i.cantidad}
                      </span>
                      <button
                        onClick={() => cambiarCantidad(i, i.cantidad + 1)}
                        disabled={i.cantidad >= i.stock}
                        aria-label="Agregar una unidad"
                        className="w-8 h-8 rounded-full border border-crema/30 hover:border-fucsia disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-black w-28 text-right">
                      {formatearPrecio(i.precio * i.cantidad)}
                    </p>
                    <button
                      onClick={() => quitar(i)}
                      className="text-sm text-mandarina hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-crema/5 border border-crema/20 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between text-lg">
                <span className="text-crema/70">Total del carrito</span>
                <span className="font-black text-sol">
                  {formatearPrecio(carrito.total)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => comprar([...seleccion])}
                  disabled={seleccion.size === 0}
                  className="flex-1 border border-fucsia text-fucsia hover:bg-fucsia hover:text-tinta font-bold py-3 rounded-full transition disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-fucsia"
                >
                  Comprar seleccionados
                  {seleccion.size > 0
                    ? ` (${formatearPrecio(totalSeleccion)})`
                    : ""}
                </button>
                <button
                  onClick={() => comprar(todos)}
                  className="flex-1 bg-fucsia hover:bg-chicle text-tinta font-bold py-3 rounded-full transition"
                >
                  Comprar todo
                </button>
              </div>
              <p className="text-xs text-crema/50">
                Si elegís artículos de varios artistas, se arma una compra por
                cada artista.
              </p>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

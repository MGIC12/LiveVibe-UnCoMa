import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ImagenArticulo from "./ImagenArticulo";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useCarrito } from "../../context/CarritoContext";
import { pedirMerch } from "../utils/merch";
import { formatearPrecio } from "../utils/formularios";

const MAX_POR_CLIC = 10;

// Si el artista no tiene artículos, no muestra nada.
export default function MerchArtista({ artista }) {
  const { token, usuario } = useAuth();
  const toast = useToast();
  const { refrescar } = useCarrito();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const esFan = usuario?.rol === "fan";

  const [articulos, setArticulos] = useState([]);
  const [cantidades, setCantidades] = useState({}); // id_articulo -> cantidad elegida
  const [mensajes, setMensajes] = useState({}); // id_articulo -> { ok, texto }

  async function cargar() {
    try {
      setArticulos(
        await pedirMerch(`/merch?artista=${encodeURIComponent(artista)}`),
      );
    } catch {
      setArticulos([]);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artista]);

  const hayArticulos = articulos.length > 0;
  useEffect(() => {
    if (hash === "#merch" && hayArticulos) {
      document
        .getElementById("merch")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hash, hayArticulos]);

  const esMio =
    usuario?.rol === "artista" && usuario.nombre_usuario === artista;

  if (articulos.length === 0) {
    // El dueño del perfil ve cómo empezar; el resto, nada
    return esMio ? (
      <section className="bg-crema/5 border border-crema/20 rounded-2xl p-6 text-center space-y-3">
        <p className="text-crema/80">Todavía no cargaste merchandising.</p>
        <Link
          to="/mi-merch"
          className="inline-block bg-fucsia hover:bg-chicle text-tinta px-6 py-2.5 rounded-full font-bold transition"
        >
          Cargar mi primer artículo
        </Link>
      </section>
    ) : null;
  }

  const cantidadDe = (a) =>
    Math.min(cantidades[a.id_articulo] ?? 1, a.stock, MAX_POR_CLIC);
  const avisar = (id, ok, texto) =>
    setMensajes((m) => ({ ...m, [id]: { ok, texto } }));

  async function agregar(a) {
    try {
      await pedirMerch("/carrito", token, {
        metodo: "POST",
        cuerpo: { id_articulo: a.id_articulo, cantidad: cantidadDe(a) },
      });
      toast.exito(`Agregamos "${a.nombre}" al carrito.`);
      refrescar();
    } catch (e) {
      avisar(a.id_articulo, false, e.message);
    }
  }

  async function comprarAhora(a) {
    const n = cantidadDe(a);
    if (
      !window.confirm(
        `¿Comprar ${n} × ${a.nombre} por ${formatearPrecio(a.precio * n)}?`,
      )
    ) {
      return;
    }
    try {
      await pedirMerch("/compras", token, {
        metodo: "POST",
        cuerpo: { id_articulo: a.id_articulo, cantidad: n },
      });
      navigate("/mis-compras");
    } catch (e) {
      avisar(a.id_articulo, false, e.message);
      cargar(); // el stock pudo haber cambiado
    }
  }

  return (
    <section id="merch" className="space-y-3 scroll-mt-24">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-black text-crema">
          <span className="text-fucsia">Merch</span> oficial{" "}
          <span className="text-base font-bold text-crema/60">
            ({articulos.length})
          </span>
        </h2>
        {esMio && (
          <Link
            to="/mi-merch"
            className="text-sm font-bold text-cielo hover:text-crema"
          >
            Administrar mi merch
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {articulos.map((a) => {
          const agotado = a.stock === 0;
          const msg = mensajes[a.id_articulo];
          return (
            <article
              key={a.id_articulo}
              className={`bg-crema/5 border border-crema/20 rounded-2xl overflow-hidden flex flex-col ${
                agotado ? "opacity-70" : ""
              }`}
            >
              <ImagenArticulo
                url={a.imagen_url}
                descripcion={a.imagen_descripcion || a.nombre}
                clases="w-full aspect-video"
              />
              <div className="p-4 flex flex-col gap-2 flex-grow">
                <h3 className="text-lg font-bold leading-tight">{a.nombre}</h3>
                {a.descripcion && (
                  <p className="text-sm text-crema/70 flex-grow">
                    {a.descripcion}
                  </p>
                )}
                <p className="text-sol font-black text-xl">
                  {formatearPrecio(a.precio)}
                </p>
                <p
                  className={`text-xs font-bold ${
                    agotado
                      ? "text-mandarina"
                      : a.stock <= 5
                        ? "text-sol"
                        : "text-crema/60"
                  }`}
                >
                  {agotado
                    ? "Agotado"
                    : a.stock <= 5
                      ? `¡Quedan ${a.stock}!`
                      : `${a.stock} disponibles`}
                </p>

                {esFan && !agotado && (
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center gap-2 text-sm text-crema/80">
                      Cantidad
                      <select
                        value={cantidadDe(a)}
                        onChange={(e) =>
                          setCantidades((c) => ({
                            ...c,
                            [a.id_articulo]: Number(e.target.value),
                          }))
                        }
                        className="px-3 py-1 rounded-full bg-crema/10 border border-crema/25 text-crema"
                      >
                        {Array.from(
                          { length: Math.min(a.stock, MAX_POR_CLIC) },
                          (_, i) => i + 1,
                        ).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => agregar(a)}
                        className="flex-1 border border-fucsia text-fucsia hover:bg-fucsia hover:text-tinta font-bold py-2 rounded-full transition text-sm"
                      >
                        Al carrito
                      </button>
                      <button
                        onClick={() => comprarAhora(a)}
                        className="flex-1 bg-fucsia hover:bg-chicle text-tinta font-bold py-2 rounded-full transition text-sm"
                      >
                        Comprar ahora
                      </button>
                    </div>
                  </div>
                )}

                {!usuario && !agotado && (
                  <Link
                    to="/login"
                    className="mt-2 text-center text-sm font-bold text-fucsia hover:text-crema"
                  >
                    Iniciá sesión para comprar
                  </Link>
                )}

                {msg && (
                  <p
                    role="status"
                    className={`text-xs font-bold ${msg.ok ? "text-cielo" : "text-mandarina"}`}
                  >
                    {msg.texto}
                    {msg.ok && (
                      <>
                        {" · "}
                        <Link to="/carrito" className="underline">
                          Ver carrito
                        </Link>
                      </>
                    )}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

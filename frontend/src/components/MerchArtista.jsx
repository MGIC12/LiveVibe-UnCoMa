import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ImagenArticulo from "./ImagenArticulo";
import Paginacion from "./Paginacion";
import { usePaginacion } from "../utils/paginacion";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useCarrito } from "../../context/CarritoContext";
import { pedirMerch } from "../utils/merch";
import { formatearPrecio } from "../utils/formularios";

const MAX_POR_CLIC = 10;
const POR_PAGINA = 8; // 4 columnas x 2 filas en pantallas grandes

const ORDENES = {
  destacados: { texto: "Destacados", fn: null },
  menor: { texto: "Menor precio", fn: (a, b) => a.precio - b.precio },
  mayor: { texto: "Mayor precio", fn: (a, b) => b.precio - a.precio },
  nombre: {
    texto: "Nombre A–Z",
    fn: (a, b) => a.nombre.localeCompare(b.nombre, "es"),
  },
};

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
  const [orden, setOrden] = useState("destacados");
  const [soloDisponibles, setSoloDisponibles] = useState(false);

  // Lo que se muestra: filtrado, ordenado y repartido en páginas
  const filtrados = useMemo(() => {
    let lista = soloDisponibles
      ? articulos.filter((a) => a.stock > 0)
      : articulos;
    const fn = ORDENES[orden].fn;
    if (fn) lista = [...lista].sort(fn);
    return lista;
  }, [articulos, orden, soloDisponibles]);
  const pag = usePaginacion(filtrados, POR_PAGINA);

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
    <section id="merch" className="space-y-4 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-black text-crema">
          <span className="text-fucsia">Merch</span> oficial{" "}
          <span className="text-base font-bold text-crema/60">
            ({articulos.length})
          </span>
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2 text-crema/80 cursor-pointer">
            <input
              type="checkbox"
              checked={soloDisponibles}
              onChange={(e) => {
                setSoloDisponibles(e.target.checked);
                pag.setPagina(1);
              }}
              className="accent-fucsia w-4 h-4"
            />
            Solo disponibles
          </label>
          <label className="flex items-center gap-2 text-crema/80">
            Ordenar
            <select
              value={orden}
              onChange={(e) => {
                setOrden(e.target.value);
                pag.setPagina(1);
              }}
              className="px-3 py-1.5 rounded-full bg-crema/10 border border-crema/25 text-crema"
            >
              {Object.entries(ORDENES).map(([id, o]) => (
                <option key={id} value={id}>
                  {o.texto}
                </option>
              ))}
            </select>
          </label>
          {esMio && (
            <Link
              to="/mi-merch"
              className="font-bold text-cielo hover:text-crema"
            >
              Administrar mi merch
            </Link>
          )}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <p className="bg-crema/5 border border-crema/20 rounded-2xl p-8 text-center text-crema/70">
          No hay artículos disponibles en este momento.
        </p>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {pag.visibles.map((a) => {
            const agotado = a.stock === 0;
            const msg = mensajes[a.id_articulo];
            return (
              <article
                key={a.id_articulo}
                className={`bg-crema/5 border border-crema/20 rounded-2xl overflow-hidden flex flex-col transition hover:border-fucsia/50 ${
                  agotado ? "opacity-70" : ""
                }`}
              >
                <div className="relative">
                  <ImagenArticulo
                    url={a.imagen_url}
                    descripcion={a.imagen_descripcion || a.nombre}
                    clases="w-full aspect-square"
                  />
                  {(agotado || a.stock <= 5) && (
                    <span
                      className={`absolute top-2 left-2 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-tinta/85 border ${
                        agotado
                          ? "text-mandarina border-mandarina"
                          : "text-sol border-sol"
                      }`}
                    >
                      {agotado ? "Agotado" : `¡Quedan ${a.stock}!`}
                    </span>
                  )}
                </div>
                <div className="p-3 sm:p-4 flex flex-col gap-2 flex-grow">
                  <h3 className="font-bold leading-tight line-clamp-2">
                    {a.nombre}
                  </h3>
                  {a.descripcion && (
                    <p className="text-xs sm:text-sm text-crema/70 line-clamp-2">
                      {a.descripcion}
                    </p>
                  )}
                  <p className="text-sol font-black text-lg sm:text-xl mt-auto">
                    {formatearPrecio(a.precio)}
                  </p>

                  {esFan && !agotado && (
                    <div className="space-y-2">
                      <label className="flex items-center justify-between gap-2 text-sm text-crema/80">
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
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => comprarAhora(a)}
                          className="w-full bg-fucsia hover:bg-chicle text-tinta font-bold py-2 rounded-full transition text-sm"
                        >
                          Comprar ahora
                        </button>
                        <button
                          onClick={() => agregar(a)}
                          className="w-full border border-fucsia text-fucsia hover:bg-fucsia hover:text-tinta font-bold py-2 rounded-full transition text-sm"
                        >
                          Al carrito
                        </button>
                      </div>
                    </div>
                  )}

                  {!usuario && !agotado && (
                    <Link
                      to="/login"
                      className="text-center text-sm font-bold text-fucsia hover:text-crema"
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
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Paginacion
        pagina={pag.pagina}
        total={pag.total}
        desde={pag.desde}
        hasta={pag.hasta}
        cantidad={filtrados.length}
        etiqueta="artículos"
        onCambiar={pag.setPagina}
        anclaId="merch"
      />
    </section>
  );
}

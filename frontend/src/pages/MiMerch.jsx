import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ImagenArticulo from "../components/ImagenArticulo";
import { useAuth } from "../../context/AuthContext";
import { pedirMerch } from "../utils/merch";
import { urlImagen } from "../utils/api";
import {
  formatearPrecio,
  TIPOS_IMAGEN,
  MAX_BYTES_IMAGEN,
} from "../utils/formularios";

const VACIO = { nombre: "", descripcion: "", precio: "", stock: "" };
const CAMPO =
  "w-full px-4 py-3 rounded-xl bg-crema/10 border border-crema/25 text-crema placeholder-crema/50 focus:outline-none focus:ring-2 focus:ring-cielo text-sm";

// Features 15 y 16: el artista carga, edita y elimina su merchandising
export default function MiMerch() {
  const { token, usuario } = useAuth();
  const inputRef = useRef(null);

  const [articulos, setArticulos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [datos, setDatos] = useState(VACIO);
  const [editando, setEditando] = useState(null); // el artículo que se está editando, o null
  const [imagen, setImagen] = useState(null); // foto nueva elegida: { archivo, previa }
  const [quitarFoto, setQuitarFoto] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    try {
      setArticulos(await pedirMerch("/merch/mios", token));
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

  const cambiar = (campo) => (e) =>
    setDatos((d) => ({ ...d, [campo]: e.target.value }));

  function elegirImagen(e) {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!archivo) return;
    if (!TIPOS_IMAGEN.includes(archivo.type)) {
      return setError("Elegí una imagen JPG, PNG o WebP");
    }
    if (archivo.size > MAX_BYTES_IMAGEN) {
      return setError("La imagen no puede superar los 2 MB");
    }
    setError("");
    setQuitarFoto(false);
    const lector = new FileReader();
    lector.onload = () => setImagen({ archivo, previa: lector.result });
    lector.readAsDataURL(archivo);
  }

  function limpiar() {
    setDatos(VACIO);
    setEditando(null);
    setImagen(null);
    setQuitarFoto(false);
    setError("");
  }

  function empezarEdicion(a) {
    setEditando(a);
    setDatos({
      nombre: a.nombre,
      descripcion: a.descripcion ?? "",
      precio: String(a.precio),
      stock: String(a.stock),
    });
    setImagen(null);
    setQuitarFoto(false);
    setError("");
    setAviso("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function guardar(e) {
    e.preventDefault();
    setError("");
    setAviso("");
    setGuardando(true);
    try {
      // Con una foto de por medio, los datos viajan como formulario (no como JSON)
      const cuerpo = new FormData();
      cuerpo.append("nombre", datos.nombre);
      cuerpo.append("descripcion", datos.descripcion);
      cuerpo.append("precio", datos.precio);
      cuerpo.append("stock", datos.stock);
      if (imagen) cuerpo.append("imagen", imagen.archivo);
      if (quitarFoto) cuerpo.append("quitar_imagen", "true");

      await pedirMerch(
        editando ? `/merch/${editando.id_articulo}` : "/merch",
        token,
        {
          metodo: editando ? "PUT" : "POST",
          cuerpo,
        },
      );
      setAviso(
        editando ? "Cambios guardados." : "Artículo publicado en tu perfil.",
      );
      limpiar();
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(a) {
    if (
      !window.confirm(
        `¿Eliminar "${a.nombre}"? Se quita de tu perfil y de los carritos. Las compras ya hechas se conservan.`,
      )
    ) {
      return;
    }
    try {
      await pedirMerch(`/merch/${a.id_articulo}`, token, { metodo: "DELETE" });
      if (editando?.id_articulo === a.id_articulo) limpiar();
      setAviso("Artículo eliminado.");
      setError("");
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  const fotoActual =
    editando && !quitarFoto && !imagen ? editando.imagen_url : null;
  const previa = imagen?.previa ?? urlImagen(fotoActual);
  const rutaPerfil = `/artista/${encodeURIComponent(usuario.nombre_usuario)}`;

  return (
    <div className="min-h-screen bg-tinta text-crema flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-28 pb-12 max-w-3xl space-y-8">
        <div>
          <h1 className="text-4xl font-black mb-2">
            Mi <span className="text-fucsia">Merch</span>
          </h1>
          <p className="text-crema/70">
            Cargá lo que vendés: los fans lo ven en{" "}
            <Link
              to={rutaPerfil}
              className="text-cielo hover:text-crema font-bold"
            >
              tu perfil
            </Link>
            .
          </p>
        </div>

        {/* Formulario: crea un artículo, o edita el elegido */}
        <form
          onSubmit={guardar}
          className="bg-crema/5 border border-crema/20 rounded-2xl p-6 space-y-4"
        >
          <h2 className="text-xs font-bold text-cielo uppercase tracking-wider">
            {editando ? `Editando: ${editando.nombre}` : "Nuevo artículo"}
          </h2>

          <div>
            <label
              htmlFor="merch-nombre"
              className="block text-sm font-bold text-crema/80 mb-1"
            >
              Nombre
            </label>
            <input
              id="merch-nombre"
              value={datos.nombre}
              onChange={cambiar("nombre")}
              maxLength={120}
              required
              placeholder="Ej.: Remera negra con logo"
              className={CAMPO}
            />
          </div>

          <div>
            <label
              htmlFor="merch-desc"
              className="block text-sm font-bold text-crema/80 mb-1"
            >
              Descripción{" "}
              <span className="font-normal text-crema/50">(opcional)</span>
            </label>
            <textarea
              id="merch-desc"
              value={datos.descripcion}
              onChange={cambiar("descripcion")}
              maxLength={500}
              rows={3}
              placeholder="Talles, materiales, detalles..."
              className={`${CAMPO} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="merch-precio"
                className="block text-sm font-bold text-crema/80 mb-1"
              >
                Precio ($)
              </label>
              <input
                id="merch-precio"
                type="number"
                min="0"
                step="0.01"
                value={datos.precio}
                onChange={cambiar("precio")}
                required
                className={CAMPO}
              />
            </div>
            <div>
              <label
                htmlFor="merch-stock"
                className="block text-sm font-bold text-crema/80 mb-1"
              >
                Stock (unidades)
              </label>
              <input
                id="merch-stock"
                type="number"
                min="0"
                step="1"
                value={datos.stock}
                onChange={cambiar("stock")}
                required
                className={CAMPO}
              />
            </div>
          </div>

          {/* Foto */}
          <div className="space-y-2">
            <p className="text-sm font-bold text-crema/80">
              Foto{" "}
              <span className="font-normal text-crema/50">
                (opcional, JPG, PNG o WebP de hasta 2 MB)
              </span>
            </p>
            {previa && (
              <img
                src={previa}
                alt="Vista previa de la foto del artículo"
                className="max-h-48 rounded-xl border border-crema/20"
              />
            )}
            <div className="flex flex-wrap gap-3">
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={elegirImagen}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => inputRef.current.click()}
                className="px-4 py-1.5 rounded-full border border-crema/30 text-crema/80 hover:border-cielo hover:text-cielo text-sm font-bold transition"
              >
                📷 {previa ? "Cambiar foto" : "Agregar foto"}
              </button>
              {(imagen || fotoActual) && (
                <button
                  type="button"
                  onClick={() => {
                    setImagen(null);
                    if (editando?.imagen_url) setQuitarFoto(true);
                  }}
                  className="px-4 py-1.5 rounded-full border border-mandarina/60 text-mandarina hover:bg-mandarina hover:text-tinta text-sm font-bold transition"
                >
                  Quitar foto
                </button>
              )}
            </div>
          </div>

          {error && (
            <p role="alert" className="text-mandarina text-sm">
              {error}
            </p>
          )}
          {aviso && (
            <p role="status" className="text-cielo text-sm font-bold">
              {aviso}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="px-6 py-2.5 rounded-full bg-fucsia hover:bg-chicle text-tinta font-bold disabled:opacity-50 transition"
            >
              {guardando
                ? "Guardando..."
                : editando
                  ? "Guardar cambios"
                  : "Publicar artículo"}
            </button>
            {editando && (
              <button
                type="button"
                onClick={limpiar}
                className="px-6 py-2.5 rounded-full border border-crema/30 text-crema/80 hover:border-crema font-bold transition"
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>

        {/* Lista */}
        <section className="space-y-3">
          <h2 className="text-2xl font-black">
            Mis <span className="text-fucsia">artículos</span>{" "}
            <span className="text-base font-bold text-crema/60">
              ({articulos.length})
            </span>
          </h2>

          {cargando ? (
            <p className="text-crema/60 animate-pulse">Cargando...</p>
          ) : articulos.length === 0 ? (
            <p className="bg-crema/5 border border-crema/20 rounded-2xl p-6 text-center text-crema/70">
              Todavía no cargaste ningún artículo.
            </p>
          ) : (
            <ul className="space-y-3">
              {articulos.map((a) => (
                <li
                  key={a.id_articulo}
                  className={`bg-crema/5 border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${
                    editando?.id_articulo === a.id_articulo
                      ? "border-cielo"
                      : "border-crema/20"
                  }`}
                >
                  <ImagenArticulo
                    url={a.imagen_url}
                    descripcion={a.imagen_descripcion || a.nombre}
                    clases="w-20 h-20 rounded-xl shrink-0"
                  />
                  <div className="flex-grow min-w-0">
                    <p className="font-bold text-lg leading-tight truncate">
                      {a.nombre}
                    </p>
                    <p className="text-sol font-bold">
                      {formatearPrecio(a.precio)}
                    </p>
                    <p
                      className={`text-xs font-bold ${
                        a.stock === 0 ? "text-mandarina" : "text-crema/60"
                      }`}
                    >
                      {a.stock === 0 ? "Agotado" : `Stock: ${a.stock}`}
                    </p>
                  </div>
                  <div className="flex gap-3 text-sm font-bold">
                    <button
                      onClick={() => empezarEdicion(a)}
                      className="text-cielo hover:text-crema"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminar(a)}
                      className="text-mandarina hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

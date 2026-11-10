import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Avatar from "../components/Avatar";
import { Bloque } from "../components/Esqueleto";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { API } from "../utils/api";

const MAX_GENEROS = 8;

// Bienvenida de fans nuevos en dos pasos: 1) géneros favoritos, 2) artistas para seguir.
// Lo que se elige alimenta las recomendaciones del inicio. También se puede volver a entrar
// desde el perfil para cambiar los gustos.
export default function Bienvenida() {
  const { token, usuario } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [paso, setPaso] = useState(1);
  const [opciones, setOpciones] = useState([]);
  const [elegidos, setElegidos] = useState([]);
  const [artistas, setArtistas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const cabeceras = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    let activo = true;
    fetch(`${API}/api/preferencias`, { headers: cabeceras })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("No se pudieron cargar los géneros"))))
      .then((data) => {
        if (!activo) return;
        setOpciones(data.opciones ?? []);
        setElegidos(data.generos ?? []);
      })
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const alternar = (nombre) => {
    setError("");
    setElegidos((actuales) => {
      if (actuales.includes(nombre)) return actuales.filter((g) => g !== nombre);
      if (actuales.length >= MAX_GENEROS) {
        setError(`Podés elegir hasta ${MAX_GENEROS} géneros.`);
        return actuales;
      }
      return [...actuales, nombre];
    });
  };

  // Paso 1 -> guarda los géneros y pasa a los artistas
  async function guardarGeneros() {
    setGuardando(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/preferencias`, {
        method: "PUT",
        headers: cabeceras,
        body: JSON.stringify({ generos: elegidos }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudieron guardar tus géneros");

      const sugeridos = await fetch(`${API}/api/preferencias/artistas`, { headers: cabeceras });
      setArtistas(sugeridos.ok ? await sugeridos.json() : []);
      setPaso(2);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  // Seguir o dejar de seguir a un artista (la misma ruta que usa el botón del perfil)
  async function alternarSeguimiento(a) {
    const quiere = !a.sigo;
    setArtistas((lista) =>
      lista.map((x) => (x.nombre_usuario === a.nombre_usuario ? { ...x, sigo: quiere } : x)),
    );
    try {
      const res = await fetch(
        `${API}/api/usuarios/${encodeURIComponent(a.nombre_usuario)}/seguimiento`,
        { method: "PUT", headers: cabeceras, body: JSON.stringify({ sigue: quiere }) },
      );
      if (!res.ok) throw new Error();
    } catch {
      // Si falló, el botón vuelve a como estaba
      setArtistas((lista) =>
        lista.map((x) => (x.nombre_usuario === a.nombre_usuario ? { ...x, sigo: !quiere } : x)),
      );
      toast.error("No se pudo actualizar el seguimiento. Probá de nuevo.");
    }
  }

  function terminar() {
    toast.exito("¡Listo! Con esto armamos tus recomendaciones. ✨");
    navigate("/");
  }

  const siguiendo = artistas.filter((a) => a.sigo).length;

  return (
    <div className="min-h-screen bg-tinta text-crema flex flex-col">
      <Navbar />
      <main className="flex-grow w-full max-w-3xl mx-auto px-4 pt-28 pb-16">
        <p className="text-xs font-bold text-cielo uppercase tracking-wider mb-3">
          Paso {paso} de 2
        </p>
        <div className="h-1.5 rounded-full bg-crema/10 mb-8 overflow-hidden" aria-hidden="true">
          <div
            className="h-full bg-fucsia transition-all duration-500"
            style={{ width: paso === 1 ? "50%" : "100%" }}
          />
        </div>

        {paso === 1 ? (
          <section>
            <h1 className="text-3xl sm:text-4xl font-black mb-2">
              ¡Te damos la <span className="text-fucsia">bienvenida</span>, {usuario?.nombre_usuario}!
            </h1>
            <p className="text-crema/70 mb-8">
              Contanos qué música te gusta y te recomendamos shows a tu medida. Elegí hasta{" "}
              {MAX_GENEROS} géneros.
            </p>

            {cargando ? (
              <div className="flex flex-wrap gap-3" role="status" aria-busy="true">
                <span className="sr-only">Cargando géneros...</span>
                {[28, 20, 24, 32, 22, 26].map((ancho, i) => (
                  <Bloque key={i} className="h-10 rounded-full" style={{ width: `${ancho * 4}px` }} />
                ))}
              </div>
            ) : opciones.length === 0 ? (
              <p className="text-crema/60">
                Todavía no hay géneros cargados. Podés seguir con los artistas.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {opciones.map((o) => {
                  const activo = elegidos.includes(o.nombre);
                  return (
                    <button
                      key={o.nombre}
                      type="button"
                      aria-pressed={activo}
                      onClick={() => alternar(o.nombre)}
                      className={`px-5 py-2.5 rounded-full text-sm font-bold border transition-all duration-200 ${
                        activo
                          ? "bg-fucsia text-tinta border-fucsia shadow-[0_0_15px_rgba(255,46,147,0.35)] scale-105"
                          : "bg-neutral-800 text-crema/80 border-crema/20 hover:border-crema/50 hover:text-crema"
                      }`}
                    >
                      {activo ? "✓ " : ""}
                      {o.nombre}
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-sm text-crema/50 mt-4">
              {elegidos.length} de {MAX_GENEROS} elegidos
            </p>
            {error && (
              <p role="alert" className="mt-3 text-sm text-mandarina">
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-4 mt-10">
              <Link to="/" className="text-center text-crema/60 hover:text-crema text-sm font-semibold">
                Ahora no
              </Link>
              <button
                type="button"
                onClick={guardarGeneros}
                disabled={guardando || cargando}
                className="sm:ml-auto bg-fucsia hover:bg-chicle text-tinta font-black py-3 px-10 rounded-full transition disabled:opacity-50"
              >
                {guardando ? "Guardando..." : elegidos.length ? "Siguiente" : "Seguir sin elegir"}
              </button>
            </div>
          </section>
        ) : (
          <section>
            <h1 className="text-3xl sm:text-4xl font-black mb-2">
              Seguí a tus <span className="text-fucsia">artistas</span>
            </h1>
            <p className="text-crema/70 mb-8">
              Te avisamos cuando anuncien shows y aparecen en tu inicio. Primero van los de los géneros
              que elegiste.
            </p>

            {artistas.length === 0 ? (
              <p className="text-crema/60">Todavía no hay artistas para sugerirte.</p>
            ) : (
              <ul className="grid sm:grid-cols-2 gap-4">
                {artistas.map((a) => (
                  <li
                    key={a.nombre_usuario}
                    className="flex items-center gap-3 bg-crema/5 border border-crema/15 rounded-2xl p-4"
                  >
                    <Avatar
                      usuario={{ nombre_usuario: a.nombre_artistico, foto_url: a.foto_url }}
                      clases="w-12 h-12 text-lg"
                      fondo="bg-fucsia/30"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold truncate">{a.nombre_artistico}</p>
                      <p className="text-xs text-crema/60 truncate">
                        {[
                          a.genero,
                          `${a.seguidores} ${a.seguidores === 1 ? "seguidor" : "seguidores"}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-pressed={a.sigo}
                      onClick={() => alternarSeguimiento(a)}
                      className={`shrink-0 text-sm font-bold py-2 px-4 rounded-full border transition ${
                        a.sigo
                          ? "bg-crema/10 border-crema/30 text-crema hover:border-mandarina hover:text-mandarina"
                          : "bg-fucsia border-fucsia text-tinta hover:bg-chicle"
                      }`}
                    >
                      {a.sigo ? "Siguiendo ✓" : "Seguir"}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-4 mt-10">
              <button
                type="button"
                onClick={() => setPaso(1)}
                className="text-crema/60 hover:text-crema text-sm font-semibold"
              >
                ← Volver
              </button>
              <button
                type="button"
                onClick={terminar}
                className="sm:ml-auto bg-fucsia hover:bg-chicle text-tinta font-black py-3 px-10 rounded-full transition"
              >
                {siguiendo > 0 ? `Listo, sigo a ${siguiendo}` : "Terminar"}
              </button>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

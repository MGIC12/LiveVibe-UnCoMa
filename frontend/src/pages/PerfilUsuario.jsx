import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CabeceraPerfil from "../components/CabeceraPerfil";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";

// Marco común: Navbar, contenido y Footer
function Marco({ children }) {
  return (
    <div className="min-h-screen bg-tinta text-crema font-sans flex flex-col justify-between">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-28 pb-16 w-full max-w-3xl space-y-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default function PerfilUsuario() {
  const { usuario: nombreUsuario } = useParams();
  const { usuario } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [estado, setEstado] = useState("cargando"); // cargando | ok | noEncontrado | error

  useEffect(() => {
    let activo = true;
    fetch(`${API}/api/usuarios/${encodeURIComponent(nombreUsuario)}`)
      .then(async (res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Error al cargar el perfil");
        return res.json();
      })
      .then((data) => {
        if (!activo) return;
        if (data) {
          setPerfil(data);
          setEstado("ok");
        } else {
          setEstado("noEncontrado");
        }
      })
      .catch(() => {
        if (activo) setEstado("error");
      });
    return () => {
      activo = false;
    };
  }, [nombreUsuario]);

  if (estado === "cargando") {
    return (
      <Marco>
        <p className="text-center text-crema/70 py-20 animate-pulse">Cargando perfil...</p>
      </Marco>
    );
  }

  if (estado !== "ok") {
    return (
      <Marco>
        <div className="text-center bg-crema/5 border border-crema/20 rounded-2xl p-10 space-y-4">
          <p className="text-crema/80">
            {estado === "noEncontrado"
              ? "Este usuario no existe."
              : "No pudimos cargar el perfil. Probá de nuevo en unos minutos."}
          </p>
          <Link to="/" className="inline-block text-cielo hover:text-crema font-bold">
            Volver al inicio
          </Link>
        </div>
      </Marco>
    );
  }

  // Los artistas tienen su propia página
  if (perfil.rol === "artista") {
    return <Navigate to={`/artista/${encodeURIComponent(perfil.nombre_usuario)}`} replace />;
  }

  const esMiPerfil = usuario?.nombre_usuario === perfil.nombre_usuario;
  const miembroDesde = new Date(perfil.fecha_alta).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  return (
    <Marco>
      <CabeceraPerfil
        avatar={perfil}
        titulo={perfil.nombre_usuario}
        subtitulo={`Miembro desde ${miembroDesde}`}
        etiquetas={[{ texto: "Fan", destacada: true }]}
        banner="bg-cielo"
      >
        {esMiPerfil && (
          <Link
            to="/perfil"
            className="inline-block px-6 py-2.5 rounded-full border border-cielo text-cielo hover:bg-cielo hover:text-tinta text-sm font-bold transition"
          >
            Editar mi perfil
          </Link>
        )}
      </CabeceraPerfil>

      <section className="bg-crema/5 border border-crema/20 rounded-2xl p-6">
        <h2 className="text-xs font-bold text-cielo uppercase tracking-wider mb-2">Biografía</h2>
        <p className="whitespace-pre-line text-crema/90 leading-relaxed">
          {perfil.biografia || (
            <span className="text-crema/40 italic">Todavía no escribió su biografía.</span>
          )}
        </p>
      </section>

      <section className="bg-crema/5 border border-crema/20 rounded-2xl p-6">
        <h2 className="text-xs font-bold text-cielo uppercase tracking-wider mb-2">
          Canción favorita
        </h2>
        <p className="text-crema/90 font-medium">
          {perfil.cancion_favorita ? (
            <>🎵 {perfil.cancion_favorita}</>
          ) : (
            <span className="text-crema/40 italic font-normal">
              Todavía no eligió una canción favorita.
            </span>
          )}
        </p>
      </section>
    </Marco>
  );
}
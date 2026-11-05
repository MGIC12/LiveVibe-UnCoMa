import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FormularioPublicacion from "../components/FormularioPublicacion";
import { useAuth } from "../../context/AuthContext";

export default function Publicar() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  // Después de publicar, se va a la página pública propia, donde queda la publicación
  const rutaPerfil = `${usuario.rol === "artista" ? "/artista" : "/usuario"}/${encodeURIComponent(
    usuario.nombre_usuario,
  )}`;

  return (
    <div className="min-h-screen bg-tinta text-crema font-sans flex flex-col justify-between">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-28 pb-16 w-full max-w-2xl space-y-5">
        <h1 className="text-3xl sm:text-4xl font-black text-crema">
          Crear <span className="text-fucsia">publicación</span>
        </h1>

        <FormularioPublicacion onPublicada={() => navigate(rutaPerfil)} />

        <Link to="/comunidad" className="inline-block text-cielo hover:text-crema font-bold">
          &larr; Volver a la comunidad
        </Link>
      </main>
      <Footer />
    </div>
  );
}
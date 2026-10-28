import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-tinta text-crema flex flex-col justify-between font-sans overflow-hidden relative">
      <Navbar />

      {/* Luces de neón de fondo para mantener el estilo LiveVibe */}
      <div className="absolute top-[20%] left-[-10%] w-96 h-96 bg-fucsia/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] bg-cielo/10 rounded-full blur-[120px] pointer-events-none"></div>

      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 pt-28 pb-12 relative z-10">
        {/* Número 404 gigante con gradiente */}
        <div className="text-9xl md:text-[150px] font-black text-transparent bg-clip-text bg-gradient-to-r from-fucsia to-cielo drop-shadow-lg mb-2">
          404
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
          ¡Ups! Te saliste del <span className="text-fucsia">ritmo</span>
        </h1>

        <p className="text-crema/70 text-lg md:text-xl max-w-lg mx-auto mb-10">
          La pista que buscas no existe, fue movida o el artista canceló el
          show. Volvamos a sintonizar la música.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3.5 rounded-full border border-crema/30 text-crema hover:bg-crema/10 font-bold transition-all flex items-center justify-center gap-2"
          >
            <span>&larr;</span> Volver atrás
          </button>

          <Link
            to="/"
            className="px-8 py-3.5 rounded-full bg-fucsia hover:bg-chicle text-tinta font-black transition-all shadow-[0_0_20px_rgba(255,46,147,0.3)] hover:scale-105"
          >
            Explorar Catálogo
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

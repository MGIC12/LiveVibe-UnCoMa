import { Link } from "react-router-dom";
import FeedComunidad from "./FeedComunidad";
import { useAuth } from "../../context/AuthContext";

const FeedInicio = () => {
  const { usuario } = useAuth();

  return (
    <section className="md:w-3/5">
      {/* BANNER CTA (Llamado a la acción): solo para quien todavía no tiene cuenta */}
      {!usuario && (
        <div className="bg-fucsia rounded-lg p-6 mb-8 shadow-lg text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-xl font-bold text-tinta mb-1">
              ¡Únete a la conversación! 🤘
            </h4>
            <p className="text-tinta/80 text-sm">
              Crea tu cuenta para seguir a tus artistas, comentar y conectar con otros fans.
            </p>
          </div>
          <Link
            to="/registro"
            className="bg-tinta text-crema font-bold py-2 px-6 rounded-full hover:bg-crema hover:text-tinta transition shadow-md whitespace-nowrap"
          >
            Crear cuenta
          </Link>
        </div>
      )}

      <FeedComunidad
        soloArtistas
        max={5}
        encabezado={
          <h3 className="text-2xl font-bold border-b border-crema/20 pb-2">
            🎤 NOVEDADES DE ARTISTAS
          </h3>
        }
      />
    </section>
  );
};

export default FeedInicio;
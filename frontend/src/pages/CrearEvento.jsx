import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";
import FormularioEvento from "../components/FormularioEvento";
import { EVENTO_VACIO } from "../utils/formularios";

export default function CrearEvento() {
  const { token } = useAuth();
  const navigate = useNavigate();

  async function crear(datos) {
    const res = await fetch(`${API}/api/eventos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "No se pudo crear el evento");

    navigate(`/evento/${data.id_evento}`);
  }

  return (
    <>
      <Navbar />
      <main className="flex justify-center px-4 pt-24 pb-12">
        <FormularioEvento
          titulo="Crear evento"
          valoresIniciales={EVENTO_VACIO}
          textoEnviar="Crear evento"
          textoEnviando="Creando evento..."
          onSubmit={crear}
          onCancelar={() => navigate("/perfil")}
        />
      </main>
    </>
  );
}
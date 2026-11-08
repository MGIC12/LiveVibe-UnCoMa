import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";
import FormularioEvento from "../components/FormularioEvento";
import { EVENTO_VACIO } from "../utils/formularios";
import { guardarPortada } from "../utils/portadas";

export default function CrearEvento() {
  const { token } = useAuth();
  const navigate = useNavigate();

  // "portada" es lo que se eligió con la imagen: { archivo, quitar }
  async function crear(datos, portada) {
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

    // El evento YA está creado. La imagen se sube en un segundo pedido, y si falla
    // no se lanza un error: el formulario dejaría enviarlo otra vez y se duplicaría el evento.
    try {
      await guardarPortada(data.id_evento, portada, token);
    } catch (err) {
      alert(
        `El evento se creó, pero la imagen no se pudo subir (${err.message}). Podés agregarla desde "Editar evento".`,
      );
    }

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
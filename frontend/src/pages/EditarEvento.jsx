import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import FormularioEvento from "../components/FormularioEvento";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";

function Mensaje({ children }) {
  return (
    <>
      <Navbar />
      <main className="max-w-xl mx-auto px-4 pt-32 text-center space-y-4">
        <p className="text-crema/80">{children}</p>
        <Link to="/" className="inline-block text-cielo hover:text-crema">
          Volver al inicio
        </Link>
      </main>
    </>
  );
}

export default function EditarEvento() {
  const { id } = useParams();
  const { usuario, token } = useAuth();
  const navigate = useNavigate();

  const [evento, setEvento] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [errorCancelar, setErrorCancelar] = useState("");

  // Carga el evento al entrar (o si cambia el id de la dirección)
  useEffect(() => {
    let activo = true;
    fetch(`${API}/api/eventos/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (activo) setEvento(data);
      })
      .catch(() => {
        if (activo) setEvento(null);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [id]);

  if (cargando) return <Mensaje>Cargando evento...</Mensaje>;
  if (!evento) return <Mensaje>Evento no encontrado.</Mensaje>;

  // La base manda la fecha como "2026-10-20T00:00:00.000Z": nos quedamos con el día
  const fecha = String(evento.fecha).slice(0, 10);
  const hoy = new Date().toLocaleDateString("en-CA");

  // Estas comprobaciones son para mostrar un mensaje claro;
  // la seguridad real está en el backend.
  if (evento.nombre_artista !== usuario.nombre_usuario) {
    return <Mensaje>Solo el artista que creó este evento puede modificarlo.</Mensaje>;
  }
  if (evento.estado === "cancelado") {
    return <Mensaje>Este evento está cancelado y ya no se puede modificar.</Mensaje>;
  }
  if (fecha < hoy) {
    return <Mensaje>Este evento ya ocurrió y no se puede modificar ni cancelar.</Mensaje>;
  }

  // Datos actuales en el formato que espera el formulario (todo texto)
  const inicial = {
    nombre: evento.nombre ?? "",
    lugar: evento.lugar ?? "",
    ciudad: evento.ciudad ?? "",
    fecha,
    hora_apertura: evento.hora_apertura ? String(evento.hora_apertura).slice(0, 5) : "",
    precio: evento.precio_desde ?? "",
    cant_entradas: evento.cant_entradas ?? "",
    pais: evento.pais ?? "",
    genero: evento.genero ?? "",
    clasificacion: evento.clasificacion ?? "",
    gira: evento.gira ?? "",
  };

  async function guardar(datos) {
    const res = await fetch(`${API}/api/eventos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "No se pudo guardar el evento");

    navigate(`/evento/${id}`);
  }

  async function cancelarEvento() {
    setErrorCancelar("");
    setCancelando(true);
    try {
      const res = await fetch(`${API}/api/eventos/${id}/cancelar`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo cancelar el evento");

      navigate(`/evento/${id}`);
    } catch (err) {
      setErrorCancelar(err.message);
      setCancelando(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="flex flex-col items-center gap-6 px-4 pt-24 pb-12">
        <FormularioEvento
          titulo="Editar evento"
          valoresIniciales={inicial}
          textoEnviar="Guardar cambios"
          textoEnviando="Guardando..."
          textoCancelar="Descartar cambios"
          onSubmit={guardar}
          onCancelar={() => navigate(`/evento/${id}`)}
        />

        {/* Zona de cancelación */}
        <section className="w-full max-w-2xl border border-mandarina/40 bg-mandarina/5 rounded-2xl p-6 space-y-3">
          <h2 className="text-lg font-bold text-mandarina">Cancelar evento</h2>
          <p className="text-sm text-crema/70">
            El evento dejará de aparecer en el catálogo y quienes tengan una reserva
            verán que fue cancelado. Esta acción no se puede deshacer.
          </p>

          {errorCancelar && (
            <p className="text-mandarina text-sm" role="alert">
              {errorCancelar}
            </p>
          )}

          {confirmando ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                disabled={cancelando}
                className="flex-1 py-2 rounded-full border border-crema/30 text-crema/80 hover:border-crema disabled:opacity-50"
              >
                No, volver
              </button>
              <button
                type="button"
                onClick={cancelarEvento}
                disabled={cancelando}
                className="flex-1 py-2 rounded-full bg-mandarina hover:bg-sol text-tinta font-bold disabled:opacity-50"
              >
                {cancelando ? "Cancelando..." : "Sí, cancelar evento"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              className="px-5 py-2 rounded-full border border-mandarina text-mandarina hover:bg-mandarina hover:text-tinta font-bold transition"
            >
              Cancelar evento
            </button>
          )}
        </section>
      </main>
    </>
  );
}
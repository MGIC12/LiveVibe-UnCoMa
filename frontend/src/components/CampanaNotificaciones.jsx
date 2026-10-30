import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";

// etiqueta = true: versión con texto, para el menú móvil
export default function CampanaNotificaciones({ etiqueta = false, onClick }) {
  const { token } = useAuth();
  const { pathname } = useLocation();
  const [cantidad, setCantidad] = useState(0);

  useEffect(() => {
    if (!token) return;
    let activo = true;

    const cargar = () =>
      fetch(`${API}/api/notificaciones/no-leidas`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (activo && data) setCantidad(data.cantidad);
        })
        .catch(() => {});

    cargar();
    const timer = setInterval(cargar, 30000); // se actualiza sola cada 30 segundos
    window.addEventListener("notificaciones:actualizadas", cargar);

    return () => {
      activo = false;
      clearInterval(timer);
      window.removeEventListener("notificaciones:actualizadas", cargar);
    };
  }, [token, pathname]); // también al cambiar de página

  const campana = (
    <span className="relative text-lg leading-none">
      🔔
      {cantidad > 0 && (
        <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-fucsia text-tinta text-[10px] font-black flex items-center justify-center">
          {cantidad > 99 ? "99+" : cantidad}
        </span>
      )}
    </span>
  );

  return (
    <Link
      to="/notificaciones"
      onClick={onClick}
      aria-label={cantidad > 0 ? `Notificaciones: ${cantidad} sin leer` : "Notificaciones"}
      className={
        etiqueta
          ? "flex items-center gap-4 px-3 py-2 text-base font-bold text-crema hover:bg-crema/10 rounded-md"
          : "inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-crema/10 transition"
      }
    >
      {campana}
      {etiqueta && "Notificaciones"}
    </Link>
  );
}
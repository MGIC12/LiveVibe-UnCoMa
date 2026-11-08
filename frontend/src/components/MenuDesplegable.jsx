import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function MenuDesplegable({ etiqueta, opciones }) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);
  const { pathname } = useLocation();
  const activo = opciones.some((o) => pathname.startsWith(o.to));

  useEffect(() => {
    if (!abierto) return;
    const alHacerClic = (e) => {
      if (!contenedor.current?.contains(e.target)) setAbierto(false);
    };
    const alTeclear = (e) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", alHacerClic);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("mousedown", alHacerClic);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        className={`inline-flex items-center gap-1 hover:text-crema hover:scale-105 transition ${
          activo ? "text-fucsia" : ""
        }`}
      >
        {etiqueta}
        <svg
          className={`w-3.5 h-3.5 transition-transform ${abierto ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 mt-3 w-44 py-2 rounded-xl bg-tinta border border-crema/20 shadow-xl"
        >
          {opciones.map((o) => (
            <Link
              key={o.to}
              to={o.to}
              role="menuitem"
              onClick={() => setAbierto(false)}
              className={`block px-4 py-2 hover:bg-crema/10 hover:text-crema transition ${
                pathname.startsWith(o.to) ? "text-fucsia" : "text-cielo"
              }`}
            >
              {o.texto}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

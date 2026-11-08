import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { API } from "../src/utils/api";
import { useAuth } from "./AuthContext";

const CarritoContext = createContext({ unidades: 0, refrescar: () => {} });

// Lleva la cuenta de unidades del carrito para mostrarla en la barra de navegación
export function CarritoProvider({ children }) {
  const { token, usuario } = useAuth();
  const [unidades, setUnidades] = useState(0);
  const esFan = usuario?.rol === "fan";

  const refrescar = useCallback(async () => {
    if (!token || !esFan) {
      setUnidades(0);
      return;
    }
    try {
      const res = await fetch(`${API}/api/carrito`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setUnidades(data.items.reduce((suma, i) => suma + i.cantidad, 0));
    } catch {
      // Sin conexión: se deja el número que había
    }
  }, [token, esFan]);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  return (
    <CarritoContext.Provider value={{ unidades, refrescar }}>
      {children}
    </CarritoContext.Provider>
  );
}

export const useCarrito = () => useContext(CarritoContext);

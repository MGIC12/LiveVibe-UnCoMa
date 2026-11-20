import { useState } from "react";

// Reparte una lista en páginas (en el navegador: las listas de esta app son cortas)
export function usePaginacion(items, porPagina) {
  const [pedida, setPagina] = useState(1);
  const total = Math.max(1, Math.ceil(items.length / porPagina));
  const pagina = Math.min(pedida, total); // si la lista se achica, no queda en una página vacía
  const desde = (pagina - 1) * porPagina;
  return {
    pagina,
    total,
    setPagina,
    visibles: items.slice(desde, desde + porPagina),
    desde: items.length === 0 ? 0 : desde + 1,
    hasta: Math.min(desde + porPagina, items.length),
  };
}

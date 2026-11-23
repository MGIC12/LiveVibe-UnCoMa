// Una publicación o un comentario se puede editar durante las primeras 24 horas
export const HORAS_EDICION = 24;

// fecha: la fecha de publicación, tal como la manda el servidor
export function puedeEditar(fecha) {
  const publicada = new Date(fecha).getTime();
  if (Number.isNaN(publicada)) return false;
  return Date.now() - publicada < HORAS_EDICION * 60 * 60 * 1000;
}
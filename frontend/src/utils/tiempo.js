// "recién", "hace 5 min", "hace 2 h", "hace 3 días", o la fecha si es más vieja
export function tiempoRelativo(fecha) {
  const segundos = Math.max(0, (Date.now() - new Date(fecha).getTime()) / 1000);
  if (segundos < 60) return "recién";

  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias < 7) return `hace ${dias} ${dias === 1 ? "día" : "días"}`;

  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
// Solo la primera letra en mayúscula: "sábado 14 de noviembre" -> "Sábado 14 de noviembre"
export function primeraMayuscula(texto) {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto;
}

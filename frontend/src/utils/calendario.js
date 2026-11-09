// "Agregar al calendario": genera un archivo .ics que abren Google Calendar, Apple Calendar,
// Outlook y compañía. Se arma en el navegador, sin pasar por el servidor.

const ZONA = "America/Argentina/Buenos_Aires"; // UTC-3 todo el año (sin horario de verano)
const DURACION_HORAS = 4; // duración estimada del show cuando se conoce la hora

// Escapa los caracteres con significado especial en el formato iCalendar
const escapar = (texto) =>
  String(texto ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

// Las líneas del .ics no pueden pasar de 75 caracteres: se parten con un espacio al inicio
function plegar(linea) {
  const partes = [];
  let resto = linea;
  while (resto.length > 75) {
    partes.push(resto.slice(0, 75));
    resto = ` ${resto.slice(75)}`;
  }
  partes.push(resto);
  return partes.join("\r\n");
}

const pad = (n) => String(n).padStart(2, "0");

function fechas(dia, hora) {
  const [a, m, d] = dia.split("-").map(Number);
  const [hh, mm] = hora.split(":").map(Number);
  const inicio = new Date(Date.UTC(a, m - 1, d, hh, mm));
  const fin = new Date(inicio.getTime() + DURACION_HORAS * 3600 * 1000);
  const formato = (f) =>
    `${f.getUTCFullYear()}${pad(f.getUTCMonth() + 1)}${pad(f.getUTCDate())}T${pad(f.getUTCHours())}${pad(f.getUTCMinutes())}00`;
  return { inicio: formato(inicio), fin: formato(fin) };
}

// Texto completo del archivo .ics para un evento
// evento: { id, nombre, fecha ("YYYY-MM-DD"), hora ("HH:MM" opcional), lugar, ciudad, url }
export function crearICS(evento) {
  const dia = String(evento.fecha).slice(0, 10);
  const hora = evento.hora ? String(evento.hora).slice(0, 5) : null;
  const lugar = [evento.lugar, evento.ciudad].filter(Boolean).join(", ");

  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LiveVibe//Entradas//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    `TZID:${ZONA}`,
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:-0300",
    "TZOFFSETTO:-0300",
    "TZNAME:-03",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:evento-${evento.id}@livevibe`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `SUMMARY:${escapar(`🎶 ${evento.nombre}`)}`,
  ];

  if (hora) {
    const { inicio, fin } = fechas(dia, hora);
    lineas.push(`DTSTART;TZID=${ZONA}:${inicio}`, `DTEND;TZID=${ZONA}:${fin}`);
  } else {
    // Sin horario conocido: evento de todo el día
    const [a, m, d] = dia.split("-").map(Number);
    const siguiente = new Date(Date.UTC(a, m - 1, d + 1));
    lineas.push(
      `DTSTART;VALUE=DATE:${a}${pad(m)}${pad(d)}`,
      `DTEND;VALUE=DATE:${siguiente.getUTCFullYear()}${pad(siguiente.getUTCMonth() + 1)}${pad(siguiente.getUTCDate())}`,
    );
  }

  if (lugar) lineas.push(`LOCATION:${escapar(lugar)}`);
  const detalle = [
    "Entrada reservada en LiveVibe.",
    hora ? `Apertura de puertas: ${hora} hs.` : null,
    evento.url ? `Detalle del evento: ${evento.url}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  lineas.push(`DESCRIPTION:${escapar(detalle)}`);
  if (evento.url) lineas.push(`URL:${evento.url}`);

  // Recordatorio un día antes
  lineas.push(
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapar(`Mañana: ${evento.nombre}`)}`,
    "TRIGGER:-P1D",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  );

  return `${lineas.map(plegar).join("\r\n")}\r\n`;
}

// Descarga el .ics (el navegador lo ofrece abrir con el calendario del dispositivo)
export function descargarICS(evento) {
  const blob = new Blob([crearICS(evento)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  const nombre = String(evento.nombre)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  enlace.href = url;
  enlace.download = `${nombre || "evento"}.ics`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

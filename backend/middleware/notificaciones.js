const pool = require("../db");

// Crea un aviso para una sola persona.
// Es secundario: si falla, queda en el log pero nunca interrumpe la operación principal.
async function notificarUsuario(
  destinatario,
  tipo,
  mensaje,
  { idEvento = null, origen = null } = {},
) {
  try {
    await pool.query(
      `INSERT INTO notificacion (nombre_destinatario, tipo, mensaje, id_evento, nombre_origen)
       VALUES ($1::varchar, $2::varchar, $3::text, $4::int, $5::varchar)`,
      [destinatario, tipo, mensaje, idEvento, origen],
    );
  } catch (error) {
    console.error("No se pudo crear la notificación:", error);
  }
}

// Un fan empezó a seguir al artista
const notificarNuevoSeguidor = (artista, fan) =>
  notificarUsuario(artista, "nuevo_seguidor", `${fan} empezó a seguirte`, {
    origen: fan,
  });

// El artista creó, modificó o canceló un evento.
// Reciben el aviso los fans con las novedades del artista activadas y,
// si incluirReservas es true, también quienes tienen una reserva de ese evento.
// Si alguien cumple las dos condiciones, recibe un solo aviso (por el UNION).
async function notificarSuscriptores(
  artista,
  tipo,
  idEvento,
  accion,
  incluirReservas = false,
) {
  try {
    const { rows } = await pool.query(
      "SELECT nombre_artistico FROM artista WHERE nombre_usuario = $1",
      [artista],
    );
    const nombre = rows[0]?.nombre_artistico ?? artista;

    await pool.query(
      `INSERT INTO notificacion (nombre_destinatario, tipo, mensaje, id_evento, nombre_origen)
       SELECT d.nombre, $2::varchar, $3::text, $4::int, $1::varchar
         FROM (
           SELECT nombre_fan AS nombre
             FROM suscripcion_novedades
            WHERE nombre_artista = $1::varchar
           UNION
           SELECT nombre_usuario
             FROM reserva
            WHERE $5::boolean AND id_evento = $4::int AND estado <> 'cancelada'
         ) d`,
      [artista, tipo, `${nombre} ${accion}`, idEvento, incluirReservas],
    );
  } catch (error) {
    console.error("No se pudieron crear las notificaciones:", error);
  }
}

module.exports = { notificarUsuario, notificarNuevoSeguidor, notificarSuscriptores };
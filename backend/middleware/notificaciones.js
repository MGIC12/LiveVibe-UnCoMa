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

// Alguien empezó a seguir a este usuario
const notificarNuevoSeguidor = (destinatario, seguidor) =>
  notificarUsuario(destinatario, "nuevo_seguidor", `${seguidor} empezó a seguirte`, {
    origen: seguidor,
  });

// El artista creó, modificó o canceló un evento.
// Reciben el aviso quienes activaron sus novedades y, si incluirReservas es true,
// también quienes tienen una reserva de ese evento (sin repetir, por el UNION).
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
           SELECT nombre_seguidor AS nombre
             FROM seguimiento
            WHERE nombre_seguido = $1::varchar AND tipo = 'novedades'
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

// Alguien (fan o artista) publicó: se avisa a quienes activaron sus novedades
async function notificarNuevaPublicacion(autor, contenido) {
  try {
    // Los artistas se muestran con su nombre artístico; los fans, con su usuario
    const { rows } = await pool.query(
      `SELECT COALESCE(a.nombre_artistico, u.nombre_usuario) AS nombre
         FROM usuario u
         LEFT JOIN artista a ON a.nombre_usuario = u.nombre_usuario
        WHERE u.nombre_usuario = $1`,
      [autor],
    );
    const nombre = rows[0]?.nombre ?? autor;

    // Se muestra un resumen de la publicación
    const letras = [...contenido];
    const resumen = letras.slice(0, 80).join("") + (letras.length > 80 ? "…" : "");

    await pool.query(
      `INSERT INTO notificacion (nombre_destinatario, tipo, mensaje, nombre_origen)
       SELECT nombre_seguidor, 'nueva_publicacion', $2::text, $1::varchar
         FROM seguimiento
        WHERE nombre_seguido = $1::varchar AND tipo = 'novedades'`,
      [autor, `${nombre} publicó: "${resumen}"`],
    );
  } catch (error) {
    console.error("No se pudieron crear las notificaciones de la publicación:", error);
  }
}

module.exports = {
  notificarUsuario,
  notificarNuevoSeguidor,
  notificarSuscriptores,
  notificarNuevaPublicacion,
};
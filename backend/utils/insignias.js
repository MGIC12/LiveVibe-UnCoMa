// Feature 14 — Insignias por nivel de asistencia.
const pool = require("../db");

// Únicos lugares donde se definen los niveles. Ordenados de mayor a menor.
const NIVELES = [
  { clave: "obsesionado", minimo: 10 },
  { clave: "fanatico", minimo: 5 },
  { clave: "aficionado", minimo: 1 },
];

const HOY_AR = "(NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date";

async function sincronizarInsignias() {
  //    Eventos ya ocurridos: las reservas confirmadas pasan a "asistió".
  //    Los eventos cancelados no cuentan.
  await pool.query(
    `UPDATE reserva r
        SET estado = 'asistió'
       FROM evento e
      WHERE e.id_evento = r.id_evento
        AND r.estado = 'confirmada'
        AND e.estado = 'activo'
        AND e.fecha < ${HOY_AR}`,
  );

  //    Insignia de cada fan según cuántas reservas "asistió" tiene.
  const casos = NIVELES.map(
    (n, i) => `WHEN COUNT(r.id_reserva) >= $${i + 1} THEN '${n.clave}'`,
  ).join(" ");

  await pool.query(
    `UPDATE fan f
        SET insignia = c.nueva
       FROM (SELECT f2.nombre_usuario,
                    CASE ${casos} ELSE NULL END AS nueva
               FROM fan f2
               LEFT JOIN reserva r
                      ON r.nombre_usuario = f2.nombre_usuario
                     AND r.estado = 'asistió'
              GROUP BY f2.nombre_usuario) c
      WHERE f.nombre_usuario = c.nombre_usuario
        AND f.insignia IS DISTINCT FROM c.nueva`,
    NIVELES.map((n) => n.minimo),
  );
}

async function sincronizarInsigniasSeguro() {
  try {
    await sincronizarInsignias();
  } catch (err) {
    console.error("No se pudieron actualizar las insignias:", err);
  }
}

module.exports = { NIVELES, sincronizarInsignias, sincronizarInsigniasSeguro };

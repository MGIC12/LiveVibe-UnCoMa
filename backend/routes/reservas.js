const express = require("express");
const router = express.Router();
const pool = require("../db");
const { verificarToken } = require("../middleware/auth");

// GET /api/reservas/mis-reservas - Reservas del usuario con sesión
router.get("/mis-reservas", verificarToken, async (req, res) => {
  try {
    // Los datos del evento se leen en el momento: si el artista los cambia, se ven solos
    const { rows } = await pool.query(
      `SELECT r.id_reserva, r.estado, r.fecha_reserva,
              e.id_evento, e.nombre AS evento_nombre, e.lugar, e.ciudad,
              e.estado AS evento_estado,
              to_char(e.fecha, 'YYYY-MM-DD') AS evento_fecha,
              to_char(e.hora_apertura, 'HH24:MI') AS hora_apertura,
              (SELECT MIN(precio)::float8 FROM entrada
                WHERE id_evento = e.id_evento) AS precio
         FROM reserva r
         JOIN evento e ON e.id_evento = r.id_evento
        WHERE r.nombre_usuario = $1
        ORDER BY e.fecha ASC`,
      [req.user.nombre_usuario],
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT /api/reservas/:id/cancelar - El fan cancela su reserva
router.put("/:id/cancelar", verificarToken, async (req, res) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) {
    return res.status(404).json({ error: "Reserva no encontrada" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Se bloquea la reserva: dos clics seguidos no pueden devolver la entrada dos veces
    const { rows } = await client.query(
      `SELECT r.estado, r.nombre_usuario, r.id_evento,
              e.estado AS evento_estado,
              e.fecha < (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date AS ya_ocurrio
         FROM reserva r
         JOIN evento e ON e.id_evento = r.id_evento
        WHERE r.id_reserva = $1
          FOR UPDATE OF r`,
      [id],
    );
    const reserva = rows[0];

    if (!reserva) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Reserva no encontrada" });
    }
    if (reserva.nombre_usuario !== req.user.nombre_usuario) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "No autorizado para cancelar esta reserva" });
    }
    if (reserva.estado === "cancelada") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "La reserva ya está cancelada." });
    }
    if (reserva.evento_estado === "cancelado") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "El evento fue cancelado por el artista." });
    }
    if (reserva.ya_ocurrio) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "No puedes cancelar un evento que ya ocurrió." });
    }

    const { rows: actualizada } = await client.query(
      "UPDATE reserva SET estado = 'cancelada' WHERE id_reserva = $1 RETURNING *",
      [id],
    );

    // La entrada vuelve a quedar disponible
    await client.query(
      "UPDATE entrada SET stock = stock + 1 WHERE id_evento = $1 AND tipo_acceso = 'General'",
      [reserva.id_evento],
    );

    await client.query("COMMIT");
    res.json({ mensaje: "Reserva cancelada exitosamente", reserva: actualizada[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al cancelar:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    client.release();
  }
});

module.exports = router;
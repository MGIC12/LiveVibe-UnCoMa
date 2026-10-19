const express = require("express");
const router = express.Router();
const { pool } = require("../db");

// GET /api/reservas/usuario/:usuarioId - Obtener todas las reservas de un fan
router.get("/usuario/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params; // Este será el nombre de usuario (ej: "mariano")

    const query = `
      SELECT r.id_reserva, r.estado, r.fecha_reserva,
             e.id_evento, e.nombre AS evento_nombre, e.fecha AS evento_fecha, e.lugar, e.ciudad
      FROM reservas r
      JOIN eventos e ON r.id_evento = e.id_evento
      WHERE r.nombre_usuario = $1
      ORDER BY e.fecha ASC
    `;

    const result = await pool.query(query, [usuarioId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT /api/reservas/:id/cancelar - Cancelar una reserva
router.put("/:id/cancelar", async (req, res) => {
  try {
    const { id } = req.params;

    const checkQuery = `
      SELECT r.estado, e.fecha AS evento_fecha
      FROM reservas r
      JOIN eventos e ON r.id_evento = e.id_evento
      WHERE r.id_reserva = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    const reserva = checkResult.rows[0];
    const fechaEvento = new Date(reserva.evento_fecha);
    const hoy = new Date();

    if (fechaEvento < hoy) {
      return res
        .status(400)
        .json({
          error: "No puedes cancelar una reserva de un evento que ya ocurrió.",
        });
    }

    if (reserva.estado === "cancelada") {
      return res
        .status(400)
        .json({ error: "La reserva ya se encuentra cancelada." });
    }

    const updateQuery = `
      UPDATE reservas
      SET estado = 'cancelada'
      WHERE id_reserva = $1
      RETURNING *
    `;
    const updateResult = await pool.query(updateQuery, [id]);

    res.json({
      mensaje: "Reserva cancelada con éxito",
      reserva: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Error al cancelar reserva:", error);
    res.status(500).json({ error: "Error al procesar la cancelación" });
  }
});

module.exports = router;

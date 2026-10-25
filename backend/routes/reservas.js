const express = require("express");
const router = express.Router();
const pool = require("../db");
const { verificarToken } = require("../middleware/auth");

// GET /api/reservas/mis-reservas - Obtener reservas del usuario logueado
router.get("/mis-reservas", verificarToken, async (req, res) => {
  try {
    const nombre_usuario = req.user.nombre_usuario;

    const query = `
      SELECT r.id_reserva, r.estado, r.fecha_reserva,
             e.id_evento, e.nombre AS evento_nombre, e.fecha AS evento_fecha, e.lugar, e.ciudad
      FROM reserva r
      JOIN evento e ON r.id_evento = e.id_evento
      WHERE r.nombre_usuario = $1
      ORDER BY e.fecha ASC
    `;

    const result = await pool.query(query, [nombre_usuario]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT /api/reservas/:id/cancelar - Cancelar una reserva
router.put("/:id/cancelar", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const nombre_usuario = req.user.nombre_usuario;

    // Verificar que la reserva exista y sea del usuario
    const checkQuery = `
      SELECT r.estado, r.nombre_usuario, e.fecha AS evento_fecha
      FROM reserva r
      JOIN evento e ON r.id_evento = e.id_evento
      WHERE r.id_reserva = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    const reserva = checkResult.rows[0];

    if (reserva.nombre_usuario !== nombre_usuario) {
      return res
        .status(403)
        .json({ error: "No autorizado para cancelar esta reserva" });
    }

    // Verificar que el evento no haya pasado
    const fechaEvento = new Date(reserva.evento_fecha);
    const hoy = new Date();

    if (fechaEvento <= hoy) {
      return res
        .status(400)
        .json({ error: "No puedes cancelar un evento que ya ocurrió." });
    }

    if (reserva.estado === "cancelada") {
      return res.status(400).json({ error: "La reserva ya está cancelada." });
    }

    // Cancelar la reserva
    const updateQuery = `
      UPDATE reserva SET estado = 'cancelada' WHERE id_reserva = $1 RETURNING *
    `;
    const updateResult = await pool.query(updateQuery, [id]);

    res.json({
      mensaje: "Reserva cancelada exitosamente",
      reserva: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Error al cancelar:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;

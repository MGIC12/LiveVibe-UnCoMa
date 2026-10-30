const express = require("express");
const pool = require("../db");
const { verificarToken } = require("../middleware/auth");

const router = express.Router();

// GET /api/notificaciones - Las últimas 50 del usuario con sesión
router.get("/", verificarToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id_notificacion, tipo, mensaje, id_evento, nombre_origen, leida, fecha
         FROM notificacion
        WHERE nombre_destinatario = $1
        ORDER BY fecha DESC, id_notificacion DESC
        LIMIT 50`,
      [req.user.nombre_usuario],
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al listar las notificaciones:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/notificaciones/no-leidas - Cantidad de no leídas (para la campanita)
router.get("/no-leidas", verificarToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS cantidad
         FROM notificacion
        WHERE nombre_destinatario = $1 AND NOT leida`,
      [req.user.nombre_usuario],
    );
    res.json({ cantidad: rows[0].cantidad });
  } catch (error) {
    console.error("Error al contar las notificaciones:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PATCH /api/notificaciones/leer-todas - Marca todas como leídas
router.patch("/leer-todas", verificarToken, async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE notificacion SET leida = TRUE
        WHERE nombre_destinatario = $1 AND NOT leida`,
      [req.user.nombre_usuario],
    );
    res.json({ actualizadas: r.rowCount });
  } catch (error) {
    console.error("Error al marcar las notificaciones:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PATCH /api/notificaciones/:id/leida - Marca una como leída
router.patch("/:id/leida", verificarToken, async (req, res) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) {
    return res.status(404).json({ error: "Notificación no encontrada" });
  }
  try {
    // El destinatario se compara contra el token: nadie marca avisos ajenos
    const r = await pool.query(
      `UPDATE notificacion SET leida = TRUE
        WHERE id_notificacion = $1 AND nombre_destinatario = $2`,
      [id, req.user.nombre_usuario],
    );
    if (r.rowCount === 0) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }
    res.json({ id_notificacion: Number(id), leida: true });
  } catch (error) {
    console.error("Error al marcar la notificación:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
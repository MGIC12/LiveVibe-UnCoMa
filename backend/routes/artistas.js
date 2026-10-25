const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/artistas/:username - Obtener perfil del artista y sus eventos
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;

    // Obtener datos combinados de usuario y artista
    const artistaRes = await pool.query(
      `
      SELECT u.nombre_usuario, u.biografia, a.nombre_artistico, a.genero, a.nacionalidad, a.tipo_artista 
      FROM usuario u 
      JOIN artista a ON u.nombre_usuario = a.nombre_usuario 
      WHERE u.nombre_usuario = $1
    `,
      [username],
    );

    if (artistaRes.rows.length === 0) {
      return res.status(404).json({ error: "Artista no encontrado" });
    }

    // Obtener eventos asociados al artista
    const eventosRes = await pool.query(
      "SELECT * FROM evento WHERE nombre_artista = $1 ORDER BY fecha ASC",
      [username],
    );

    res.json({ artista: artistaRes.rows[0], eventos: eventosRes.rows });
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/artistas - Obtener todos los artistas
router.get("/", async (req, res) => {
  try {
    const artistasRes = await pool.query("SELECT * FROM artista");
    res.json(artistasRes.rows);
  } catch (error) {
    console.error("Error al obtener artistas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;

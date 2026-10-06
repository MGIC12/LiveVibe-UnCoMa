const express = require("express");
const pool = require("../db");
const { verificarToken, requerirRol } = require("../middleware/auth");

const router = express.Router();

// PUT /api/perfil  -> el fan modifica su biografía y su canción favorita
router.put("/", verificarToken, requerirRol("fan"), async (req, res) => {
  const { biografia, cancion_favorita } = req.body;

  if (typeof biografia !== "string" || typeof cancion_favorita !== "string") {
    return res.status(400).json({ error: "Datos inválidos" });
  }
  if (biografia.length > 500) {
    return res.status(400).json({ error: "La biografía puede tener hasta 500 caracteres" });
  }
  if (cancion_favorita.length > 150) {
    return res.status(400).json({ error: "La canción favorita puede tener hasta 150 caracteres" });
  }

  // Un campo vacío se guarda como NULL (así se puede borrar)
  const bio = biografia.trim() || null;
  const cancion = cancion_favorita.trim() || null;
  const usuario = req.user.nombre_usuario; // sale del token, no del body

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE usuario SET biografia = $1 WHERE nombre_usuario = $2", [bio, usuario]);
    await client.query("UPDATE fan SET cancion_favorita = $1 WHERE nombre_usuario = $2", [cancion, usuario]);
    await client.query("COMMIT");
    return res.json({ biografia: bio, cancion_favorita: cancion });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Error del servidor" });
  } finally {
    client.release();
  }
});

module.exports = router;
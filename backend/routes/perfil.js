const express = require("express");
const pool = require("../db");
const { verificarToken, requerirRol } = require("../middleware/auth");
const { subirFoto, borrarArchivo } = require("../middleware/subida");

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

// PUT /api/perfil/foto -> cualquier usuario con sesión cambia su foto de perfil
router.put("/foto", verificarToken, subirFoto, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Elegí una imagen" });
  }

  const usuario = req.user.nombre_usuario;
  const url = `/uploads/${req.file.filename}`;
  const descripcion = (req.body.descripcion || `Foto de perfil de ${usuario}`)
    .trim()
    .slice(0, 200);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Foto actual del usuario (si tiene)
    const { rows: actual } = await client.query(
      `SELECT i.id_imagen, i.url
         FROM usuario u
         LEFT JOIN imagen i ON i.id_imagen = u.id_imagen
        WHERE u.nombre_usuario = $1`,
      [usuario]
    );
    if (!actual[0]) {
      await client.query("ROLLBACK");
      borrarArchivo(req.file.filename);
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // 1) se crea la imagen nueva
    const { rows: nueva } = await client.query(
      "INSERT INTO imagen (descripcion, url) VALUES ($1, $2) RETURNING url, descripcion",
      [descripcion, url]
    );
    // 2) el usuario pasa a apuntar a ella
    await client.query(
      "UPDATE usuario SET id_imagen = (SELECT id_imagen FROM imagen WHERE url = $1) WHERE nombre_usuario = $2",
      [url, usuario]
    );
    // 3) se elimina la imagen anterior
    if (actual[0].id_imagen) {
      await client.query("DELETE FROM imagen WHERE id_imagen = $1", [actual[0].id_imagen]);
    }

    await client.query("COMMIT");

    borrarArchivo(actual[0].url); // el archivo viejo se borra solo si todo salió bien
    return res.json({ foto_url: nueva[0].url, foto_descripcion: nueva[0].descripcion });
  } catch (err) {
    await client.query("ROLLBACK");
    borrarArchivo(req.file.filename);
    console.error(err);
    return res.status(500).json({ error: "Error del servidor" });
  } finally {
    client.release();
  }
});

// DELETE /api/perfil/foto -> quita la foto de perfil
router.delete("/foto", verificarToken, async (req, res) => {
  const usuario = req.user.nombre_usuario;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT i.id_imagen, i.url
         FROM usuario u
         LEFT JOIN imagen i ON i.id_imagen = u.id_imagen
        WHERE u.nombre_usuario = $1`,
      [usuario]
    );

    if (rows[0]?.id_imagen) {
      // Al borrar la imagen, ON DELETE SET NULL deja usuario.id_imagen en NULL
      await client.query("DELETE FROM imagen WHERE id_imagen = $1", [rows[0].id_imagen]);
    }

    await client.query("COMMIT");
    borrarArchivo(rows[0]?.url);
    return res.json({ foto_url: null, foto_descripcion: null });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Error del servidor" });
  } finally {
    client.release();
  }
});

module.exports = router;
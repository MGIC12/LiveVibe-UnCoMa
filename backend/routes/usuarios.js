const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET /api/usuarios/:usuario - Perfil público de un usuario (sin sesión)
router.get("/:usuario", async (req, res) => {
  try {
    // Los admins no tienen perfil público
    const { rows } = await pool.query(
      `SELECT u.nombre_usuario, u.rol, u.biografia, u.fecha_alta,
              i.url AS foto_url, i.descripcion AS foto_descripcion,
              f.cancion_favorita
         FROM usuario u
         LEFT JOIN imagen i ON i.id_imagen = u.id_imagen
         LEFT JOIN fan f ON f.nombre_usuario = u.nombre_usuario
        WHERE u.nombre_usuario = $1 AND u.rol IN ('fan', 'artista')`,
      [req.params.usuario],
    );
    const usuario = rows[0];
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    // Los artistas tienen su propia página: solo se indica que lo son
    if (usuario.rol === "artista") {
      return res.json({ nombre_usuario: usuario.nombre_usuario, rol: "artista" });
    }

    res.json(usuario);
  } catch (error) {
    console.error("Error al obtener el perfil del usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
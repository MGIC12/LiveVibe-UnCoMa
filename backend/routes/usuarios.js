const express = require("express");
const pool = require("../db");
const router = express.Router();
const { verificarToken, requerirRol } = require("../middleware/auth");
const { notificarNuevoSeguidor } = require("../middleware/notificaciones");

// GET /api/usuarios/:usuario - Perfil público de un usuario (sin sesión)
router.get("/:usuario", async (req, res) => {
  try {
    // Los admins no tienen perfil público
    const { rows } = await pool.query(
        `SELECT u.nombre_usuario, u.rol, u.biografia, u.fecha_alta,
              i.url AS foto_url, i.descripcion AS foto_descripcion,
              f.cancion_favorita,
              (SELECT COUNT(*)::int FROM sigue_fan
                WHERE nombre_seguido = u.nombre_usuario) AS seguidores,
              (SELECT COUNT(*)::int FROM sigue_fan
                WHERE nombre_seguidor = u.nombre_usuario)
              + (SELECT COUNT(*)::int FROM sigue
                  WHERE nombre_fan = u.nombre_usuario) AS siguiendo
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

// ¿El fan con sesión sigue a este usuario?
router.get("/:usuario/seguimiento", verificarToken, requerirRol("fan"), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT EXISTS (SELECT 1 FROM sigue_fan
                       WHERE nombre_seguidor = $1::varchar
                         AND nombre_seguido = $2::varchar) AS sigue`,
      [req.user.nombre_usuario, req.params.usuario],
    );
    res.json(rows[0]);
  } catch (error) {
    console.error("Error al consultar el seguimiento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Un fan sigue / deja de seguir a otro fan. Body: { sigue: true | false }
router.put("/:usuario/seguimiento", verificarToken, requerirRol("fan"), async (req, res) => {
  const seguidor = req.user.nombre_usuario;
  const seguido = req.params.usuario;
  const { sigue } = req.body ?? {};

  if (typeof sigue !== "boolean") {
    return res.status(400).json({ error: "Indicá si querés seguir o dejar de seguir (true o false)" });
  }
  if (seguidor === seguido) {
    return res.status(400).json({ error: "No podés seguirte a vos mismo" });
  }

  try {
    // Solo se puede seguir a un fan (a los artistas se los sigue desde su perfil)
    const existe = await pool.query("SELECT 1 FROM fan WHERE nombre_usuario = $1", [seguido]);
    if (existe.rowCount === 0) {
      return res.status(404).json({ error: "Fan no encontrado" });
    }

    if (sigue) {
      const r = await pool.query(
        `INSERT INTO sigue_fan (nombre_seguidor, nombre_seguido)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [seguidor, seguido],
      );
      // Solo se avisa si es un seguimiento nuevo (no si ya lo seguía)
      if (r.rowCount === 1) await notificarNuevoSeguidor(seguido, seguidor);
    } else {
      await pool.query(
        "DELETE FROM sigue_fan WHERE nombre_seguidor = $1 AND nombre_seguido = $2",
        [seguidor, seguido],
      );
    }

    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS seguidores FROM sigue_fan WHERE nombre_seguido = $1",
      [seguido],
    );
    res.json({ sigue, seguidores: rows[0].seguidores });
  } catch (error) {
    console.error("Error al guardar el seguimiento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
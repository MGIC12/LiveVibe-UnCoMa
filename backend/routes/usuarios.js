const express = require("express");
const pool = require("../db");
const router = express.Router();
const { verificarToken, requerirRol } = require("../middleware/auth");
const { notificarNuevoSeguidor } = require("../middleware/notificaciones");

// Quiénes pueden seguir y activar novedades (se puede restringir cambiando esta lista)
const PUEDEN_SEGUIR = ["fan", "artista"];

// GET /api/usuarios/:usuario - Perfil público de un usuario (sin sesión)
router.get("/:usuario", async (req, res) => {
  try {
    // Los admins no tienen perfil público
    const { rows } = await pool.query(
      `SELECT u.nombre_usuario, u.rol, u.biografia, u.fecha_alta,
              i.url AS foto_url, i.descripcion AS foto_descripcion,
              f.cancion_favorita,
              (SELECT COUNT(*)::int FROM seguimiento
                WHERE nombre_seguido = u.nombre_usuario AND tipo = 'sigue') AS seguidores,
              (SELECT COUNT(*)::int FROM seguimiento
                WHERE nombre_seguidor = u.nombre_usuario AND tipo = 'sigue') AS siguiendo
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

// ---------- Seguimiento (sirve para el perfil de un fan y el de un artista) ----------

// Estado de quien mira con respecto a otro usuario: ¿lo sigue? ¿recibe sus novedades?
async function estadoSeguimiento(yo, otro) {
  const { rows } = await pool.query(
    `SELECT EXISTS (SELECT 1 FROM seguimiento
                     WHERE nombre_seguidor = $1::varchar
                       AND nombre_seguido = $2::varchar AND tipo = 'sigue') AS sigue,
            EXISTS (SELECT 1 FROM seguimiento
                     WHERE nombre_seguidor = $1::varchar
                       AND nombre_seguido = $2::varchar AND tipo = 'novedades') AS novedades,
            (SELECT COUNT(*)::int FROM seguimiento
              WHERE nombre_seguido = $2::varchar AND tipo = 'sigue') AS seguidores`,
    [yo, otro],
  );
  return rows[0];
}

// Activa o desactiva un tipo de seguimiento. Devuelve true si se creó uno nuevo.
async function cambiarSeguimiento(yo, otro, tipo, activar) {
  if (activar) {
    const r = await pool.query(
      `INSERT INTO seguimiento (nombre_seguidor, nombre_seguido, tipo)
       VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [yo, otro, tipo],
    );
    return r.rowCount === 1;
  }
  await pool.query(
    `DELETE FROM seguimiento
      WHERE nombre_seguidor = $1 AND nombre_seguido = $2 AND tipo = $3`,
    [yo, otro, tipo],
  );
  return false;
}

// GET /api/usuarios/:usuario/seguimiento - ¿Sigo a este usuario? ¿Recibo sus novedades?
router.get("/:usuario/seguimiento", verificarToken, requerirRol(...PUEDEN_SEGUIR), async (req, res) => {
  try {
    res.json(await estadoSeguimiento(req.user.nombre_usuario, req.params.usuario));
  } catch (error) {
    console.error("Error al consultar el seguimiento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT /api/usuarios/:usuario/seguimiento
// Body: { sigue: true|false, novedades: true|false }  (cada uno es opcional)
router.put("/:usuario/seguimiento", verificarToken, requerirRol(...PUEDEN_SEGUIR), async (req, res) => {
  const yo = req.user.nombre_usuario;
  const otro = req.params.usuario;
  const { sigue, novedades } = req.body ?? {};

  const valido = (v) => v === undefined || typeof v === "boolean";
  if (!valido(sigue) || !valido(novedades) || (sigue === undefined && novedades === undefined)) {
    return res
      .status(400)
      .json({ error: "Indicá si querés seguir o recibir novedades (true o false)" });
  }
  if (yo === otro) {
    return res.status(400).json({ error: "No podés seguirte a vos mismo" });
  }

  try {
    // Se puede seguir a un fan o a un artista (no a un admin)
    const existe = await pool.query(
      "SELECT 1 FROM usuario WHERE nombre_usuario = $1 AND rol IN ('fan', 'artista')",
      [otro],
    );
    if (existe.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (sigue !== undefined) {
      const esNuevo = await cambiarSeguimiento(yo, otro, "sigue", sigue);
      // Solo se avisa si es un seguimiento nuevo (no si ya lo seguía)
      if (esNuevo) await notificarNuevoSeguidor(otro, yo);
    }
    if (novedades !== undefined) {
      await cambiarSeguimiento(yo, otro, "novedades", novedades);
    }

    res.json(await estadoSeguimiento(yo, otro));
  } catch (error) {
    console.error("Error al guardar el seguimiento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
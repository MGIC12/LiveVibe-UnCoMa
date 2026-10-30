const express = require("express");
const pool = require("../db");
const { verificarToken, requerirRol } = require("../middleware/auth");
const { notificarNuevoSeguidor } = require("../middleware/notificaciones");

const router = express.Router();

// GET /api/artistas/:usuario - Perfil público de un artista (sin sesión)
router.get("/:usuario", async (req, res) => {
  const { usuario } = req.params;

  try {
    // JOIN con artista: solo existen resultados para cuentas de artista
    const { rows } = await pool.query(
      `SELECT u.nombre_usuario, u.biografia,
              i.url AS foto_url, i.descripcion AS foto_descripcion,
              a.nombre_artistico, a.nacionalidad, a.genero, a.tipo_artista
         FROM usuario u
         JOIN artista a ON a.nombre_usuario = u.nombre_usuario
         LEFT JOIN imagen i ON i.id_imagen = u.id_imagen
        WHERE u.nombre_usuario = $1`,
      [usuario],
    );
    if (!rows[0]) return res.status(404).json({ error: "Artista no encontrado" });

    const artista = rows[0];

    const [integrantes, eventos] = await Promise.all([
      artista.tipo_artista === "banda"
        ? pool.query(
            `SELECT nombre, apellido, instrumento, nacionalidad
               FROM integrante
              WHERE nombre_usuario = $1
              ORDER BY id_integrante`,
            [usuario],
          )
        : { rows: [] },
      pool.query(
        `SELECT e.id_evento, e.nombre, e.lugar, e.ciudad, e.pais,
                to_char(e.fecha, 'YYYY-MM-DD') AS fecha,
                to_char(e.hora_apertura, 'HH24:MI') AS hora_apertura,
                (SELECT MIN(precio)::float8 FROM entrada
                  WHERE id_evento = e.id_evento) AS precio_desde
           FROM evento e
          WHERE e.nombre_artista = $1
            AND e.estado = 'activo'
            AND e.fecha >= (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date
          ORDER BY e.fecha ASC, e.hora_apertura ASC NULLS LAST`,
        [usuario],
      ),
    ]);

    const { rows: conteo } = await pool.query(
      "SELECT COUNT(*)::int AS seguidores FROM sigue WHERE nombre_artista = $1",
      [usuario],
    );

    res.json({
      ...artista,
      integrantes: integrantes.rows,
      proximos_eventos: eventos.rows,
      seguidores: conteo[0].seguidores,
    });
    
  } catch (error) {
    console.error("Error al obtener el perfil del artista:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Estado del fan con respecto a un artista: ¿lo sigue? ¿recibe sus novedades?
async function estadoSeguimiento(fan, artista) {
  const { rows } = await pool.query(
    `SELECT EXISTS (SELECT 1 FROM sigue
                     WHERE nombre_fan = $1::varchar AND nombre_artista = $2::varchar) AS sigue,
            EXISTS (SELECT 1 FROM suscripcion_novedades
                     WHERE nombre_fan = $1::varchar AND nombre_artista = $2::varchar) AS novedades`,
    [fan, artista],
  );
  return rows[0];
}

// GET /api/artistas/:usuario/seguimiento - Estado del fan con sesión iniciada
router.get("/:usuario/seguimiento", verificarToken, requerirRol("fan"), async (req, res) => {
  try {
    res.json(await estadoSeguimiento(req.user.nombre_usuario, req.params.usuario));
  } catch (error) {
    console.error("Error al consultar el seguimiento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT /api/artistas/:usuario/seguimiento - El fan sigue / deja de seguir y/o activa / desactiva novedades
// Body: { sigue: true|false, novedades: true|false }  (cada uno es opcional)
router.put("/:usuario/seguimiento", verificarToken, requerirRol("fan"), async (req, res) => {
  const fan = req.user.nombre_usuario;
  const artista = req.params.usuario;
  const { sigue, novedades } = req.body ?? {};

  const valido = (v) => v === undefined || typeof v === "boolean";
  if (!valido(sigue) || !valido(novedades) || (sigue === undefined && novedades === undefined)) {
    return res.status(400).json({ error: "Indicá si querés seguir o recibir novedades (true o false)" });
  }

  try {
    const existe = await pool.query("SELECT 1 FROM artista WHERE nombre_usuario = $1", [artista]);
    if (existe.rowCount === 0) {
      return res.status(404).json({ error: "Artista no encontrado" });
    }

    if (sigue === true) {
      const r = await pool.query(
        "INSERT INTO sigue (nombre_fan, nombre_artista) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [fan, artista],
      );
      // Solo se avisa si es un seguimiento nuevo (no si ya lo seguía)
      if (r.rowCount === 1) await notificarNuevoSeguidor(artista, fan);
    } else if (sigue === false) {
      await pool.query("DELETE FROM sigue WHERE nombre_fan = $1 AND nombre_artista = $2", [fan, artista]);
    }

    if (novedades === true) {
      await pool.query(
        "INSERT INTO suscripcion_novedades (nombre_fan, nombre_artista) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [fan, artista],
      );
    } else if (novedades === false) {
      await pool.query(
        "DELETE FROM suscripcion_novedades WHERE nombre_fan = $1 AND nombre_artista = $2",
        [fan, artista],
      );
    }

    res.json(await estadoSeguimiento(fan, artista));
  } catch (error) {
    if (error.code === "23503") {
      return res.status(404).json({ error: "No se encontró tu cuenta de fan" });
    }
    console.error("Error al guardar el seguimiento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
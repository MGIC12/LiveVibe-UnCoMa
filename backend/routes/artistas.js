const express = require("express");
const pool = require("../db");

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

    res.json({
      ...artista,
      integrantes: integrantes.rows,
      proximos_eventos: eventos.rows,
    });
  } catch (error) {
    console.error("Error al obtener el perfil del artista:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
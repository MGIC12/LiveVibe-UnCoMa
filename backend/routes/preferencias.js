// Bienvenida de fans nuevos: géneros favoritos y artistas sugeridos.
// Los géneros elegidos alimentan al recomendador; seguir artistas usa la ruta de siempre
// (PUT /api/usuarios/:usuario/seguimiento).

const express = require("express");
const pool = require("../db");
const { verificarToken, requerirRol } = require("../middleware/auth");
const recomendador = require("../utils/recomendador");

const router = express.Router();
router.use(verificarToken, requerirRol("fan"));

const MAX_GENEROS = 8;

// Géneros que existen en la plataforma (de eventos vigentes y de artistas), sin repetir
// aunque estén escritos distinto ("rock" / "Rock")
async function generosDisponibles() {
  const { rows } = await pool.query(
    `SELECT MODE() WITHIN GROUP (ORDER BY nombre) AS nombre, COUNT(*)::int AS cantidad
       FROM (
         SELECT TRIM(e.genero) AS nombre FROM evento e
          WHERE e.estado = 'activo'
            AND e.fecha >= (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date
         UNION ALL
         SELECT TRIM(a.genero) FROM artista a
       ) g
      WHERE nombre IS NOT NULL AND nombre <> ''
      GROUP BY LOWER(nombre)
      ORDER BY cantidad DESC, nombre ASC`,
  );
  return rows;
}

// GET /api/preferencias - Géneros que eligió el fan y los que puede elegir
router.get("/", async (req, res) => {
  try {
    const [elegidos, opciones] = await Promise.all([
      pool.query(
        "SELECT genero FROM fan_genero WHERE nombre_usuario = $1 ORDER BY genero",
        [req.user.nombre_usuario],
      ),
      generosDisponibles(),
    ]);
    res.json({ generos: elegidos.rows.map((r) => r.genero), opciones });
  } catch (error) {
    console.error("Error al leer las preferencias:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT /api/preferencias - Reemplaza los géneros favoritos
// Body: { generos: ["Rock", "Jazz"] } (hasta 8, solo géneros que existen en la plataforma)
router.put("/", async (req, res) => {
  const pedidos = req.body?.generos;
  if (!Array.isArray(pedidos) || !pedidos.every((g) => typeof g === "string")) {
    return res.status(400).json({ error: "Enviá la lista de géneros" });
  }

  const client = await pool.connect();
  try {
    // Solo se aceptan géneros existentes; se guarda el nombre tal como figura en la plataforma
    const opciones = await generosDisponibles();
    const porClave = new Map(opciones.map((o) => [o.nombre.toLowerCase(), o.nombre]));
    const elegidos = [
      ...new Set(
        pedidos
          .map((g) => porClave.get(g.trim().toLowerCase()))
          .filter(Boolean),
      ),
    ];
    if (elegidos.length > MAX_GENEROS) {
      return res.status(400).json({ error: `Podés elegir hasta ${MAX_GENEROS} géneros` });
    }

    await client.query("BEGIN");
    await client.query("DELETE FROM fan_genero WHERE nombre_usuario = $1", [
      req.user.nombre_usuario,
    ]);
    for (const genero of elegidos) {
      await client.query(
        "INSERT INTO fan_genero (nombre_usuario, genero) VALUES ($1, $2)",
        [req.user.nombre_usuario, genero],
      );
    }
    await client.query("COMMIT");

    // Las recomendaciones guardadas ya no sirven: cambió el gusto
    recomendador.cache.delete(req.user.nombre_usuario);
    res.json({ generos: elegidos });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Error al guardar las preferencias:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    client.release();
  }
});

// GET /api/preferencias/artistas - Artistas para seguir: primero los de los géneros elegidos
router.get("/artistas", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.nombre_usuario, a.nombre_artistico, a.genero, i.url AS foto_url,
              (SELECT COUNT(*) FROM seguimiento s
                WHERE s.nombre_seguido = a.nombre_usuario AND s.tipo = 'sigue')::int AS seguidores,
              EXISTS (SELECT 1 FROM seguimiento s
                       WHERE s.nombre_seguidor = $1 AND s.nombre_seguido = a.nombre_usuario
                         AND s.tipo = 'sigue') AS sigo,
              EXISTS (SELECT 1 FROM fan_genero g
                       WHERE g.nombre_usuario = $1
                         AND LOWER(TRIM(g.genero)) = LOWER(TRIM(a.genero))) AS coincide
         FROM artista a
         JOIN usuario u ON u.nombre_usuario = a.nombre_usuario
         LEFT JOIN imagen i ON i.id_imagen = u.id_imagen
        ORDER BY coincide DESC, seguidores DESC, a.nombre_artistico
        LIMIT 12`,
      [req.user.nombre_usuario],
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al sugerir artistas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;

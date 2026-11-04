const express = require("express");
const router = express.Router();
const pool = require("../db");

const LIMITE = 20; // resultados por tipo

// Escapa % y _ para que se busquen como texto y no como comodines de SQL
const escaparLike = (texto) => texto.replace(/[\\%_]/g, "\\$&");

// GET /api/buscar?q=texto - Busca eventos, artistas y usuarios (fans)
router.get("/", async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!q) return res.json([]);

    const contiene = `%${escaparLike(q)}%`;
    const empieza = `${escaparLike(q)}%`; // para mostrar primero los que empiezan igual

    // Las tres búsquedas corren a la vez
    const [eventos, artistas, usuarios] = await Promise.all([
      // 1. EVENTOS activos
      pool.query(
        `SELECT id_evento AS id, nombre AS titulo, genero, ciudad AS ubicacion,
                to_char(fecha, 'YYYY-MM-DD') AS fecha, 'evento' AS tipo_resultado
           FROM evento
          WHERE estado = 'activo'
            AND (nombre ILIKE $1 OR genero ILIKE $1 OR pais ILIKE $1
                 OR ciudad ILIKE $1 OR lugar ILIKE $1)
          ORDER BY (nombre ILIKE $2) DESC, (fecha < CURRENT_DATE), fecha ASC
          LIMIT $3`,
        [contiene, empieza, LIMITE],
      ),

      // 2. ARTISTAS: por nombre artístico, usuario, género o nacionalidad
      pool.query(
        `SELECT a.nombre_usuario AS id, a.nombre_artistico AS titulo, a.genero,
                a.nacionalidad AS ubicacion, i.url AS foto_url,
                'artista' AS tipo_resultado
           FROM artista a
           JOIN usuario u ON u.nombre_usuario = a.nombre_usuario
           LEFT JOIN imagen i ON i.id_imagen = u.id_imagen
          WHERE a.nombre_artistico ILIKE $1 OR a.nombre_usuario ILIKE $1
             OR a.genero ILIKE $1 OR a.nacionalidad ILIKE $1
          ORDER BY (a.nombre_artistico ILIKE $2) DESC, a.nombre_artistico
          LIMIT $3`,
        [contiene, empieza, LIMITE],
      ),

      // 3. USUARIOS (fans): por nombre de usuario
      pool.query(
        `SELECT u.nombre_usuario AS id, u.nombre_usuario AS titulo,
                i.url AS foto_url, 'usuario' AS tipo_resultado
           FROM usuario u
           JOIN fan f ON f.nombre_usuario = u.nombre_usuario
           LEFT JOIN imagen i ON i.id_imagen = u.id_imagen
          WHERE u.nombre_usuario ILIKE $1
          ORDER BY (u.nombre_usuario ILIKE $2) DESC, u.nombre_usuario
          LIMIT $3`,
        [contiene, empieza, LIMITE],
      ),
    ]);

    res.json([...eventos.rows, ...artistas.rows, ...usuarios.rows]);
  } catch (error) {
    console.error("Error en el buscador global:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
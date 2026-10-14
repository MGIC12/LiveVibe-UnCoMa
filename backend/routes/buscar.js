const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json([]);
    }

    const parametroBusqueda = `%${q}%`;

    // 1. Buscar coincidencias en EVENTOS
    const sqlEventos = `
      SELECT id_evento AS id, nombre AS titulo, genero, ciudad AS ubicacion, 'evento' AS tipo_resultado 
      FROM eventos
      WHERE nombre ILIKE $1 
         OR genero ILIKE $1 
         OR pais ILIKE $1 
         OR ciudad ILIKE $1;
    `;
    const eventosResult = await pool.query(sqlEventos, [parametroBusqueda]);

    // 2. Buscar coincidencias en ARTISTAS
    const sqlArtistas = `
      SELECT nombre_usuario AS id, nombre_artistico AS titulo, genero, nacionalidad AS ubicacion, 'artista' AS tipo_resultado 
      FROM artista
      WHERE nombre_artistico ILIKE $1 
         OR genero ILIKE $1 
         OR nacionalidad ILIKE $1;
    `;
    const artistasResult = await pool.query(sqlArtistas, [parametroBusqueda]);

    // 3. Unir resultados en un solo arreglo
    const resultadosCombinados = [
      ...eventosResult.rows,
      ...artistasResult.rows,
    ];

    res.json(resultadosCombinados);
  } catch (error) {
    console.error("Error en el buscador global:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;

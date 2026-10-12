// backend/routes/eventos.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/eventos - FEATURE 3: Catálogo con filtros por género y ciudad
router.get("/", async (req, res) => {
  try {
    const { genero, ciudad } = req.query;

    // Consulta SQL base
    let query = "SELECT * FROM eventos WHERE 1=1";
    const values = [];

    // Si el usuario filtra por género
    if (genero) {
      values.push(`%${genero}%`); // Los % le dicen a SQL que busque la palabra en cualquier parte del texto
      query += ` AND genero ILIKE $${values.length}`;
    }

    // Si el usuario filtra por ciudad
    if (ciudad) {
      values.push(`%${ciudad}%`);
      query += ` AND ciudad ILIKE $${values.length}`;
    }

    // Ordenamos por fecha de los más próximos a los más lejanos
    query += " ORDER BY fecha ASC";

    // Ejecutar la consulta en la base de datos
    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener el catálogo de eventos:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al obtener el catálogo" });
  }
});

// GET /api/eventos/:id - Obtener el detalle de un evento específico
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM eventos WHERE id_evento = $1",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener el evento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;

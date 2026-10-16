// backend/routes/eventos.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { verificarToken, requerirRol } = require("../middleware/auth");

// GET /api/eventos - FEATURE 3: Catálogo con filtros por género y ciudad
router.get("/", async (req, res) => {
  try {
    const { genero, ciudad } = req.query;

    // Consulta SQL base
    let query = "SELECT * FROM evento WHERE 1=1";
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

// GET /api/evento/:id - Obtener el detalle de un evento específico
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM evento WHERE id_evento = $1",
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

// Devuelve el texto sin espacios de más ("" si no es texto)
const texto = (valor) => (typeof valor === "string" ? valor.trim() : "");

// Hoy en horario argentino (AAAA-MM-DD), para no depender de la hora del servidor
const hoyEnArgentina = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

// Comprueba formato y que la fecha exista (rechaza 2026-02-31)
function esFechaValida(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const d = new Date(`${fecha}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === fecha;
}

// POST /api/eventos - Un artista crea un evento (y su entrada)
router.post("/", verificarToken, requerirRol("artista"), async (req, res) => {
  const b = req.body;
  const nombre = texto(b.nombre);
  const lugar = texto(b.lugar);
  const ciudad = texto(b.ciudad);
  const fecha = texto(b.fecha);
  const hora = texto(b.hora_apertura);
  const precio = Number(b.precio);
  const cantidad = Number(b.cant_entradas);

  if (!nombre || !lugar || !ciudad || !fecha) {
    return res.status(400).json({ error: "Completá nombre, lugar, ciudad y fecha" });
  }
  if (!esFechaValida(fecha)) {
    return res.status(400).json({ error: "La fecha no es válida" });
  }
  if (fecha < hoyEnArgentina()) {
    return res.status(400).json({ error: "La fecha del evento no puede estar en el pasado" });
  }
  if (hora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
    return res.status(400).json({ error: "La hora no es válida" });
  }
  if (b.precio === "" || !Number.isFinite(precio) || precio < 0 || precio > 10000000) {
    return res.status(400).json({ error: "El precio debe ser un número mayor o igual a 0" });
  }
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 100000) {
    return res.status(400).json({ error: "La cantidad de entradas debe ser un entero mayor a 0" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // El dueño sale del token, nunca del formulario.
    // Si no indica género, se usa el de su perfil de artista.
    const { rows } = await client.query(
      `INSERT INTO evento
         (nombre_artista, nombre, genero, ciudad, pais, lugar, fecha,
          hora_apertura, cant_entradas, clasificacion, gira)
       VALUES ($1::varchar, $2, COALESCE($3::varchar, (SELECT genero FROM artista WHERE nombre_usuario = $1::varchar)),
        $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id_evento`,
      [
        req.user.nombre_usuario,
        nombre,
        texto(b.genero) || null,
        ciudad,
        texto(b.pais) || null,
        lugar,
        fecha,
        hora || null,
        cantidad,
        texto(b.clasificacion) || null,
        texto(b.gira) || null,
      ],
    );

    // La entrada "General" del evento: acá vive el precio
    await client.query(
      `INSERT INTO entrada (id_evento, tipo_acceso, precio, stock)
       VALUES ($1, 'General', $2, $3)`,
      [rows[0].id_evento, Math.round(precio * 100) / 100, cantidad],
    );

    await client.query("COMMIT");
    res.status(201).json({ id_evento: rows[0].id_evento });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "22001") {
      return res.status(400).json({ error: "Alguno de los textos es demasiado largo" });
    }
    if (error.code === "23503") {
      return res.status(404).json({ error: "Artista no encontrado" });
    }
    console.error("Error al crear el evento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    client.release();
  }
});

module.exports = router;

// El carrito es privado: todas las rutas usan el usuario del token.
const express = require("express");
const pool = require("../db");
const { verificarToken, requerirRol } = require("../middleware/auth");

const router = express.Router();
router.use(verificarToken, requerirRol("fan"));

const MAX_CANTIDAD = 99;

const entero = (valor) => /^\d+$/.test(String(valor));

// Si un artículo se agotó (o se dio de baja) sale del carrito; si quedan menos
// unidades que las pedidas, se ajusta la cantidad. Devuelve los avisos para el fan.
async function sanearCarrito(usuario) {
  const avisos = [];

  const { rows: quitados } = await pool.query(
    `DELETE FROM carrito_item ci
      USING articulo a
      WHERE ci.id_articulo = a.id_articulo
        AND ci.nombre_usuario = $1
        AND (a.stock = 0 OR a.activo = FALSE)
      RETURNING a.nombre`,
    [usuario],
  );
  for (const q of quitados) {
    avisos.push(`"${q.nombre}" se agotó y se quitó de tu carrito.`);
  }

  const { rows: ajustados } = await pool.query(
    `UPDATE carrito_item ci
        SET cantidad = a.stock
       FROM articulo a
      WHERE ci.id_articulo = a.id_articulo
        AND ci.nombre_usuario = $1
        AND ci.cantidad > a.stock
      RETURNING a.nombre, a.stock`,
    [usuario],
  );
  for (const a of ajustados) {
    avisos.push(
      `De "${a.nombre}" solo quedan ${a.stock}: ajustamos la cantidad.`,
    );
  }

  return avisos;
}

// GET /api/carrito - Contenido del carrito con el total
router.get("/", async (req, res) => {
  const usuario = req.user.nombre_usuario;
  try {
    const avisos = await sanearCarrito(usuario);

    const { rows: items } = await pool.query(
      `SELECT ci.id_articulo, ci.cantidad,
              a.nombre, a.descripcion, a.precio::float8 AS precio, a.stock,
              a.nombre_artista, ar.nombre_artistico,
              im.url AS imagen_url, im.descripcion AS imagen_descripcion
         FROM carrito_item ci
         JOIN articulo a ON a.id_articulo = ci.id_articulo
         JOIN artista ar ON ar.nombre_usuario = a.nombre_artista
         LEFT JOIN imagen im ON im.id_imagen = a.id_imagen
        WHERE ci.nombre_usuario = $1
        ORDER BY ci.fecha DESC, a.nombre`,
      [usuario],
    );

    const total = items.reduce((suma, i) => suma + i.precio * i.cantidad, 0);
    res.json({ items, total: Math.round(total * 100) / 100, avisos });
  } catch (error) {
    console.error("Error al leer el carrito:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/carrito - Agrega un artículo (si ya estaba, suma la cantidad)
router.post("/", async (req, res) => {
  const usuario = req.user.nombre_usuario;
  const { id_articulo: id, cantidad: pedida = 1 } = req.body ?? {};

  if (!entero(id)) {
    return res.status(400).json({ error: "Artículo no válido" });
  }
  if (!entero(pedida) || Number(pedida) < 1 || Number(pedida) > MAX_CANTIDAD) {
    return res
      .status(400)
      .json({ error: `La cantidad debe estar entre 1 y ${MAX_CANTIDAD}` });
  }
  const cantidad = Number(pedida);

  try {
    const { rows } = await pool.query(
      `SELECT a.nombre, a.stock, a.activo,
              COALESCE((SELECT cantidad FROM carrito_item
                         WHERE nombre_usuario = $2 AND id_articulo = a.id_articulo), 0)
                AS en_carrito
         FROM articulo a
        WHERE a.id_articulo = $1`,
      [id, usuario],
    );
    const articulo = rows[0];

    if (!articulo || !articulo.activo) {
      return res.status(404).json({ error: "El artículo no existe" });
    }
    if (articulo.stock === 0) {
      return res.status(409).json({ error: "El artículo está agotado" });
    }
    if (articulo.en_carrito + cantidad > articulo.stock) {
      const quedan = articulo.stock - articulo.en_carrito;
      return res.status(409).json({
        error:
          quedan > 0
            ? `Solo podés agregar ${quedan} más: el stock es de ${articulo.stock} y ya tenés ${articulo.en_carrito} en el carrito.`
            : `Ya tenés en el carrito todo el stock disponible (${articulo.stock}).`,
      });
    }

    await pool.query(
      `INSERT INTO carrito_item (nombre_usuario, id_articulo, cantidad)
       VALUES ($1, $2, $3)
       ON CONFLICT (nombre_usuario, id_articulo)
       DO UPDATE SET cantidad = carrito_item.cantidad + EXCLUDED.cantidad,
                     fecha = NOW()`,
      [usuario, id, cantidad],
    );

    const { rows: cuenta } = await pool.query(
      "SELECT COALESCE(SUM(cantidad), 0)::int AS unidades FROM carrito_item WHERE nombre_usuario = $1",
      [usuario],
    );
    res.status(201).json({ unidades: cuenta[0].unidades });
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT /api/carrito/:id_articulo - Cambia la cantidad de un artículo del carrito
// Body: { cantidad }
router.put("/:id", async (req, res) => {
  const usuario = req.user.nombre_usuario;
  const { id } = req.params;
  const pedida = req.body?.cantidad;

  if (!entero(id)) {
    return res.status(404).json({ error: "El artículo no está en tu carrito" });
  }
  if (!entero(pedida) || Number(pedida) < 1 || Number(pedida) > MAX_CANTIDAD) {
    return res
      .status(400)
      .json({ error: `La cantidad debe estar entre 1 y ${MAX_CANTIDAD}` });
  }

  try {
    const { rows } = await pool.query(
      `SELECT a.stock, a.activo
         FROM carrito_item ci JOIN articulo a ON a.id_articulo = ci.id_articulo
        WHERE ci.nombre_usuario = $1 AND ci.id_articulo = $2`,
      [usuario, id],
    );
    if (!rows[0]) {
      return res
        .status(404)
        .json({ error: "El artículo no está en tu carrito" });
    }
    if (!rows[0].activo || Number(pedida) > rows[0].stock) {
      return res.status(409).json({
        error: `Solo hay ${rows[0].stock} unidades disponibles`,
      });
    }

    await pool.query(
      "UPDATE carrito_item SET cantidad = $3 WHERE nombre_usuario = $1 AND id_articulo = $2",
      [usuario, id, Number(pedida)],
    );
    res.json({ id_articulo: Number(id), cantidad: Number(pedida) });
  } catch (error) {
    console.error("Error al cambiar la cantidad:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// DELETE /api/carrito/:id_articulo - Quita un artículo del carrito
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!entero(id)) {
    return res.status(404).json({ error: "El artículo no está en tu carrito" });
  }
  try {
    const r = await pool.query(
      "DELETE FROM carrito_item WHERE nombre_usuario = $1 AND id_articulo = $2",
      [req.user.nombre_usuario, id],
    );
    if (r.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "El artículo no está en tu carrito" });
    }
    res.json({ id_articulo: Number(id) });
  } catch (error) {
    console.error("Error al quitar del carrito:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;

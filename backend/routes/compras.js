// Feature 16 — Compra de merchandising.
//
// Estados: pago_pendiente -> en_preparacion -> en_camino -> recibida
//          (cancelada: desde pago_pendiente o en_preparacion; también cuando vence el pago)
const express = require("express");
const pool = require("../db");
const { verificarToken, requerirRol } = require("../middleware/auth");
const { devolverStock, vencerCompras } = require("../utils/compras");

const router = express.Router();
router.use(verificarToken);

const MAX_CANTIDAD = 99;
const entero = (valor) => /^\d+$/.test(String(valor));

// Las compras se devuelven siempre con el mismo formato, con sus artículos adentro
const SELECT_COMPRA = `
  SELECT c.id_compra, c.nombre_usuario, c.nombre_artista, ar.nombre_artistico,
         c.estado, c.total::float8 AS total, c.fecha, c.fecha_vencimiento,
         COALESCE((SELECT json_agg(json_build_object(
                            'id_articulo', i.id_articulo,
                            'nombre', i.nombre,
                            'precio_unitario', i.precio_unitario::float8,
                            'cantidad', i.cantidad) ORDER BY i.nombre)
                     FROM compra_item i WHERE i.id_compra = c.id_compra),
                  '[]'::json) AS items
    FROM compra c
    JOIN artista ar ON ar.nombre_usuario = c.nombre_artista`;

// GET /api/compras/mias - Compras del fan con sesión
router.get("/mias", requerirRol("fan"), async (req, res) => {
  try {
    await vencerCompras(); // las de pago pendiente vencido pasan a canceladas
    const { rows } = await pool.query(
      `${SELECT_COMPRA}
        WHERE c.nombre_usuario = $1
        ORDER BY c.fecha DESC, c.id_compra DESC`,
      [req.user.nombre_usuario],
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al listar las compras:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/compras/ventas - Compras recibidas por el artista con sesión
router.get("/ventas", requerirRol("artista"), async (req, res) => {
  try {
    await vencerCompras();
    const { rows } = await pool.query(
      `${SELECT_COMPRA}
        WHERE c.nombre_artista = $1
        ORDER BY c.fecha DESC, c.id_compra DESC`,
      [req.user.nombre_usuario],
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al listar las ventas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/compras - Compra un artículo puntual, o artículos del carrito
router.post("/", requerirRol("fan"), async (req, res) => {
  const usuario = req.user.nombre_usuario;
  const { id_articulo, cantidad, desde_carrito, articulos } = req.body ?? {};

  let lineas = [];
  const client = await pool.connect();
  try {
    if (desde_carrito) {
      let ids = null;
      if (articulos !== undefined && articulos !== null) {
        if (!Array.isArray(articulos) || !articulos.every(entero)) {
          return res
            .status(400)
            .json({ error: "La lista de artículos no es válida" });
        }
        ids = articulos.map(Number);
      }
      const { rows } = await client.query(
        `SELECT id_articulo, cantidad FROM carrito_item
          WHERE nombre_usuario = $1
            AND ($2::int[] IS NULL OR id_articulo = ANY($2::int[]))`,
        [usuario, ids],
      );
      lineas = rows;
      if (lineas.length === 0) {
        return res
          .status(400)
          .json({ error: "No hay artículos del carrito para comprar" });
      }
    } else {
      const unidades = cantidad === undefined ? 1 : cantidad;
      if (!entero(id_articulo)) {
        return res.status(400).json({ error: "Artículo no válido" });
      }
      if (
        !entero(unidades) ||
        Number(unidades) < 1 ||
        Number(unidades) > MAX_CANTIDAD
      ) {
        return res
          .status(400)
          .json({ error: `La cantidad debe estar entre 1 y ${MAX_CANTIDAD}` });
      }
      lineas = [
        { id_articulo: Number(id_articulo), cantidad: Number(unidades) },
      ];
    }

    await client.query("BEGIN");

    // Se bloquean los artículos (siempre en el mismo orden): dos compras a la vez
    // no pueden llevarse la misma última unidad
    const ids = lineas.map((l) => l.id_articulo).sort((a, b) => a - b);
    const { rows: stock } = await client.query(
      `SELECT id_articulo, nombre, precio, stock, activo, nombre_artista
         FROM articulo
        WHERE id_articulo = ANY($1::int[])
        ORDER BY id_articulo
          FOR UPDATE`,
      [ids],
    );
    const porId = new Map(stock.map((a) => [a.id_articulo, a]));

    for (const l of lineas) {
      const a = porId.get(l.id_articulo);
      if (!a || !a.activo) {
        await client.query("ROLLBACK");
        return res
          .status(404)
          .json({ error: "Un artículo ya no está disponible" });
      }
      if (l.cantidad > a.stock) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          error:
            a.stock === 0
              ? `"${a.nombre}" está agotado`
              : `De "${a.nombre}" solo quedan ${a.stock} unidades`,
        });
      }
    }

    // Se descuenta el stock
    for (const l of lineas) {
      await client.query(
        "UPDATE articulo SET stock = stock - $2 WHERE id_articulo = $1",
        [l.id_articulo, l.cantidad],
      );
    }

    // Una compra por artista
    const porArtista = new Map();
    for (const l of lineas) {
      const a = porId.get(l.id_articulo);
      if (!porArtista.has(a.nombre_artista))
        porArtista.set(a.nombre_artista, []);
      porArtista
        .get(a.nombre_artista)
        .push({ ...l, nombre: a.nombre, precio: a.precio });
    }

    const creadas = [];
    for (const [artista, items] of porArtista) {
      const total = items.reduce(
        (s, i) => s + Number(i.precio) * i.cantidad,
        0,
      );
      const { rows } = await client.query(
        `INSERT INTO compra (nombre_usuario, nombre_artista, total)
         VALUES ($1, $2, $3)
         RETURNING id_compra`,
        [usuario, artista, Math.round(total * 100) / 100],
      );
      const idCompra = rows[0].id_compra;
      creadas.push(idCompra);

      for (const i of items) {
        await client.query(
          `INSERT INTO compra_item (id_compra, id_articulo, nombre, precio_unitario, cantidad)
           VALUES ($1, $2, $3, $4, $5)`,
          [idCompra, i.id_articulo, i.nombre, i.precio, i.cantidad],
        );
      }
    }

    // Lo comprado sale del carrito
    if (desde_carrito) {
      await client.query(
        "DELETE FROM carrito_item WHERE nombre_usuario = $1 AND id_articulo = ANY($2::int[])",
        [usuario, ids],
      );
    }

    await client.query("COMMIT");

    const { rows: compras } = await pool.query(
      `${SELECT_COMPRA} WHERE c.id_compra = ANY($1::int[]) ORDER BY c.id_compra`,
      [creadas],
    );
    res.status(201).json(compras);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Error al comprar:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    client.release();
  }
});

// ---------- Cambios de estado ----------

const NOMBRE_ESTADO = {
  pago_pendiente: "con el pago pendiente",
  en_preparacion: "en preparación",
  en_camino: "en camino",
  cancelada: "cancelada",
  recibida: "recibida",
};

function transicion({ quien, desde, hasta, verbo }) {
  return async (req, res) => {
    const { id } = req.params;
    if (!entero(id)) {
      return res.status(404).json({ error: "Compra no encontrada" });
    }

    const client = await pool.connect();
    try {
      await vencerCompras();
      await client.query("BEGIN");

      // Se bloquea la compra: dos clics seguidos no pueden devolver el stock dos veces
      const { rows } = await client.query(
        `SELECT nombre_usuario, nombre_artista, estado,
                fecha_vencimiento < NOW() AS vencida
           FROM compra
          WHERE id_compra = $1
            FOR UPDATE`,
        [id],
      );
      const compra = rows[0];

      if (!compra) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Compra no encontrada" });
      }

      const duenio =
        quien === "comprador" ? compra.nombre_usuario : compra.nombre_artista;
      if (duenio !== req.user.nombre_usuario) {
        await client.query("ROLLBACK");
        return res
          .status(403)
          .json({ error: "No autorizado para modificar esta compra" });
      }
      if (!desde.includes(compra.estado)) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          error: `No se puede ${verbo}: la compra está ${NOMBRE_ESTADO[compra.estado]}.`,
        });
      }
      if (
        compra.estado === "pago_pendiente" &&
        compra.vencida &&
        hasta !== "cancelada"
      ) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "La compra venció sin pagarse." });
      }

      await client.query("UPDATE compra SET estado = $2 WHERE id_compra = $1", [
        id,
        hasta,
      ]);
      if (hasta === "cancelada") await devolverStock(client, [Number(id)]);

      await client.query("COMMIT");

      const { rows: compras } = await pool.query(
        `${SELECT_COMPRA} WHERE c.id_compra = $1`,
        [id],
      );
      res.json(compras[0]);
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      console.error(`Error al ${verbo} la compra:`, error);
      res.status(500).json({ error: "Error interno del servidor" });
    } finally {
      client.release();
    }
  };
}

// PUT /api/compras/:id/pagar - El fan completa el pago (simulado, sin pasarela)
router.put(
  "/:id/pagar",
  requerirRol("fan"),
  transicion({
    quien: "comprador",
    desde: ["pago_pendiente"],
    hasta: "en_preparacion",
    verbo: "pagar",
  }),
);

// PUT /api/compras/:id/cancelar - El fan cancela mientras no esté en camino
router.put(
  "/:id/cancelar",
  requerirRol("fan"),
  transicion({
    quien: "comprador",
    desde: ["pago_pendiente", "en_preparacion"],
    hasta: "cancelada",
    verbo: "cancelar",
  }),
);

// PUT /api/compras/:id/recibida - El fan confirma que le llegó
router.put(
  "/:id/recibida",
  requerirRol("fan"),
  transicion({
    quien: "comprador",
    desde: ["en_camino"],
    hasta: "recibida",
    verbo: "marcar como recibida",
  }),
);

// PUT /api/compras/:id/enviar - El artista despacha lo que tenía en preparación
router.put(
  "/:id/enviar",
  requerirRol("artista"),
  transicion({
    quien: "vendedor",
    desde: ["en_preparacion"],
    hasta: "en_camino",
    verbo: "enviar",
  }),
);

module.exports = router;

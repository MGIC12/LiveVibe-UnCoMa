// Al comprar se descuenta el stock; si la compra se cancela o vence sin pagarse,
// las unidades vuelven al stock.
const pool = require("../db");
const { avisarVencimientos } = require("./notificacionesMerch");

// Devuelve al stock los artículos de las compras indicadas.
async function devolverStock(client, idsCompra) {
  if (idsCompra.length === 0) return;
  await client.query(
    `UPDATE articulo a
        SET stock = a.stock + x.cant
       FROM (SELECT id_articulo, SUM(cantidad)::int AS cant
               FROM compra_item
              WHERE id_compra = ANY($1::int[]) AND id_articulo IS NOT NULL
              GROUP BY id_articulo) x
      WHERE a.id_articulo = x.id_articulo`,
    [idsCompra],
  );
}

// Las compras con el pago pendiente que pasaron su vencimiento (1 semana) se cancelan
// y devuelven el stock. Devuelve cuántas venció.
async function vencerCompras() {
  const client = await pool.connect();
  let vencidas = [];
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `UPDATE compra
          SET estado = 'cancelada'
        WHERE estado = 'pago_pendiente' AND fecha_vencimiento < NOW()
        RETURNING id_compra`,
    );
    await devolverStock(
      client,
      rows.map((r) => r.id_compra),
    );
    await client.query("COMMIT");
    vencidas = rows.map((r) => r.id_compra);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  // Los avisos van después de confirmar: cada compra se vence una sola vez, así que no se repiten
  await avisarVencimientos(vencidas);
  return vencidas.length;
}

async function vencerComprasSeguro() {
  try {
    await vencerCompras();
  } catch (err) {
    console.error("No se pudieron vencer las compras pendientes:", err);
  }
}

module.exports = { devolverStock, vencerCompras, vencerComprasSeguro };

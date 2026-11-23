// Avisos del merchandising (compras y carrito).
// Ninguna de estas funciones lanza errores: un aviso que falla nunca debe frenar
// la compra, el pago o el envío que ya se hicieron.
const pool = require("../db");
const { notificarUsuario } = require("../middleware/notificaciones");

const formatoPeso = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});
const dinero = (n) => formatoPeso.format(n);

// "2 × Remera, 1 × Gorra y 3 más"
function resumenItems(items = []) {
  const partes = items.slice(0, 3).map((i) => `${i.cantidad} × ${i.nombre}`);
  const resto = items.length - 3;
  return partes.join(", ") + (resto > 0 ? ` y ${resto} más` : "");
}

// ---------- Para el artista ----------

// Un fan hizo una compra (puede haber una por artista)
async function avisarCompraNueva(compras) {
  for (const c of compras) {
    await notificarUsuario(
      c.nombre_artista,
      "venta_nueva",
      `${c.nombre_usuario} compró ${resumenItems(c.items)} por ${dinero(c.total)} (compra #${c.id_compra}). Queda con el pago pendiente.`,
      { origen: c.nombre_usuario },
    );
  }
}

// El fan pagó
async function avisarPago(c) {
  await notificarUsuario(
    c.nombre_artista,
    "venta_pagada",
    `${c.nombre_usuario} pagó la compra #${c.id_compra} por ${dinero(c.total)}. Ya podés prepararla y enviarla.`,
    { origen: c.nombre_usuario },
  );
}

// El fan canceló
async function avisarCancelacion(c) {
  await notificarUsuario(
    c.nombre_artista,
    "venta_cancelada",
    `${c.nombre_usuario} canceló la compra #${c.id_compra} (${dinero(c.total)}). Las unidades volvieron al stock.`,
    { origen: c.nombre_usuario },
  );
}

// ---------- Para el fan ----------

// El artista marcó la compra como enviada
async function avisarEnvio(c) {
  await notificarUsuario(
    c.nombre_usuario,
    "compra_enviada",
    `${c.nombre_artistico} envió tu compra #${c.id_compra}. ¡Ya está en camino!`,
    { origen: c.nombre_artista },
  );
}

// ---------- Para los dos ----------

// Compras que vencieron sin pagarse (se cancelaron solas): se avisa al fan y al artista
async function avisarVencimientos(idsCompra) {
  if (idsCompra.length === 0) return;
  try {
    await pool.query(
      `INSERT INTO notificacion (nombre_destinatario, tipo, mensaje, nombre_origen)
       SELECT c.nombre_usuario, 'compra_vencida',
              'Tu compra #' || c.id_compra || ' de ' || ar.nombre_artistico ||
              ' venció sin pagarse y se canceló. Las unidades volvieron al stock.',
              c.nombre_artista
         FROM compra c
         JOIN artista ar ON ar.nombre_usuario = c.nombre_artista
        WHERE c.id_compra = ANY($1::int[])`,
      [idsCompra],
    );
    await pool.query(
      `INSERT INTO notificacion (nombre_destinatario, tipo, mensaje, nombre_origen)
       SELECT c.nombre_artista, 'venta_cancelada',
              'La compra #' || c.id_compra || ' de ' || c.nombre_usuario ||
              ' venció sin pagarse y se canceló. Las unidades volvieron al stock.',
              c.nombre_usuario
         FROM compra c
        WHERE c.id_compra = ANY($1::int[])`,
      [idsCompra],
    );
  } catch (error) {
    console.error("No se pudieron crear los avisos de compras vencidas:", error);
  }
}

// ---------- Para quienes tienen el artículo en el carrito ----------

// Se agotó un artículo: se avisa a quienes lo tienen en el carrito
// (menos a "excepto": quien acaba de comprarlo). Solo cuenta si el stock quedó en 0.
async function avisarSinStock(idsArticulos, excepto = null) {
  if (idsArticulos.length === 0) return;
  try {
    await pool.query(
      `INSERT INTO notificacion (nombre_destinatario, tipo, mensaje, nombre_origen)
       SELECT ci.nombre_usuario, 'merch_sin_stock',
              'Se agotó "' || a.nombre || '" de ' || ar.nombre_artistico ||
              ', que tenés en tu carrito.',
              a.nombre_artista
         FROM carrito_item ci
         JOIN articulo a ON a.id_articulo = ci.id_articulo
         JOIN artista ar ON ar.nombre_usuario = a.nombre_artista
        WHERE ci.id_articulo = ANY($1::int[])
          AND a.stock = 0
          AND ($2::varchar IS NULL OR ci.nombre_usuario <> $2::varchar)`,
      [idsArticulos, excepto],
    );
  } catch (error) {
    console.error("No se pudieron crear los avisos de artículo agotado:", error);
  }
}

// El artista eliminó un artículo: se avisa a quienes lo tenían en el carrito
async function avisarArticuloEliminado({ artista, nombreArticulo, fans }) {
  if (fans.length === 0) return;
  try {
    const { rows } = await pool.query(
      "SELECT nombre_artistico FROM artista WHERE nombre_usuario = $1",
      [artista],
    );
    const nombre = rows[0]?.nombre_artistico ?? artista;

    await pool.query(
      `INSERT INTO notificacion (nombre_destinatario, tipo, mensaje, nombre_origen)
       SELECT f, 'merch_eliminado', $2::text, $3::varchar
         FROM unnest($1::varchar[]) AS f`,
      [
        fans,
        `${nombre} eliminó "${nombreArticulo}", que tenías en tu carrito. Lo sacamos del carrito.`,
        artista,
      ],
    );
  } catch (error) {
    console.error("No se pudieron crear los avisos de artículo eliminado:", error);
  }
}

module.exports = {
  avisarCompraNueva,
  avisarPago,
  avisarCancelacion,
  avisarEnvio,
  avisarVencimientos,
  avisarSinStock,
  avisarArticuloEliminado,
};
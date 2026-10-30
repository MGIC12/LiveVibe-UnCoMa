// backend/routes/eventos.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { verificarToken, requerirRol } = require("../middleware/auth");
const { notificarSuscriptores, notificarUsuario } = require("../middleware/notificaciones");

// GET /api/eventos - FEATURE 3: Catálogo con filtros por género y ciudad
router.get("/", async (req, res) => {
  try {
    const { genero, ciudad } = req.query;

    // Consulta SQL base
    let query = `SELECT e.*,
       (SELECT MIN(precio)::float8 FROM entrada
         WHERE id_evento = e.id_evento) AS precio_desde,
       (SELECT COALESCE(SUM(stock), 0)::int FROM entrada
         WHERE id_evento = e.id_evento) AS entradas_disponibles
      FROM evento e
      WHERE e.estado = 'activo'`;
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

// GET /api/eventos/mios - Historial completo del artista (todos sus eventos)
router.get("/mios", verificarToken, requerirRol("artista"), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.id_evento, e.nombre, e.genero, e.ciudad, e.pais, e.lugar,
              to_char(e.fecha, 'YYYY-MM-DD') AS fecha,
              to_char(e.hora_apertura, 'HH24:MI') AS hora_apertura,
              e.cant_entradas, e.clasificacion, e.gira, e.estado,
              (SELECT MIN(precio)::float8 FROM entrada
                WHERE id_evento = e.id_evento) AS precio_desde,
              (SELECT COALESCE(SUM(stock), 0)::int FROM entrada
                WHERE id_evento = e.id_evento) AS entradas_disponibles,
              (SELECT COUNT(*)::int FROM reserva r
                WHERE r.id_evento = e.id_evento AND r.estado <> 'cancelada') AS reservas,
              CASE
                WHEN e.estado = 'cancelado' THEN 'cancelado'
                WHEN e.fecha < $2::date THEN 'pasado'
                WHEN e.fecha = $2::date THEN 'hoy'
                ELSE 'proximo'
              END AS situacion
         FROM evento e
        WHERE e.nombre_artista = $1
        ORDER BY e.fecha DESC, e.hora_apertura DESC NULLS LAST, e.id_evento DESC`,
      [req.user.nombre_usuario, hoyEnArgentina()],
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener el historial del artista:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/evento/:id - Obtener el detalle de un evento específico
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
const result = await pool.query(
  `SELECT e.*,
          a.nombre_artistico AS artista_nombre,
          (SELECT MIN(precio)::float8 FROM entrada WHERE id_evento = e.id_evento) AS precio_desde,
          (SELECT COALESCE(SUM(stock), 0)::int FROM entrada WHERE id_evento = e.id_evento) AS entradas_disponibles
     FROM evento e
     LEFT JOIN artista a ON a.nombre_usuario = e.nombre_artista
    WHERE e.id_evento = $1`,
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

// POST /api/eventos/:id/reservar - Un usuario reserva una entrada
router.post("/:id/reservar", verificarToken, async (req, res) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) {
    return res.status(404).json({ error: "Evento no existe" });
  }
  const fan = req.user.nombre_usuario;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Se bloquea el evento: dos reservas simultáneas no pueden pasarse del stock
    const { rows } = await client.query(
      `SELECT nombre, nombre_artista, estado, to_char(fecha, 'YYYY-MM-DD') AS fecha
         FROM evento WHERE id_evento = $1 FOR UPDATE`,
      [id],
    );
    const evento = rows[0];

    if (!evento) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Evento no existe" });
    }
    if (evento.estado === "cancelado") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "El evento fue cancelado." });
    }
    if (evento.fecha < hoyEnArgentina()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El evento ya ocurrió." });
    }

    // Reserva nueva, o reactiva una que el fan había cancelado
    const { rows: reserva } = await client.query(
      `INSERT INTO reserva (id_evento, nombre_usuario, estado)
       VALUES ($1, $2, 'confirmada')
       ON CONFLICT (id_evento, nombre_usuario)
       DO UPDATE SET estado = 'confirmada', fecha_reserva = NOW()
       WHERE reserva.estado = 'cancelada'
       RETURNING *`,
      [id, fan],
    );
    if (reserva.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Ya tienes una reserva para este evento." });
    }

    // Descuenta una entrada, solo si queda stock
    const { rows: entrada } = await client.query(
      `UPDATE entrada SET stock = stock - 1
        WHERE id_evento = $1 AND tipo_acceso = 'General' AND stock > 0
        RETURNING stock`,
      [id],
    );
    if (entrada.length === 0) {
      await client.query("ROLLBACK"); // también deshace la reserva recién insertada
      return res.status(409).json({ error: "Las entradas están agotadas." });
    }

    await client.query("COMMIT");

    // Avisos al artista (después del COMMIT, para no frenar la reserva)
    if (evento.nombre_artista) {
      await notificarUsuario(
        evento.nombre_artista,
        "nueva_reserva",
        `${fan} reservó una entrada para ${evento.nombre}`,
        { idEvento: Number(id), origen: fan },
      );
      if (entrada[0].stock === 0) {
        await notificarUsuario(
          evento.nombre_artista,
          "entradas_agotadas",
          `Se agotaron las entradas de ${evento.nombre}`,
          { idEvento: Number(id) },
        );
      }
    }

    res.status(201).json({ mensaje: "Reserva confirmada", reserva: reserva[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al reservar:", error);
    res.status(500).json({ error: "Error del servidor" });
  } finally {
    client.release();
  }
});

// ---------- Utilidades ----------

// Devuelve el texto sin espacios de más ("" si no es texto)
const texto = (valor) => (typeof valor === "string" ? valor.trim() : "");

// ["la fecha", "el lugar"] -> "la fecha y el lugar"; ["a", "b", "c"] -> "a, b y c"
  const unir = (lista) =>
    lista.length > 1
      ? `${lista.slice(0, -1).join(", ")} y ${lista[lista.length - 1]}`
      : lista[0];


// Hoy en horario argentino (AAAA-MM-DD), para no depender de la hora del servidor
const hoyEnArgentina = () =>
  new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });

// Comprueba formato y que la fecha exista (rechaza 2026-02-31)
function esFechaValida(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const d = new Date(`${fecha}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === fecha;
}

// Valida y limpia los datos del formulario. Sirve para crear y para editar.
function validarEvento(b) {
  const datos = {
    nombre: texto(b.nombre),
    lugar: texto(b.lugar),
    ciudad: texto(b.ciudad),
    pais: texto(b.pais) || null,
    genero: texto(b.genero) || null,
    clasificacion: texto(b.clasificacion) || null,
    gira: texto(b.gira) || null,
    fecha: texto(b.fecha),
    hora: texto(b.hora_apertura) || null,
    precio: Number(b.precio),
    cantidad: Number(b.cant_entradas),
  };

  if (!datos.nombre || !datos.lugar || !datos.ciudad || !datos.fecha) {
    return { error: "Completá nombre, lugar, ciudad y fecha" };
  }
  if (!esFechaValida(datos.fecha)) {
    return { error: "La fecha no es válida" };
  }
  if (datos.fecha < hoyEnArgentina()) {
    return { error: "La fecha del evento no puede estar en el pasado" };
  }
  if (datos.hora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(datos.hora)) {
    return { error: "La hora no es válida" };
  }
  if (
    b.precio === "" ||
    !Number.isFinite(datos.precio) ||
    datos.precio < 0 ||
    datos.precio > 10000000
  ) {
    return { error: "El precio debe ser un número mayor o igual a 0" };
  }
  if (
    !Number.isInteger(datos.cantidad) ||
    datos.cantidad < 1 ||
    datos.cantidad > 100000
  ) {
    return { error: "La cantidad de entradas debe ser un entero mayor a 0" };
  }
  return { datos };
}

// Carga el evento (bloqueándolo) y comprueba que se pueda modificar o cancelar
async function cargarEventoModificable(client, id, usuario) {
  if (!/^\d+$/.test(id)) return { status: 404, error: "Evento no encontrado" };

   const { rows } = await client.query(
    `SELECT nombre, lugar, ciudad, nombre_artista, estado, cant_entradas,
            to_char(fecha, 'YYYY-MM-DD') AS fecha,
            to_char(hora_apertura, 'HH24:MI') AS hora_apertura
       FROM evento WHERE id_evento = $1 FOR UPDATE`,
    [id],
  );
  const evento = rows[0];

  if (!evento) return { status: 404, error: "Evento no encontrado" };
  if (evento.nombre_artista !== usuario) {
    return {
      status: 403,
      error: "Solo el artista que creó el evento puede modificarlo",
    };
  }
  if (evento.estado === "cancelado") {
    return { status: 409, error: "El evento ya está cancelado" };
  }
  if (evento.fecha < hoyEnArgentina()) {
    return {
      status: 409,
      error: "El evento ya ocurrió y no se puede modificar ni cancelar",
    };
  }
  return { evento };
}

function responderError(error, res) {
  if (error.code === "22001") {
    return res
      .status(400)
      .json({ error: "Alguno de los textos es demasiado largo" });
  }
  if (error.code === "23503") {
    return res.status(404).json({ error: "Artista no encontrado" });
  }
  console.error("Error en eventos:", error);
  return res.status(500).json({ error: "Error interno del servidor" });
}

// ---------- Crear ----------

// POST /api/eventos/:id/reservar - Un usuario reserva una entrada
router.post("/:id/reservar", verificarToken, async (req, res) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) {
    return res.status(404).json({ error: "Evento no existe" });
  }
  const fan = req.user.nombre_usuario;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Se bloquea el evento: dos reservas simultáneas no pueden pasarse del stock
    const { rows } = await client.query(
      `SELECT nombre, nombre_artista, estado, to_char(fecha, 'YYYY-MM-DD') AS fecha
         FROM evento WHERE id_evento = $1 FOR UPDATE`,
      [id],
    );
    const evento = rows[0];

    if (!evento) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Evento no existe" });
    }
    if (evento.estado === "cancelado") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "El evento fue cancelado." });
    }
    if (evento.fecha < hoyEnArgentina()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El evento ya ocurrió." });
    }

    // Reserva nueva, o reactiva una que el fan había cancelado
    const { rows: reserva } = await client.query(
      `INSERT INTO reserva (id_evento, nombre_usuario, estado)
       VALUES ($1, $2, 'confirmada')
       ON CONFLICT (id_evento, nombre_usuario)
       DO UPDATE SET estado = 'confirmada', fecha_reserva = NOW()
       WHERE reserva.estado = 'cancelada'
       RETURNING *`,
      [id, fan],
    );
    if (reserva.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Ya tienes una reserva para este evento." });
    }

    // Descuenta una entrada, solo si queda stock
    const { rows: entrada } = await client.query(
      `UPDATE entrada SET stock = stock - 1
        WHERE id_evento = $1 AND tipo_acceso = 'General' AND stock > 0
        RETURNING stock`,
      [id],
    );
    if (entrada.length === 0) {
      await client.query("ROLLBACK"); // también deshace la reserva recién insertada
      return res.status(409).json({ error: "Las entradas están agotadas." });
    }

    await client.query("COMMIT");

    // Avisos al artista (después del COMMIT, para no frenar la reserva)
    if (evento.nombre_artista) {
      await notificarUsuario(
        evento.nombre_artista,
        "nueva_reserva",
        `${fan} reservó una entrada para ${evento.nombre}`,
        { idEvento: Number(id), origen: fan },
      );
      if (entrada[0].stock === 0) {
        await notificarUsuario(
          evento.nombre_artista,
          "entradas_agotadas",
          `Se agotaron las entradas de ${evento.nombre}`,
          { idEvento: Number(id) },
        );
      }
    }

    res.status(201).json({ mensaje: "Reserva confirmada", reserva: reserva[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al reservar:", error);
    res.status(500).json({ error: "Error del servidor" });
  } finally {
    client.release();
  }
});

// ---------- Editar ----------

// PUT /api/eventos/:id - El artista dueño edita su evento (antes de su fecha)
router.put("/:id", verificarToken, requerirRol("artista"), async (req, res) => {
  const { datos, error } = validarEvento(req.body);
  if (error) return res.status(400).json({ error });

  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const r = await cargarEventoModificable(client, id, req.user.nombre_usuario);
    if (r.error) {
      await client.query("ROLLBACK");
      return res.status(r.status).json({ error: r.error });
    }

    // Entradas ya reservadas = capacidad anterior − stock que queda
    const { rows: entradas } = await client.query(
      `SELECT id_entrada, stock, precio::float8 AS precio FROM entrada
        WHERE id_evento = $1 AND tipo_acceso = 'General' FOR UPDATE`,
      [id],
    );
    const reservadas = r.evento.cant_entradas - entradas[0].stock;
    if (datos.cantidad < reservadas) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: `Ya hay ${reservadas} entradas reservadas: la cantidad no puede ser menor`,
      });
    }

    // Qué cambió: solo se avisa de lo que le importa a un fan
    const anterior = r.evento;
    const cambios = [];
    if (anterior.fecha !== datos.fecha) cambios.push("la fecha");
    if ((anterior.hora_apertura ?? null) !== (datos.hora ?? null)) cambios.push("el horario");
    if (anterior.lugar !== datos.lugar || anterior.ciudad !== datos.ciudad) cambios.push("el lugar");
    if (Math.abs(entradas[0].precio - datos.precio) >= 0.01) cambios.push("el precio");

    await client.query(
      `UPDATE evento SET
         nombre = $1,
         genero = COALESCE($2::varchar, (SELECT genero FROM artista WHERE nombre_usuario = $3::varchar)),
         ciudad = $4, pais = $5, lugar = $6, fecha = $7, hora_apertura = $8,
         cant_entradas = $9, clasificacion = $10, gira = $11
       WHERE id_evento = $12`,
      [
        datos.nombre, datos.genero, req.user.nombre_usuario, datos.ciudad, datos.pais,
        datos.lugar, datos.fecha, datos.hora, datos.cantidad, datos.clasificacion, datos.gira, id,
      ],
    );

    // El stock disponible es la nueva capacidad menos lo ya reservado
    await client.query(`UPDATE entrada SET precio = $1, stock = $2 WHERE id_entrada = $3`, [
      Math.round(datos.precio * 100) / 100,
      datos.cantidad - reservadas,
      entradas[0].id_entrada,
    ]);

    await client.query("COMMIT");

    if (cambios.length > 0) {
      await notificarSuscriptores(
        req.user.nombre_usuario,
        "evento_modificado",
        Number(id),
        `cambió ${unir(cambios)} de ${datos.nombre}`,
        true,
      );
    }

    res.json({ id_evento: Number(id) });
  } catch (error) {
    await client.query("ROLLBACK");
    responderError(error, res);
  } finally {
    client.release();
  }
});

// ---------- Cancelar ----------

// PATCH /api/eventos/:id/cancelar - El artista dueño cancela su evento (antes de su fecha)
router.patch("/:id/cancelar", verificarToken, requerirRol("artista"), async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const r = await cargarEventoModificable(client, id, req.user.nombre_usuario);
    if (r.error) {
      await client.query("ROLLBACK");
      return res.status(r.status).json({ error: r.error });
    }

    await client.query("UPDATE evento SET estado = 'cancelado' WHERE id_evento = $1", [id]);

    await client.query("COMMIT");

    // Se avisa a los fans con novedades activas y a quienes tienen una reserva
    await notificarSuscriptores(
      req.user.nombre_usuario,
      "evento_cancelado",
      Number(id),
      `canceló el evento ${r.evento.nombre}`,
      true,
    );

    res.json({ id_evento: Number(id), estado: "cancelado" });
  } catch (error) {
    await client.query("ROLLBACK");
    responderError(error, res);
  } finally {
    client.release();
  }
});

module.exports = router;

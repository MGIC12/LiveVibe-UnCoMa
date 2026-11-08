const express = require("express");
const pool = require("../db");
const { verificarToken, requerirRol } = require("../middleware/auth");
const recibirImagen = require("../middleware/recibirImagen");
const { subirImagen, borrarImagenGuardada } = require("../utils/imagenes");

const router = express.Router();

const MAX_NOMBRE = 120;
const MAX_DESCRIPCION = 500;
const MAX_PRECIO = 9999999.99;
const MAX_STOCK = 100000;

// Los artículos se devuelven siempre con el mismo formato
const SELECT_ARTICULO = `
  SELECT a.id_articulo, a.nombre, a.descripcion, a.precio::float8 AS precio,
         a.stock, a.nombre_artista, ar.nombre_artistico,
         im.url AS imagen_url, im.descripcion AS imagen_descripcion
    FROM articulo a
    JOIN artista ar ON ar.nombre_usuario = a.nombre_artista
    LEFT JOIN imagen im ON im.id_imagen = a.id_imagen`;

const idValido = (id) => /^\d+$/.test(id);

// ---------- Leer ----------

// GET /api/merch - Catálogo de merchandising (público)
// ?artista=<nombre_usuario> -> solo los artículos de ese artista
router.get("/", async (req, res) => {
  const artista =
    typeof req.query.artista === "string" && req.query.artista.trim()
      ? req.query.artista.trim()
      : null;

  try {
    const { rows } = await pool.query(
      `${SELECT_ARTICULO}
        WHERE a.activo = TRUE
          AND ($1::varchar IS NULL OR a.nombre_artista = $1::varchar)
        ORDER BY ar.nombre_artistico, a.nombre`,
      [artista],
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al listar el merchandising:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/merch/mios - Los artículos del artista con sesión (los agotados también)
router.get(
  "/mios",
  verificarToken,
  requerirRol("artista"),
  async (req, res) => {
    try {
      const { rows } = await pool.query(
        `${SELECT_ARTICULO}
        WHERE a.nombre_artista = $1 AND a.activo = TRUE
        ORDER BY a.id_articulo DESC`,
        [req.user.nombre_usuario],
      );
      res.json(rows);
    } catch (error) {
      console.error("Error al listar mis artículos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
);

// ---------- Crear, editar y eliminar (solo el artista dueño) ----------

// Lee y valida los campos del formulario. Devuelve { datos } o { error }.
function leerDatos(body) {
  const nombre = typeof body?.nombre === "string" ? body.nombre.trim() : "";
  const descripcion =
    typeof body?.descripcion === "string" ? body.descripcion.trim() : "";
  const precio = Number(
    String(body?.precio ?? "")
      .trim()
      .replace(",", "."),
  );
  const stockTexto = String(body?.stock ?? "").trim();

  if (!nombre) return { error: "El nombre del artículo es obligatorio" };
  if ([...nombre].length > MAX_NOMBRE) {
    return { error: `El nombre puede tener hasta ${MAX_NOMBRE} caracteres` };
  }
  if ([...descripcion].length > MAX_DESCRIPCION) {
    return {
      error: `La descripción puede tener hasta ${MAX_DESCRIPCION} caracteres`,
    };
  }
  if (!Number.isFinite(precio) || precio < 0 || precio > MAX_PRECIO) {
    return { error: "El precio no es válido" };
  }
  if (!/^\d+$/.test(stockTexto) || Number(stockTexto) > MAX_STOCK) {
    return {
      error: `El stock debe ser un número entero entre 0 y ${MAX_STOCK}`,
    };
  }

  return {
    datos: {
      nombre,
      descripcion: descripcion || null,
      precio: Math.round(precio * 100) / 100,
      stock: Number(stockTexto),
    },
  };
}

// Sube la imagen recibida (si hay) a Cloudinary. Devuelve { subida } o { respuesta: [estado, error] }.
async function subirSiHay(req) {
  if (!req.file) return { subida: null };
  try {
    return { subida: await subirImagen(req.file.buffer, { carpeta: "merch" }) };
  } catch (error) {
    console.error("Error al subir la imagen a Cloudinary:", error.message);
    return {
      respuesta: [
        502,
        "No se pudo subir la imagen. Probá de nuevo en unos minutos.",
      ],
    };
  }
}

// POST /api/merch - Crea un artículo propio (con foto opcional)
// Se envía como multipart/form-data: nombre, descripcion, precio, stock e imagen (archivo, opcional)
router.post(
  "/",
  verificarToken,
  requerirRol("artista"),
  recibirImagen("imagen"),
  async (req, res) => {
    // Primero se revisan los datos: si no sirven, ni siquiera se sube la imagen
    const { datos, error } = leerDatos(req.body);
    if (error) return res.status(400).json({ error });

    const { subida, respuesta } = await subirSiHay(req);
    if (respuesta)
      return res.status(respuesta[0]).json({ error: respuesta[1] });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let idImagen = null;
      if (subida) {
        const { rows } = await client.query(
          "INSERT INTO imagen (descripcion, url, public_id) VALUES ($1, $2, $3) RETURNING id_imagen",
          [
            `Foto de ${datos.nombre}`.slice(0, 200),
            subida.url,
            subida.publicId,
          ],
        );
        idImagen = rows[0].id_imagen;
      }

      // El artista sale del token: solo se puede cargar merch en el propio perfil
      const { rows } = await client.query(
        `INSERT INTO articulo (nombre_artista, nombre, descripcion, precio, stock, id_imagen)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id_articulo`,
        [
          req.user.nombre_usuario,
          datos.nombre,
          datos.descripcion,
          datos.precio,
          datos.stock,
          idImagen,
        ],
      );
      await client.query("COMMIT");

      const { rows: creado } = await pool.query(
        `${SELECT_ARTICULO} WHERE a.id_articulo = $1`,
        [rows[0].id_articulo],
      );
      res.status(201).json(creado[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      // La base falló: la imagen recién subida quedó sin uso
      if (subida) await borrarImagenGuardada({ public_id: subida.publicId });
      console.error("Error al crear el artículo:", err);
      res.status(500).json({ error: "Error interno del servidor" });
    } finally {
      client.release();
    }
  },
);

// PUT /api/merch/:id - Edita un artículo propio
// Mismo formulario que al crear. Si llega "imagen" se reemplaza la foto;
// si llega quitar_imagen=true (y ninguna imagen nueva), se quita.
router.put(
  "/:id",
  verificarToken,
  requerirRol("artista"),
  recibirImagen("imagen"),
  async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) {
      return res.status(404).json({ error: "Artículo no encontrado" });
    }

    const { datos, error } = leerDatos(req.body);
    if (error) return res.status(400).json({ error });

    // El artículo tiene que existir y ser del artista con sesión
    const { rows: previo } = await pool.query(
      `SELECT a.nombre_artista, a.id_imagen, im.url, im.public_id
         FROM articulo a
         LEFT JOIN imagen im ON im.id_imagen = a.id_imagen
        WHERE a.id_articulo = $1`,
      [id],
    );
    if (!previo[0])
      return res.status(404).json({ error: "Artículo no encontrado" });
    if (previo[0].nombre_artista !== req.user.nombre_usuario) {
      return res
        .status(403)
        .json({ error: "Solo podés modificar tus propios artículos" });
    }

    const quitar = req.body?.quitar_imagen === "true" && !req.file;
    const { subida, respuesta } = await subirSiHay(req);
    if (respuesta)
      return res.status(respuesta[0]).json({ error: respuesta[1] });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let idImagen = previo[0].id_imagen;
      if (subida) {
        const { rows } = await client.query(
          "INSERT INTO imagen (descripcion, url, public_id) VALUES ($1, $2, $3) RETURNING id_imagen",
          [
            `Foto de ${datos.nombre}`.slice(0, 200),
            subida.url,
            subida.publicId,
          ],
        );
        idImagen = rows[0].id_imagen;
      } else if (quitar) {
        idImagen = null;
      }

      await client.query(
        `UPDATE articulo
            SET nombre = $2, descripcion = $3, precio = $4, stock = $5, id_imagen = $6
          WHERE id_articulo = $1`,
        [
          id,
          datos.nombre,
          datos.descripcion,
          datos.precio,
          datos.stock,
          idImagen,
        ],
      );

      // La foto anterior ya no se usa: se borra su fila
      const reemplazada =
        previo[0].id_imagen && idImagen !== previo[0].id_imagen;
      if (reemplazada) {
        await client.query("DELETE FROM imagen WHERE id_imagen = $1", [
          previo[0].id_imagen,
        ]);
      }
      await client.query("COMMIT");

      // Y recién después se borra su archivo
      if (reemplazada) await borrarImagenGuardada(previo[0]);

      const { rows: editado } = await pool.query(
        `${SELECT_ARTICULO} WHERE a.id_articulo = $1`,
        [id],
      );
      res.json(editado[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      if (subida) await borrarImagenGuardada({ public_id: subida.publicId });
      console.error("Error al editar el artículo:", err);
      res.status(500).json({ error: "Error interno del servidor" });
    } finally {
      client.release();
    }
  },
);

// DELETE /api/merch/:id - Elimina un artículo propio (y su foto)
// Sale de los carritos; las compras ya hechas conservan su nombre y precio.
router.delete(
  "/:id",
  verificarToken,
  requerirRol("artista"),
  async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) {
      return res.status(404).json({ error: "Artículo no encontrado" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // La condición del dueño va dentro del DELETE: es una sola operación atómica
      const { rows } = await client.query(
        `DELETE FROM articulo
        WHERE id_articulo = $1 AND nombre_artista = $2
        RETURNING id_imagen`,
        [id, req.user.nombre_usuario],
      );

      if (rows.length === 0) {
        await client.query("ROLLBACK");
        const existe = await pool.query(
          "SELECT 1 FROM articulo WHERE id_articulo = $1",
          [id],
        );
        return existe.rowCount === 0
          ? res.status(404).json({ error: "Artículo no encontrado" })
          : res
              .status(403)
              .json({ error: "Solo podés eliminar tus propios artículos" });
      }

      let imagen = null;
      if (rows[0].id_imagen) {
        const r = await client.query(
          "DELETE FROM imagen WHERE id_imagen = $1 RETURNING url, public_id",
          [rows[0].id_imagen],
        );
        imagen = r.rows[0] ?? null;
      }
      await client.query("COMMIT");

      if (imagen) await borrarImagenGuardada(imagen);
      res.json({ id_articulo: Number(id) });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error al eliminar el artículo:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    } finally {
      client.release();
    }
  },
);

module.exports = router;

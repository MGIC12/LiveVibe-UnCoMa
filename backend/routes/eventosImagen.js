const express = require("express");
const pool = require("../db");
const { verificarToken, requerirRol } = require("../middleware/auth");
const recibirImagen = require("../middleware/recibirImagen");
const { subirImagen, borrarImagenGuardada } = require("../utils/imagenes");

const router = express.Router();

// Comprueba que el evento exista y que sea del artista con sesión.
// Se hace ANTES de recibir el archivo, así no se sube nada si no corresponde.
async function cargarEventoPropio(req, res, next) {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(404).json({ error: "Evento no encontrado" });
  }
  try {
    const { rows } = await pool.query(
      `SELECT e.id_evento, e.nombre, e.nombre_artista, e.id_imagen,
              i.url, i.public_id
         FROM evento e
         LEFT JOIN imagen i ON i.id_imagen = e.id_imagen
        WHERE e.id_evento = $1`,
      [req.params.id],
    );
    const evento = rows[0];
    if (!evento) return res.status(404).json({ error: "Evento no encontrado" });
    if (evento.nombre_artista !== req.user.nombre_usuario) {
      return res
        .status(403)
        .json({ error: "Solo el artista que creó el evento puede cambiar su imagen" });
    }
    req.evento = evento;
    next();
  } catch (error) {
    console.error("Error al cargar el evento:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// PUT /api/eventos/:id/imagen - Sube la imagen del evento (o reemplaza la que tenía)
// Se envía como multipart/form-data, con el archivo en el campo "imagen"
router.put(
  "/:id/imagen",
  verificarToken,
  requerirRol("artista"),
  cargarEventoPropio,
  recibirImagen("imagen"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Elegí una imagen JPG, PNG o WebP de hasta 2 MB" });
    }

    // 1) Se sube a Cloudinary
    let subida;
    try {
      subida = await subirImagen(req.file.buffer, { carpeta: "eventos" });
    } catch (error) {
      console.error("Error al subir la imagen a Cloudinary:", error.message);
      return res
        .status(502)
        .json({ error: "No se pudo subir la imagen. Probá de nuevo en unos minutos." });
    }

    // 2) Se guarda en la base y se reemplaza la anterior
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        "INSERT INTO imagen (descripcion, url, public_id) VALUES ($1, $2, $3) RETURNING id_imagen",
        [`Portada de ${req.evento.nombre}`.slice(0, 200), subida.url, subida.publicId],
      );
      await client.query("UPDATE evento SET id_imagen = $1 WHERE id_evento = $2", [
        rows[0].id_imagen,
        req.evento.id_evento,
      ]);
      // La imagen anterior ya no se usa: se borra su fila
      if (req.evento.id_imagen) {
        await client.query("DELETE FROM imagen WHERE id_imagen = $1", [req.evento.id_imagen]);
      }
      await client.query("COMMIT");

      // Y recién después se borra su archivo (de Cloudinary, o del disco si era una de las de antes)
      if (req.evento.id_imagen) await borrarImagenGuardada(req.evento);

      res.json({ imagen_url: subida.url });
    } catch (error) {
      await client.query("ROLLBACK");
      // La base falló: la imagen recién subida quedó sin uso y se borra de Cloudinary
      await borrarImagenGuardada({ public_id: subida.publicId });
      console.error("Error al guardar la imagen del evento:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    } finally {
      client.release();
    }
  },
);

// DELETE /api/eventos/:id/imagen - Quita la imagen (el evento vuelve a la portada automática)
router.delete(
  "/:id/imagen",
  verificarToken,
  requerirRol("artista"),
  cargarEventoPropio,
  async (req, res) => {
    try {
      // evento.id_imagen tiene ON DELETE SET NULL: al borrar la fila, el evento queda sin imagen
      if (req.evento.id_imagen) {
        await pool.query("DELETE FROM imagen WHERE id_imagen = $1", [req.evento.id_imagen]);
        await borrarImagenGuardada(req.evento);
      }
      res.json({ imagen_url: null });
    } catch (error) {
      console.error("Error al quitar la imagen del evento:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
);

module.exports = router;
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const pool = require("../db");
const { verificarToken, requerirRol } = require("../middleware/auth");

const router = express.Router();

// Por ahora las imágenes se guardan en el disco del servidor (backend/uploads).
// Cuando pasemos a Cloudinary cambian la configuración de multer y las funciones de archivo.
const CARPETA = path.join(__dirname, "..", "uploads");
const EXTENSIONES = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
const MAX_BYTES = 2 * 1024 * 1024;

const subir = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(CARPETA, { recursive: true });
      cb(null, CARPETA);
    },
    // El nombre es aleatorio y la extensión sale del tipo real, no del nombre que trae el archivo
    filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${EXTENSIONES[file.mimetype]}`),
  }),
  limits: { fileSize: MAX_BYTES },
  // Si el tipo no es válido, el archivo se descarta y req.file queda vacío
  fileFilter: (req, file, cb) => cb(null, Boolean(EXTENSIONES[file.mimetype])),
});

// Recibe el archivo del campo "imagen" y devuelve un error claro si algo falla
function recibirImagen(req, res, next) {
  subir.single("imagen")(req, res, (error) => {
    if (error) {
      const mensaje =
        error.code === "LIMIT_FILE_SIZE"
          ? "La imagen no puede superar los 2 MB"
          : "No se pudo recibir la imagen";
      return res.status(400).json({ error: mensaje });
    }
    next();
  });
}

// Borra un archivo de la carpeta de imágenes (si no existe, no pasa nada)
function borrarArchivo(url) {
  if (!url || !url.startsWith("/uploads/")) return;
  fs.unlink(path.join(CARPETA, path.basename(url)), () => {});
}

// Comprueba que el evento exista y que sea del artista con sesión.
// Se hace ANTES de recibir el archivo, así no se guarda nada si no corresponde.
async function cargarEventoPropio(req, res, next) {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(404).json({ error: "Evento no encontrado" });
  }
  try {
    const { rows } = await pool.query(
      `SELECT e.id_evento, e.nombre, e.nombre_artista, e.id_imagen, i.url AS imagen_url
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
  recibirImagen,
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Elegí una imagen JPG, PNG o WebP de hasta 2 MB" });
    }

    const url = `/uploads/${req.file.filename}`;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        "INSERT INTO imagen (descripcion, url) VALUES ($1, $2) RETURNING id_imagen",
        [`Portada de ${req.evento.nombre}`.slice(0, 200), url],
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

      borrarArchivo(req.evento.imagen_url); // y también su archivo
      res.json({ imagen_url: url });
    } catch (error) {
      await client.query("ROLLBACK");
      borrarArchivo(url); // se descarta el archivo nuevo, que quedó sin usar
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
        borrarArchivo(req.evento.imagen_url);
      }
      res.json({ imagen_url: null });
    } catch (error) {
      console.error("Error al quitar la imagen del evento:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
);

module.exports = router;
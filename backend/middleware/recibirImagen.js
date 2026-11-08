const multer = require("multer");

const TIPOS = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

const subir = multer({
  storage: multer.memoryStorage(), // el archivo queda en req.file.buffer
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    if (TIPOS.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Solo se permiten imágenes JPG, PNG o WebP"));
  },
});

// Uso: recibirImagen("imagen") recibe el archivo del campo "imagen" y lo deja en req.file
module.exports = function recibirImagen(campo = "imagen") {
  return (req, res, next) => {
    subir.single(campo)(req, res, (error) => {
      if (error) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "La imagen no puede superar los 2 MB" });
        }
        // El mensaje de nuestro filtro es claro; los errores internos de multer, no
        const mensaje =
          error instanceof multer.MulterError ? "No se pudo recibir la imagen" : error.message;
        return res.status(400).json({ error: mensaje });
      }
      next();
    });
  };
};
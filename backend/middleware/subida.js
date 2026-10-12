const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const CARPETA_UPLOADS = path.join(__dirname, "..", "uploads");
fs.mkdirSync(CARPETA_UPLOADS, { recursive: true });

// Solo estos formatos, y la extensión la ponemos nosotros
const EXTENSIONES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: CARPETA_UPLOADS,
    // Nombre generado: nunca se usa el nombre que trae el archivo
    filename: (req, file, cb) =>
      cb(null, crypto.randomUUID() + EXTENSIONES[file.mimetype]),
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    if (EXTENSIONES[file.mimetype]) return cb(null, true);
    cb(new Error("Solo se permiten imágenes JPG, PNG o WebP"));
  },
});

// Envuelve a multer para devolver los errores como JSON
function subirFoto(req, res, next) {
  upload.single("imagen")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "La imagen no puede superar los 2 MB" });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}

// Borra un archivo de uploads (si existe), sin romper nada si falla
function borrarArchivo(nombre) {
  if (!nombre) return;
  fs.unlink(path.join(CARPETA_UPLOADS, path.basename(nombre)), () => {});
}

module.exports = { subirFoto, borrarArchivo, CARPETA_UPLOADS };
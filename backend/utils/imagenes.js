const fs = require("fs");
const path = require("path");
const { v2: cloudinary } = require("cloudinary");

// Cloudinary se configura solo con la variable de entorno CLOUDINARY_URL
// (formato: cloudinary://API_KEY:API_SECRET@CLOUD_NAME). "secure" hace que las direcciones sean https.
cloudinary.config({ secure: true });

if (!cloudinary.config().cloud_name) {
  console.warn(
    "⚠️  Cloudinary no está configurado (falta CLOUDINARY_URL): no se van a poder subir imágenes nuevas.",
  );
}

// Carpeta donde se guardaban las imágenes antes de usar Cloudinary
const CARPETA_LOCAL = path.join(__dirname, "..", "uploads");

// Sube una imagen (un Buffer) a Cloudinary. Devuelve { url, publicId }.
// "carpeta" ordena las imágenes dentro del panel de Cloudinary.
function subirImagen(buffer, { carpeta = "otros", transformacion } = {}) {
  return new Promise((resolve, reject) => {
    const flujo = cloudinary.uploader.upload_stream(
      {
        folder: `livevibe/${carpeta}`,
        resource_type: "image",
        // Si es muy grande se achica (nunca se agranda), para ahorrar espacio
        transformation: transformacion ?? [{ width: 1600, height: 1600, crop: "limit" }],
      },
      (error, resultado) => {
        if (error) return reject(error);
        resolve({ url: resultado.secure_url, publicId: resultado.public_id });
      },
    );
    flujo.end(buffer);
  });
}

// Borra una imagen de donde esté guardada:
// - en Cloudinary, si tiene public_id
// - en el disco del servidor, si es una imagen de antes (url que empieza con /uploads/)
// Si falla, solo queda en el log: nunca debe frenar la operación principal.
async function borrarImagenGuardada({ url, public_id: publicId } = {}) {
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId, { invalidate: true });
    } catch (error) {
      console.error("No se pudo borrar la imagen de Cloudinary:", error.message);
    }
    return;
  }
  if (url && url.startsWith("/uploads/")) {
    fs.unlink(path.join(CARPETA_LOCAL, path.basename(url)), () => {});
  }
}

module.exports = { subirImagen, borrarImagenGuardada };
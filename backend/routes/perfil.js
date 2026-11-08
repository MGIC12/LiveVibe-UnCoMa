const express = require("express");
const pool = require("../db");
const { verificarToken, requerirRol } = require("../middleware/auth");
const recibirImagen = require("../middleware/recibirImagen");
const { subirImagen, borrarImagenGuardada } = require("../utils/imagenes");
const { texto, validarDatosArtista } = require("../middleware/artista");

const router = express.Router();

// PUT /api/perfil -> el fan o el artista modifica los datos de su perfil
router.put("/", verificarToken, requerirRol("fan", "artista"), async (req, res) => {
  const usuario = req.user.nombre_usuario;
  const esArtista = req.user.rol === "artista";
  const biografia = texto(req.body.biografia);

  if (biografia.length > 500) {
    return res.status(400).json({ error: "La biografía puede tener hasta 500 caracteres" });
  }

  // Los datos propios de cada tipo de cuenta se validan antes de abrir la transacción
  let artista = null;
  let cancion = null;
  if (esArtista) {
    const r = validarDatosArtista(req.body);
    if (r.error) return res.status(400).json({ error: r.error });
    artista = r.datos;
  } else {
    cancion = texto(req.body.cancion_favorita);
    if (cancion.length > 150) {
      return res.status(400).json({ error: "La canción favorita puede tener hasta 150 caracteres" });
    }
    cancion = cancion || null;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query("UPDATE usuario SET biografia = $1 WHERE nombre_usuario = $2", [
      biografia || null,
      usuario,
    ]);

    if (esArtista) {
      await client.query(
        `UPDATE artista
            SET nombre_artistico = $1, nacionalidad = $2, genero = $3, tipo_artista = $4
          WHERE nombre_usuario = $5`,
        [artista.nombre_artistico, artista.nacionalidad, artista.genero, artista.tipo_artista, usuario],
      );

      // Los integrantes se reemplazan por la lista nueva
      await client.query("DELETE FROM integrante WHERE nombre_usuario = $1", [usuario]);
      for (const i of artista.integrantes) {
        await client.query(
          `INSERT INTO integrante (nombre_usuario, nombre, apellido, instrumento, fecha_nac, nacionalidad)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [usuario, i.nombre, i.apellido, i.instrumento, i.fecha_nac, i.nacionalidad],
        );
      }

      await client.query("COMMIT");
      return res.json({ biografia: biografia || null, ...artista });
    }

    await client.query("UPDATE fan SET cancion_favorita = $1 WHERE nombre_usuario = $2", [
      cancion,
      usuario,
    ]);
    await client.query("COMMIT");
    return res.json({ biografia: biografia || null, cancion_favorita: cancion });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "22001") {
      return res.status(400).json({ error: "Alguno de los textos es demasiado largo" });
    }
    if (err.code === "22007" || err.code === "22008") {
      return res.status(400).json({ error: "Alguna fecha no es válida" });
    }
    console.error(err);
    return res.status(500).json({ error: "Error del servidor" });
  } finally {
    client.release();
  }
});

// PUT /api/perfil/foto -> cualquier usuario con sesión cambia su foto de perfil
router.put("/foto", verificarToken, recibirImagen("imagen"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Elegí una imagen" });
  }

  const usuario = req.user.nombre_usuario;
  const descripcion = (req.body.descripcion || `Foto de perfil de ${usuario}`)
    .trim()
    .slice(0, 200);

  // 1) Se sube a Cloudinary, recortada en cuadrado (la foto de perfil se muestra en círculo)
  let subida;
  try {
    subida = await subirImagen(req.file.buffer, {
      carpeta: "perfiles",
      transformacion: [{ width: 600, height: 600, crop: "fill", gravity: "auto" }],
    });
  } catch (error) {
    console.error("Error al subir la foto a Cloudinary:", error.message);
    return res
      .status(502)
      .json({ error: "No se pudo subir la imagen. Probá de nuevo en unos minutos." });
  }

  // 2) Se guarda en la base y se reemplaza la anterior
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Foto actual del usuario (si tiene)
    const { rows: actual } = await client.query(
      `SELECT i.id_imagen, i.url, i.public_id
         FROM usuario u
         LEFT JOIN imagen i ON i.id_imagen = u.id_imagen
        WHERE u.nombre_usuario = $1`,
      [usuario],
    );
    if (!actual[0]) {
      await client.query("ROLLBACK");
      await borrarImagenGuardada({ public_id: subida.publicId });
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // a) se crea la imagen nueva
    const { rows: nueva } = await client.query(
      `INSERT INTO imagen (descripcion, url, public_id) VALUES ($1, $2, $3)
       RETURNING id_imagen, url, descripcion`,
      [descripcion, subida.url, subida.publicId],
    );
    // b) el usuario pasa a apuntar a ella
    await client.query("UPDATE usuario SET id_imagen = $1 WHERE nombre_usuario = $2", [
      nueva[0].id_imagen,
      usuario,
    ]);
    // c) se elimina la imagen anterior
    if (actual[0].id_imagen) {
      await client.query("DELETE FROM imagen WHERE id_imagen = $1", [actual[0].id_imagen]);
    }

    await client.query("COMMIT");

    // El archivo viejo se borra solo si todo salió bien (de Cloudinary, o del disco si era una de las de antes)
    if (actual[0].id_imagen) await borrarImagenGuardada(actual[0]);

    return res.json({ foto_url: nueva[0].url, foto_descripcion: nueva[0].descripcion });
  } catch (err) {
    await client.query("ROLLBACK");
    // La base falló: la imagen recién subida quedó sin uso y se borra de Cloudinary
    await borrarImagenGuardada({ public_id: subida.publicId });
    console.error(err);
    return res.status(500).json({ error: "Error del servidor" });
  } finally {
    client.release();
  }
});

// DELETE /api/perfil/foto -> quita la foto de perfil
router.delete("/foto", verificarToken, async (req, res) => {
  const usuario = req.user.nombre_usuario;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT i.id_imagen, i.url, i.public_id
         FROM usuario u
         LEFT JOIN imagen i ON i.id_imagen = u.id_imagen
        WHERE u.nombre_usuario = $1`,
      [usuario],
    );

    if (rows[0]?.id_imagen) {
      // Al borrar la imagen, ON DELETE SET NULL deja usuario.id_imagen en NULL
      await client.query("DELETE FROM imagen WHERE id_imagen = $1", [rows[0].id_imagen]);
    }

    await client.query("COMMIT");
    if (rows[0]?.id_imagen) await borrarImagenGuardada(rows[0]);
    return res.json({ foto_url: null, foto_descripcion: null });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Error del servidor" });
  } finally {
    client.release();
  }
});

module.exports = router;
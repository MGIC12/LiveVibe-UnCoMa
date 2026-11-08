const express = require("express");
const pool = require("../db");
const { verificarToken, requerirRol, tokenOpcional } = require("../middleware/auth");
const recibirImagen = require("../middleware/recibirImagen");
const { subirImagen, borrarImagenGuardada } = require("../utils/imagenes");
const { notificarNuevaPublicacion } = require("../middleware/notificaciones");

const router = express.Router();

const MAX_CONTENIDO = 500;
const MAX_COMENTARIO = 300;

// Quiénes pueden publicar, comentar y dar "me gusta"
const PUEDEN_INTERACTUAR = ["fan", "artista"];

// Las publicaciones se devuelven siempre con el mismo formato.
// $1 es el usuario que mira (puede ser null si es un visitante).
const SELECT_PUBLICACION = `
  SELECT p.id_publicacion, p.nombre_autor, p.contenido, p.fecha_publicacion,
         u.rol AS rol_autor,
         a.nombre_artistico,
         av.url AS autor_foto_url, av.descripcion AS autor_foto_descripcion,
         im.url AS imagen_url, im.descripcion AS imagen_descripcion,
         (SELECT COUNT(*)::int FROM me_gusta g
           WHERE g.id_publicacion = p.id_publicacion) AS cant_likes,
         (SELECT COUNT(*)::int FROM comentario c
           WHERE c.id_publicacion = p.id_publicacion) AS cant_comentarios,
         EXISTS (SELECT 1 FROM me_gusta g
                  WHERE g.id_publicacion = p.id_publicacion
                    AND g.nombre_usuario = $1::varchar) AS me_gusto
    FROM publicacion p
    JOIN usuario u ON u.nombre_usuario = p.nombre_autor
    LEFT JOIN artista a ON a.nombre_usuario = p.nombre_autor
    LEFT JOIN imagen av ON av.id_imagen = u.id_imagen
    LEFT JOIN imagen im ON im.id_imagen = p.id_imagen`;

const idValido = (id) => /^\d+$/.test(id);

// ---------- Leer ----------

// GET /api/publicaciones/feed - Las publicaciones más nuevas de toda la comunidad (públicas)
// ?filtro=siguiendo -> solo las de quienes sigue el usuario con sesión
// ?rol=artista | ?rol=fan -> solo las de ese tipo de cuenta
router.get("/feed", tokenOpcional, async (req, res) => {
  const usuario = req.user?.nombre_usuario ?? null;
  const soloSeguidos = req.query.filtro === "siguiendo";
  const rol = ["artista", "fan"].includes(req.query.rol) ? req.query.rol : null;

  if (soloSeguidos && !usuario) {
    return res
      .status(401)
      .json({ error: "Iniciá sesión para ver las publicaciones de quienes seguís" });
  }

  try {
    const { rows } = await pool.query(
      `${SELECT_PUBLICACION}
        WHERE ($2::boolean = false
               OR p.nombre_autor IN (
                    SELECT nombre_seguido FROM seguimiento
                     WHERE nombre_seguidor = $1::varchar AND tipo = 'sigue'))
          AND ($3::varchar IS NULL OR u.rol = $3::varchar)
        ORDER BY p.fecha_publicacion DESC, p.id_publicacion DESC
        LIMIT 30`,
      [usuario, soloSeguidos, rol],
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al armar el feed:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/publicaciones/usuario/:usuario - Publicaciones de un perfil (públicas)
router.get("/usuario/:usuario", tokenOpcional, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `${SELECT_PUBLICACION}
        WHERE p.nombre_autor = $2
        ORDER BY p.fecha_publicacion DESC, p.id_publicacion DESC
        LIMIT 50`,
      [req.user?.nombre_usuario ?? null, req.params.usuario],
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al listar las publicaciones:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ---------- Publicar y eliminar ----------

// POST /api/publicaciones - Publica en el propio perfil (con imagen opcional)
// Se envía como multipart/form-data: contenido (texto) e imagen (archivo, opcional)
router.post("/", verificarToken, requerirRol(...PUEDEN_INTERACTUAR), recibirImagen("imagen"), async (req, res) => {
  const autor = req.user.nombre_usuario;
  const contenido =
    typeof req.body?.contenido === "string" ? req.body.contenido.trim() : "";

  // Primero se revisa el texto: si no sirve, ni siquiera se sube la imagen
  if (!contenido) {
    return res.status(400).json({ error: "La publicación no puede estar vacía" });
  }
  if ([...contenido].length > MAX_CONTENIDO) {
    return res
      .status(400)
      .json({ error: `La publicación puede tener hasta ${MAX_CONTENIDO} caracteres` });
  }

  const descripcion =
    (typeof req.body?.descripcion === "string" ? req.body.descripcion.trim() : "")
      .slice(0, 200) || `Imagen de una publicación de ${autor}`;

  // 1) Si trae imagen, se sube a Cloudinary
  let subida = null;
  if (req.file) {
    try {
      subida = await subirImagen(req.file.buffer, { carpeta: "publicaciones" });
    } catch (error) {
      console.error("Error al subir la imagen a Cloudinary:", error.message);
      return res
        .status(502)
        .json({ error: "No se pudo subir la imagen. Probá de nuevo en unos minutos." });
    }
  }

  // 2) Se guarda en la base
  const client = await pool.connect();
  let guardada = false; // pasa a true cuando la publicación ya quedó confirmada en la base
  try {
    await client.query("BEGIN");

    let idImagen = null;
    if (subida) {
      const { rows } = await client.query(
        "INSERT INTO imagen (descripcion, url, public_id) VALUES ($1, $2, $3) RETURNING id_imagen",
        [descripcion, subida.url, subida.publicId],
      );
      idImagen = rows[0].id_imagen;
    }

    // El autor sale del token: solo se puede publicar en el propio perfil
    const { rows } = await client.query(
      `INSERT INTO publicacion (nombre_autor, contenido, id_imagen)
       VALUES ($1, $2, $3)
       RETURNING id_publicacion`,
      [autor, contenido, idImagen],
    );

    await client.query("COMMIT");
    guardada = true;

    await notificarNuevaPublicacion(autor, contenido);

    // Se devuelve con el mismo formato que la lista, así la pantalla la muestra directo
    const { rows: nueva } = await pool.query(
      `${SELECT_PUBLICACION} WHERE p.id_publicacion = $2`,
      [autor, rows[0].id_publicacion],
    );
    res.status(201).json(nueva[0]);
  } catch (error) {
    // Si la publicación ya se guardó, la imagen se queda: está en uso
    if (!guardada) {
      await client.query("ROLLBACK");
      if (subida) await borrarImagenGuardada({ public_id: subida.publicId });
    }
    if (error.code === "23503") {
      return res.status(404).json({ error: "No se encontró tu cuenta" });
    }
    console.error("Error al crear la publicación:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    client.release();
  }
});

// DELETE /api/publicaciones/:id - Solo el autor puede eliminarla (y se borra su imagen)
router.delete("/:id", verificarToken, async (req, res) => {
  const { id } = req.params;
  if (!idValido(id)) {
    return res.status(404).json({ error: "Publicación no encontrada" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // La condición del autor va dentro del DELETE: es una sola operación atómica
    const { rows } = await client.query(
      `DELETE FROM publicacion
        WHERE id_publicacion = $1 AND nombre_autor = $2
        RETURNING id_imagen`,
      [id, req.user.nombre_usuario],
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      // No se borró nada: ¿no existe o no es suya?
      const existe = await pool.query(
        "SELECT 1 FROM publicacion WHERE id_publicacion = $1",
        [id],
      );
      return existe.rowCount === 0
        ? res.status(404).json({ error: "Publicación no encontrada" })
        : res.status(403).json({ error: "Solo el autor puede eliminar una publicación" });
    }

    // La imagen de la publicación también se elimina (la fila y el archivo)
    let imagen = null;
    if (rows[0].id_imagen) {
      const r = await client.query(
        "DELETE FROM imagen WHERE id_imagen = $1 RETURNING url, public_id",
        [rows[0].id_imagen],
      );
      imagen = r.rows[0] ?? null;
    }

    await client.query("COMMIT");

    // El archivo se borra recién cuando todo salió bien (de Cloudinary, o del disco si es una de las de antes)
    if (imagen) await borrarImagenGuardada(imagen);

    res.json({ id_publicacion: Number(id) });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al eliminar la publicación:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    client.release();
  }
});

// ---------- Comentarios ----------

// GET /api/publicaciones/:id/comentarios - Comentarios agrupados por hilo (públicos)
router.get("/:id/comentarios", async (req, res) => {
  const { id } = req.params;
  if (!idValido(id)) {
    return res.status(404).json({ error: "Publicación no encontrada" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT c.id_comentario, c.id_comentario_padre, c.nombre_autor,
              c.contenido, c.fecha_hora,
              u.rol AS rol_autor, a.nombre_artistico,
              i.url AS foto_url, i.descripcion AS foto_descripcion
         FROM comentario c
         JOIN usuario u ON u.nombre_usuario = c.nombre_autor
         LEFT JOIN artista a ON a.nombre_usuario = c.nombre_autor
         LEFT JOIN imagen i ON i.id_imagen = u.id_imagen
        WHERE c.id_publicacion = $1
        ORDER BY c.fecha_hora ASC, c.id_comentario ASC`,
      [id],
    );

    // Se arma el árbol: los comentarios principales, cada uno con sus respuestas
    const porId = new Map(rows.map((c) => [c.id_comentario, { ...c, respuestas: [] }]));
    const principales = [];
    for (const nodo of porId.values()) {
      const padre = nodo.id_comentario_padre && porId.get(nodo.id_comentario_padre);
      if (padre) padre.respuestas.push(nodo);
      else principales.push(nodo);
    }

    res.json(principales);
  } catch (error) {
    console.error("Error al listar los comentarios:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/publicaciones/:id/comentarios - Comenta, o responde a un comentario
// Body: { contenido, id_comentario_padre? }
router.post("/:id/comentarios", verificarToken, requerirRol(...PUEDEN_INTERACTUAR), async (req, res) => {
  const { id } = req.params;
  if (!idValido(id)) {
    return res.status(404).json({ error: "Publicación no encontrada" });
  }

  const contenido =
    typeof req.body?.contenido === "string" ? req.body.contenido.trim() : "";
  if (!contenido) {
    return res.status(400).json({ error: "El comentario no puede estar vacío" });
  }
  if ([...contenido].length > MAX_COMENTARIO) {
    return res
      .status(400)
      .json({ error: `El comentario puede tener hasta ${MAX_COMENTARIO} caracteres` });
  }

  const idPadre = req.body?.id_comentario_padre ?? null;
  const padre = idPadre === null ? null : Number(idPadre);
  if (padre !== null && !Number.isInteger(padre)) {
    return res.status(400).json({ error: "El comentario a responder no es válido" });
  }

  try {
    const publicacion = await pool.query(
      "SELECT 1 FROM publicacion WHERE id_publicacion = $1",
      [id],
    );
    if (publicacion.rowCount === 0) {
      return res.status(404).json({ error: "Publicación no encontrada" });
    }

    // Si responde a una respuesta, queda dentro del mismo hilo (un solo nivel)
    let hilo = null;
    if (padre !== null) {
      const { rows } = await pool.query(
        `SELECT id_comentario, id_comentario_padre
           FROM comentario
          WHERE id_comentario = $1 AND id_publicacion = $2`,
        [padre, id],
      );
      if (!rows[0]) {
        return res
          .status(404)
          .json({ error: "El comentario que querés responder no existe" });
      }
      hilo = rows[0].id_comentario_padre ?? rows[0].id_comentario;
    }

    const { rows } = await pool.query(
      `INSERT INTO comentario (id_publicacion, nombre_autor, id_comentario_padre, contenido)
       VALUES ($1, $2, $3, $4)
       RETURNING id_comentario, id_comentario_padre, nombre_autor, contenido, fecha_hora`,
      [id, req.user.nombre_usuario, hilo, contenido],
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === "23503") {
      return res
        .status(404)
        .json({ error: "La publicación o el comentario ya no existen" });
    }
    console.error("Error al crear el comentario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ---------- Me gusta ----------

// Cuántos "me gusta" tiene la publicación y si este usuario ya dio el suyo
async function estadoMeGusta(idPublicacion, usuario) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS cant_likes,
            COALESCE(BOOL_OR(nombre_usuario = $2::varchar), false) AS me_gusto
       FROM me_gusta
      WHERE id_publicacion = $1`,
    [idPublicacion, usuario],
  );
  return rows[0];
}

// POST /api/publicaciones/:id/me-gusta - "Me gusta" en publicaciones de otros (una sola vez)
router.post("/:id/me-gusta", verificarToken, requerirRol(...PUEDEN_INTERACTUAR), async (req, res) => {
  const { id } = req.params;
  if (!idValido(id)) {
    return res.status(404).json({ error: "Publicación no encontrada" });
  }
  const usuario = req.user.nombre_usuario;

  try {
    const { rows } = await pool.query(
      "SELECT nombre_autor FROM publicacion WHERE id_publicacion = $1",
      [id],
    );
    if (!rows[0]) {
      return res.status(404).json({ error: "Publicación no encontrada" });
    }
    if (rows[0].nombre_autor === usuario) {
      return res
        .status(403)
        .json({ error: "No podés dar me gusta a tu propia publicación" });
    }

    // Si ya existía, no hace nada: el resultado es el mismo sin importar cuántas veces se pida
    const r = await pool.query(
      `INSERT INTO me_gusta (id_publicacion, nombre_usuario)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [id, usuario],
    );

    res.status(r.rowCount === 1 ? 201 : 200).json(await estadoMeGusta(id, usuario));
  } catch (error) {
    if (error.code === "23503") {
      return res.status(404).json({ error: "Publicación no encontrada" });
    }
    console.error("Error al dar me gusta:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// DELETE /api/publicaciones/:id/me-gusta - Quita el "me gusta" propio
router.delete("/:id/me-gusta", verificarToken, requerirRol(...PUEDEN_INTERACTUAR), async (req, res) => {
  const { id } = req.params;
  if (!idValido(id)) {
    return res.status(404).json({ error: "Publicación no encontrada" });
  }
  const usuario = req.user.nombre_usuario;

  try {
    const existe = await pool.query(
      "SELECT 1 FROM publicacion WHERE id_publicacion = $1",
      [id],
    );
    if (existe.rowCount === 0) {
      return res.status(404).json({ error: "Publicación no encontrada" });
    }

    await pool.query(
      "DELETE FROM me_gusta WHERE id_publicacion = $1 AND nombre_usuario = $2",
      [id, usuario],
    );

    res.json(await estadoMeGusta(id, usuario));
  } catch (error) {
    console.error("Error al quitar me gusta:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
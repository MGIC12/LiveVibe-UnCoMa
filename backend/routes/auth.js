const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { verificarToken } = require("../middleware/auth");

const router = express.Router();

// Desde el registro público solo se puede elegir fan o artista (nunca admin)
const ROLES_PUBLICOS = ["fan", "artista"];

function firmarToken(usuario) {
  return jwt.sign(
    { nombre_usuario: usuario.nombre_usuario, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
}

// ---------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------
router.post("/register", async (req, res) => {
  const {
    nombre_usuario,
    email,
    contrasenia,
    fecha_nac,
    biografia,
    rol,
    // datos de artista
    nombre_artistico,
    nacionalidad,
    genero,
    tipo_artista,
    // datos de fan
    cancion_favorita,
  } = req.body;

  if (!nombre_usuario || !email || !contrasenia || !rol) {
    return res.status(400).json({ error: "Completá usuario, email, contraseña y tipo de cuenta" });
  }
  if (!ROLES_PUBLICOS.includes(rol)) {
    return res.status(400).json({ error: "El tipo de cuenta debe ser fan o artista" });
  }
  if (contrasenia.length < 8) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
  }
  if (rol === "artista" && !nombre_artistico) {
    return res.status(400).json({ error: "Los artistas deben indicar su nombre artístico" });
  }

  const client = await pool.connect();
  try {
    const hash = await bcrypt.hash(contrasenia, 10);

    await client.query("BEGIN");

    await client.query(
      `INSERT INTO usuario (nombre_usuario, email, contrasenia_hash, fecha_nac, biografia, rol)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        nombre_usuario.trim(),
        email.trim().toLowerCase(),
        hash,
        fecha_nac || null,
        biografia || null,
        rol,
      ]
    );

    if (rol === "artista") {
      await client.query(
        `INSERT INTO artista (nombre_usuario, nombre_artistico, nacionalidad, genero, tipo_artista)
         VALUES ($1, $2, $3, $4, $5)`,
        [nombre_usuario.trim(), nombre_artistico, nacionalidad || null, genero || null, tipo_artista || null]
      );
    } else {
      await client.query(
        `INSERT INTO fan (nombre_usuario, cancion_favorita) VALUES ($1, $2)`,
        [nombre_usuario.trim(), cancion_favorita || null]
      );
    }

    await client.query("COMMIT");

    const usuario = { nombre_usuario: nombre_usuario.trim(), rol };
    return res.status(201).json({
      token: firmarToken(usuario),
      usuario: { ...usuario, email: email.trim().toLowerCase() },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      // violación de UNIQUE / PRIMARY KEY
      return res.status(409).json({ error: "Ese usuario o email ya está registrado" });
    }
    console.error(err);
    return res.status(500).json({ error: "Error del servidor" });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------
// POST /api/auth/login   (acepta nombre de usuario o email)
// ---------------------------------------------------------------
router.post("/login", async (req, res) => {
  const { usuario, contrasenia } = req.body;

  if (typeof usuario !== "string" || typeof contrasenia !== "string" || !usuario || !contrasenia) {
    return res.status(400).json({ error: "Ingresá usuario y contraseña" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT nombre_usuario, email, contrasenia_hash, rol
         FROM usuario
        WHERE nombre_usuario = $1 OR email = $2`,
      [usuario.trim(), usuario.trim().toLowerCase()]
    );

    const fila = rows[0];
    // Mismo mensaje si falla el usuario o la contraseña, para no dar pistas
    const ok = fila && (await bcrypt.compare(contrasenia, fila.contrasenia_hash));
    if (!ok) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    return res.json({
      token: firmarToken(fila),
      usuario: { nombre_usuario: fila.nombre_usuario, email: fila.email, rol: fila.rol },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error del servidor" });
  }
});

// ---------------------------------------------------------------
// GET /api/auth/me   (devuelve el usuario dueño del token)
// ---------------------------------------------------------------
router.get("/me", verificarToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.nombre_usuario, u.email, u.rol, u.biografia, u.fecha_alta,
              f.cancion_favorita
         FROM usuario u
         LEFT JOIN fan f ON f.nombre_usuario = u.nombre_usuario
        WHERE u.nombre_usuario = $1`,
      [req.user.nombre_usuario]
    );
    if (!rows[0]) return res.status(404).json({ error: "Usuario no encontrado" });
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error del servidor" });
  }
});

module.exports = router;
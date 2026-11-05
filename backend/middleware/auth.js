const jwt = require("jsonwebtoken");

// Exige un token válido en el header:  Authorization: Bearer <token>
function verificarToken(req, res, next) {
  const header = req.headers.authorization || "";
  const [tipo, token] = header.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ error: "Falta el token de autenticación" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { nombre_usuario, rol }
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o vencido" });
  }
}

// Uso: router.post("/evento", verificarToken, requerirRol("artista"), ...)
function requerirRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ error: "No tenés permisos para esta acción" });
    }
    next();
  };
}

// Igual que verificarToken, pero si no hay sesión sigue adelante sin usuario.
// Sirve para rutas públicas que muestran algo extra a quien inició sesión.
function tokenOpcional(req, res, next) {
  const header = req.headers.authorization || "";
  const [tipo, token] = header.split(" ");

  if (tipo === "Bearer" && token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Token vencido o inválido: se trata como un visitante
    }
  }
  next();
}

module.exports = { verificarToken, requerirRol, tokenOpcional};
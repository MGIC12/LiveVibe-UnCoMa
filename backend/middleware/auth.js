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

// Uso: router.post("/eventos", verificarToken, requerirRol("artista"), ...)
function requerirRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ error: "No tenés permisos para esta acción" });
    }
    next();
  };
}

module.exports = { verificarToken, requerirRol };
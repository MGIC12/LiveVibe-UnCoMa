const rateLimit = require("express-rate-limit");

// Respuesta común cuando se pasa el límite
const mensaje = (texto) => ({ error: texto });

// Inicio de sesión: solo cuentan los intentos fallidos (los correctos no gastan el límite)
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: mensaje("Demasiados intentos. Probá de nuevo en unos minutos."),
});

// Registro: evita crear cuentas en masa desde una misma dirección
const limiteRegistro = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: mensaje("Se crearon demasiadas cuentas desde esta conexión. Probá más tarde."),
});

// Chatbot: cada consulta gasta cuota de la IA
const limiteChatbot = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: mensaje("Estás escribiendo muy rápido. Esperá un momento y probá de nuevo."),
});

// Recomendaciones y soundtrack también llaman a la IA
const limiteIA = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: mensaje("Demasiadas consultas. Probá de nuevo en un minuto."),
});

module.exports = { limiteLogin, limiteRegistro, limiteChatbot, limiteIA };

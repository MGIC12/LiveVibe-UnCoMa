const express = require("express");
const router = express.Router();
const pool = require("../db");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { verificarToken } = require("../middleware/auth");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL;
const TIMEOUT_MS = 10000;

// Modelos principales
const modelTexto = genAI.getGenerativeModel({ model: MODEL_NAME });
const modelJSON = genAI.getGenerativeModel({
  model: MODEL_NAME,
  generationConfig: { responseMimeType: "application/json" },
});

// Modelos de respaldo (solo si definís GEMINI_FALLBACK_MODEL)
const modelTextoFallback = FALLBACK_MODEL
  ? genAI.getGenerativeModel({ model: FALLBACK_MODEL })
  : null;
const modelJSONFallback = FALLBACK_MODEL
  ? genAI.getGenerativeModel({
      model: FALLBACK_MODEL,
      generationConfig: { responseMimeType: "application/json" },
    })
  : null;

const esTemporal = (e) =>
  e.status === 503 || e.status === 429 || e.name === "AbortError";

// Reintenta 2 veces con el modelo principal y 1 con el de respaldo
async function generar(principal, respaldo, prompt) {
  const intentos = [principal, principal, respaldo].filter(Boolean);
  let ultimoError;
  for (const modelo of intentos) {
    try {
      return await modelo.generateContent(prompt, { timeout: TIMEOUT_MS });
    } catch (e) {
      ultimoError = e;
      if (!esTemporal(e)) throw e; // errores reales (key, modelo) no se reintentan
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw ultimoError;
}

// Feature 10: Asistente Virtual del Fan
router.post("/chatbot", async (req, res) => {
  try {
    const { mensaje } = req.body;
    console.log("Chatbot recibió:", mensaje);

    const eventosRes = await pool.query(
      "SELECT id_evento, nombre, genero, ciudad, lugar, fecha FROM evento WHERE estado = 'activo' AND fecha >= CURRENT_DATE",
    );
    const eventos = eventosRes.rows;

    const prompt = `
      Eres el asistente virtual de LiveVibe, una plataforma de venta de entradas.
      Responde de forma breve, amable y en lenguaje natural.
      Contexto estricto de eventos disponibles: ${JSON.stringify(eventos)}.
      Reglas:
      1. Solo recomienda eventos de este contexto. No inventes fechas ni lugares.
      2. Guía al usuario a reservar su entrada en la plataforma.
      Pregunta del usuario: "${mensaje}"
    `;

    const result = await generar(modelTexto, modelTextoFallback, prompt);
    res.json({ respuesta: result.response.text() });
  } catch (error) {
    console.error("Error en chatbot IA:", error);
    res.status(500).json({
      error:
        "Lo siento, ocurrió un error temporal al procesar tu consulta con la IA.",
    });
  }
});

// Feature 9: Recomendador Personalizado
router.get("/recomendaciones", verificarToken, async (req, res) => {
  try {
    const username = req.user.nombre_usuario;

    const userRes = await pool.query(
      "SELECT biografia FROM usuario WHERE nombre_usuario = $1",
      [username],
    );
    const preferencias = userRes.rows[0]?.biografia || "Rock, Pop, Indie";

    const eventosRes = await pool.query(
      "SELECT id_evento, nombre, genero, ciudad FROM evento WHERE estado = 'activo' AND fecha >= CURRENT_DATE",
    );
    if (eventosRes.rows.length === 0) return res.json([]);

    const prompt = `
      El usuario tiene estas preferencias musicales: "${preferencias}".
      Eventos disponibles: ${JSON.stringify(eventosRes.rows)}.
      Devuelve ÚNICAMENTE un arreglo JSON con los IDs (id_evento) numéricos de los 3 eventos de mayor similitud.
      Ejemplo: [1, 4, 5].
    `;

    const result = await generar(modelJSON, modelJSONFallback, prompt);
    const idsRecomendados = JSON.parse(result.response.text());

    if (!Array.isArray(idsRecomendados)) return res.json([]);

    const eventosRecomendados = eventosRes.rows.filter((e) =>
      idsRecomendados.includes(e.id_evento),
    );
    res.json(eventosRecomendados);
  } catch (error) {
    console.error("Error IA Recomendador:", error);
    res.status(500).json({ error: "No se pudieron generar recomendaciones." });
  }
});

module.exports = router;

const express = require("express");
const cors = require("cors");
const { initDb } = require("./db");
const eventosRoutes = require("./routes/eventos");
const buscarRoutes = require("./routes/buscar");
const artistasRoutes = require("./routes/artistas");
const reservasRoutes = require("./routes/reservas");
const iaRoutes = require("./routes/ia");
const { limiteLogin, limiteRegistro } = require("./middleware/limites");
const { sincronizarInsigniasSeguro } = require("./utils/insignias");
const { vencerComprasSeguro } = require("./utils/compras");
// Sin esta clave no se pueden firmar ni verificar sesiones: mejor no arrancar
if (!process.env.JWT_SECRET) {
  console.error("Falta JWT_SECRET en backend/.env (ver .env.example). El servidor no puede iniciar.");
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 5000;
const path = require("path");

// Origen permitido del frontend: FRONTEND_URL (varias separadas por coma); por defecto, el de desarrollo
const origenes = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: origenes }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("¡Backend de LiveVibe funcionando!");
});

// Límites de intentos antes de las rutas de autenticación
app.use("/api/auth/login", limiteLogin);
app.use("/api/auth/register", limiteRegistro);
app.use("/api/auth", require("./routes/auth"));

app.use("/api/perfil", require("./routes/perfil"));

app.use("/api/usuarios", require("./routes/usuarios"));

app.use("/api/artistas", require("./routes/artistas"));

app.use("/api/eventos", eventosRoutes);

app.use("/api/eventos", require("./routes/eventosImagen"));

app.use("/api/buscar", buscarRoutes);

app.use("/api/artistas", artistasRoutes);

app.use("/api/reservas", reservasRoutes);

app.use("/api/notificaciones", require("./routes/notificaciones"));

app.use("/api/publicaciones", require("./routes/publicaciones"));

app.use("/api/ia", iaRoutes);

app.use("/api/preferencias", require("./routes/preferencias"));

app.use("/api/merch", require("./routes/merch"));

app.use("/api/carrito", require("./routes/carrito"));

app.use("/api/compras", require("./routes/compras"));

// Crear las tablas antes de empezar a escuchar
initDb()
  .then(() => {
    // Insignias se actualizan al arrancar y después cada 10 minutos
    sincronizarInsigniasSeguro();
    setInterval(sincronizarInsigniasSeguro, 10 * 60 * 1000);
    // Merch: las compras con el pago vencido se cancelan y devuelven el stock
    vencerComprasSeguro();
    setInterval(vencerComprasSeguro, 10 * 60 * 1000);

    app.listen(port, () =>
      console.log(`Servidor escuchando en el puerto ${port}`),
    );
  })
  .catch((err) => {
    console.error("No se pudo conectar a la base de datos", err);
    process.exit(1);
  });

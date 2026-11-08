const express = require("express");
const cors = require("cors");
const { initDb } = require("./db");
const eventosRoutes = require("./routes/eventos");
const buscarRoutes = require("./routes/buscar");
const artistasRoutes = require("./routes/artistas");
const reservasRoutes = require("./routes/reservas");
const iaRoutes = require("./routes/ia");
const { sincronizarInsigniasSeguro } = require("./utils/insignias");
const { vencerComprasSeguro } = require("./utils/compras");
const app = express();
const port = 5000;
const path = require("path");

app.use(cors({ origin: "http://localhost:3000" }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("¡Backend de LiveVibe funcionando!");
});

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

    app.listen(5000, () =>
      console.log("Servidor escuchando en el puerto 5000"),
    );
  })
  .catch((err) => {
    console.error("No se pudo conectar a la base de datos", err);
    process.exit(1);
  });

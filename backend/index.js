const express = require("express");
const cors = require("cors");
const { initDb } = require("./db");
const app = express();
const port = 5000;

app.use(cors({ origin: "http://localhost:3000" }));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("¡Backend de LiveVibe funcionando!");
});

app.use("/api/auth", require("./routes/auth"));

app.use("/api/perfil", require("./routes/perfil"));

// Crear las tablas antes de empezar a escuchar
initDb()
  .then(() => app.listen(5000, () => console.log("Servidor escuchando en el puerto 5000")))
  .catch((err) => {
    console.error("No se pudo conectar a la base de datos", err);
    process.exit(1);
  });
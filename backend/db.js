const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const schema = `
CREATE TABLE IF NOT EXISTS usuario (
  nombre_usuario   VARCHAR(30)  PRIMARY KEY,
  email            VARCHAR(255) NOT NULL UNIQUE,
  contrasenia_hash VARCHAR(255) NOT NULL,
  fecha_nac        DATE,
  fecha_alta       TIMESTAMP    NOT NULL DEFAULT NOW(),
  biografia        TEXT,
  rol              VARCHAR(10)  NOT NULL CHECK (rol IN ('fan', 'artista', 'admin'))
);

CREATE TABLE IF NOT EXISTS artista (
  nombre_usuario  VARCHAR(30) PRIMARY KEY
                  REFERENCES usuario(nombre_usuario) ON DELETE CASCADE,
  nombre_artistico VARCHAR(100) NOT NULL,
  nacionalidad     VARCHAR(60),
  genero           VARCHAR(60),
  tipo_artista     VARCHAR(60)
);

CREATE TABLE IF NOT EXISTS fan (
  nombre_usuario   VARCHAR(30) PRIMARY KEY
                   REFERENCES usuario(nombre_usuario) ON DELETE CASCADE,
  cancion_favorita VARCHAR(150),
  insignia         VARCHAR(60)
);

CREATE TABLE IF NOT EXISTS admin (
  nombre_usuario VARCHAR(30) PRIMARY KEY
                 REFERENCES usuario(nombre_usuario) ON DELETE CASCADE
);

CREATE TABLE eventos (
    id_evento SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    genero VARCHAR(100),
    ciudad VARCHAR(100),
    pais VARCHAR(100),
    lugar VARCHAR(255),
    fecha DATE NOT NULL,
    hora_apertura TIME,
    cant_entradas INT,
    clasificacion VARCHAR(100),
    gira VARCHAR(255),
    id_artista INT
);
`;

async function initDb() {
  await pool.query(schema);
  console.log("Tablas verificadas/creadas");
}

module.exports = pool;
module.exports.initDb = initDb;

const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const schema = `

CREATE TABLE IF NOT EXISTS imagen (
  id_imagen   SERIAL       PRIMARY KEY,
  descripcion VARCHAR(200),
  url         VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS usuario (
  nombre_usuario   VARCHAR(30)  PRIMARY KEY,
  email            VARCHAR(255) NOT NULL UNIQUE,
  contrasenia_hash VARCHAR(255) NOT NULL,
  fecha_nac        DATE,
  fecha_alta       TIMESTAMP    NOT NULL DEFAULT NOW(),
  biografia        TEXT,
  rol              VARCHAR(10)  NOT NULL CHECK (rol IN ('fan', 'artista', 'admin'))
);

ALTER TABLE usuario
  ADD COLUMN IF NOT EXISTS id_imagen INTEGER
  REFERENCES imagen(id_imagen) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS artista (
  nombre_usuario  VARCHAR(30) PRIMARY KEY
                  REFERENCES usuario(nombre_usuario) ON DELETE CASCADE,
  nombre_artistico VARCHAR(100) NOT NULL,
  nacionalidad     VARCHAR(60),
  genero           VARCHAR(60),
  tipo_artista     VARCHAR(60)
);

-- tipo_artista: solo 'solista' (por defecto) o 'banda'
UPDATE artista SET tipo_artista = 'solista'
 WHERE tipo_artista IS NULL OR tipo_artista NOT IN ('solista', 'banda');
ALTER TABLE artista ALTER COLUMN tipo_artista SET DEFAULT 'solista';
ALTER TABLE artista ALTER COLUMN tipo_artista SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'artista_tipo_check') THEN
    ALTER TABLE artista
      ADD CONSTRAINT artista_tipo_check CHECK (tipo_artista IN ('solista', 'banda'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS integrante (
  id_integrante  SERIAL       PRIMARY KEY,
  nombre_usuario VARCHAR(30)  NOT NULL
                 REFERENCES artista(nombre_usuario) ON DELETE CASCADE,
  nombre         VARCHAR(100) NOT NULL,
  apellido       VARCHAR(100) NOT NULL,
  instrumento    VARCHAR(60),
  fecha_nac      DATE,
  nacionalidad   VARCHAR(60)
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

CREATE TABLE IF NOT EXISTS eventos (
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

CREATE TABLE IF NOT EXISTS reservas (
    id_reserva SERIAL PRIMARY KEY,
    id_evento INT REFERENCES eventos(id_evento) ON DELETE CASCADE,
    nombre_usuario VARCHAR(30) REFERENCES usuario(nombre_usuario) ON DELETE CASCADE,
    estado VARCHAR(20) DEFAULT 'confirmada' CHECK (estado IN ('pendiente', 'confirmada', 'cancelada', 'asistió')),
    fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_evento, nombre_usuario)
);
`;

async function initDb() {
  await pool.query(schema);
  console.log("Tablas verificadas/creadas");
}

module.exports = pool;
module.exports.initDb = initDb;

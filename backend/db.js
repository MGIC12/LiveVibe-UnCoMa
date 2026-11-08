const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const schema = `

CREATE TABLE IF NOT EXISTS imagen (
  id_imagen   SERIAL       PRIMARY KEY,
  descripcion VARCHAR(200),
  url         VARCHAR(255) NOT NULL
);

-- Identificación de la imagen en Cloudinary (necesaria para borrarla). Las imágenes viejas, guardadas en el servidor, no la tienen.
ALTER TABLE imagen ADD COLUMN IF NOT EXISTS public_id VARCHAR(255);

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

CREATE TABLE IF NOT EXISTS seguimiento (
  nombre_seguidor VARCHAR(30) NOT NULL
                  REFERENCES usuario(nombre_usuario) ON DELETE CASCADE,
  nombre_seguido  VARCHAR(30) NOT NULL
                  REFERENCES usuario(nombre_usuario) ON DELETE CASCADE,
  tipo            VARCHAR(10) NOT NULL CHECK (tipo IN ('sigue', 'novedades')),
  fecha           TIMESTAMP   NOT NULL DEFAULT NOW(),
  PRIMARY KEY (nombre_seguidor, nombre_seguido, tipo),
  CHECK (nombre_seguidor <> nombre_seguido)
);

CREATE INDEX IF NOT EXISTS idx_seguimiento_seguido
  ON seguimiento (nombre_seguido, tipo);

DO $$
BEGIN
  IF to_regclass('public.sigue') IS NOT NULL THEN
    INSERT INTO seguimiento (nombre_seguidor, nombre_seguido, tipo, fecha)
      SELECT nombre_fan, nombre_artista, 'sigue', fecha FROM sigue
      ON CONFLICT DO NOTHING;
    DROP TABLE sigue;
  END IF;

  IF to_regclass('public.sigue_fan') IS NOT NULL THEN
    INSERT INTO seguimiento (nombre_seguidor, nombre_seguido, tipo, fecha)
      SELECT nombre_seguidor, nombre_seguido, 'sigue', fecha FROM sigue_fan
      ON CONFLICT DO NOTHING;
    DROP TABLE sigue_fan;
  END IF;

  IF to_regclass('public.suscripcion_novedades') IS NOT NULL THEN
    INSERT INTO seguimiento (nombre_seguidor, nombre_seguido, tipo, fecha)
      SELECT nombre_fan, nombre_artista, 'novedades', fecha FROM suscripcion_novedades
      ON CONFLICT DO NOTHING;
    DROP TABLE suscripcion_novedades;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS evento (
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
    nombre_artista VARCHAR(30)
      REFERENCES artista(nombre_usuario) ON DELETE CASCADE
);

ALTER TABLE evento
  ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'activo'
  CHECK (estado IN ('activo', 'cancelado'));

ALTER TABLE evento
  ADD COLUMN IF NOT EXISTS id_imagen INT
  REFERENCES imagen(id_imagen) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS entrada (
    id_entrada     SERIAL PRIMARY KEY,
    id_evento      INT NOT NULL REFERENCES evento(id_evento) ON DELETE CASCADE,
    tipo_acceso    VARCHAR(60) NOT NULL DEFAULT 'General',
    zona           VARCHAR(60),
    fila           VARCHAR(10),
    numero_asiento INT,
    precio         NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    stock          INT NOT NULL CHECK (stock >= 0)
);

CREATE TABLE IF NOT EXISTS reserva (
    id_reserva SERIAL PRIMARY KEY,
    id_evento INT REFERENCES evento(id_evento) ON DELETE CASCADE,
    nombre_usuario VARCHAR(50) REFERENCES usuario(nombre_usuario) ON DELETE CASCADE,
    estado VARCHAR(20) DEFAULT 'confirmada' CHECK (estado IN ('pendiente', 'confirmada', 'cancelada', 'asistió')),
    fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_evento, nombre_usuario)
);

CREATE TABLE IF NOT EXISTS notificacion (
  id_notificacion     SERIAL      PRIMARY KEY,
  nombre_destinatario VARCHAR(30) NOT NULL
                      REFERENCES usuario(nombre_usuario) ON DELETE CASCADE,
  tipo                VARCHAR(30) NOT NULL
                      CHECK (tipo IN ('nuevo_seguidor', 'nueva_reserva', 'entradas_agotadas',
                                      'evento_nuevo', 'evento_modificado', 'evento_cancelado',
                                      'nueva_publicacion')),
  mensaje             TEXT        NOT NULL,
  id_evento           INT REFERENCES evento(id_evento) ON DELETE CASCADE,
  nombre_origen       VARCHAR(30) REFERENCES usuario(nombre_usuario) ON DELETE SET NULL,
  leida               BOOLEAN     NOT NULL DEFAULT FALSE,
  fecha               TIMESTAMP   NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'notificacion_tipo_check'
       AND pg_get_constraintdef(oid) LIKE '%nueva_publicacion%'
  ) THEN
    ALTER TABLE notificacion DROP CONSTRAINT IF EXISTS notificacion_tipo_check;
    ALTER TABLE notificacion ADD CONSTRAINT notificacion_tipo_check
      CHECK (tipo IN ('nuevo_seguidor', 'nueva_reserva', 'entradas_agotadas',
                      'evento_nuevo', 'evento_modificado', 'evento_cancelado',
                      'nueva_publicacion'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notificacion_destinatario
  ON notificacion (nombre_destinatario, leida, fecha DESC);

CREATE TABLE IF NOT EXISTS publicacion (
  id_publicacion    SERIAL      PRIMARY KEY,
  nombre_autor      VARCHAR(30) NOT NULL
                    REFERENCES usuario(nombre_usuario) ON DELETE CASCADE,
  contenido         TEXT        NOT NULL CHECK (char_length(contenido) BETWEEN 1 AND 500),
  fecha_publicacion TIMESTAMP   NOT NULL DEFAULT NOW(),
  id_imagen         INT         REFERENCES imagen(id_imagen) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_publicacion_autor
  ON publicacion (nombre_autor, fecha_publicacion DESC);
CREATE INDEX IF NOT EXISTS idx_publicacion_fecha
  ON publicacion (fecha_publicacion DESC);

CREATE TABLE IF NOT EXISTS comentario (
  id_comentario       SERIAL      PRIMARY KEY,
  id_publicacion      INT         NOT NULL
                      REFERENCES publicacion(id_publicacion) ON DELETE CASCADE,
  nombre_autor        VARCHAR(30) NOT NULL
                      REFERENCES usuario(nombre_usuario) ON DELETE CASCADE,
  id_comentario_padre INT
                      REFERENCES comentario(id_comentario) ON DELETE CASCADE,
  contenido           TEXT        NOT NULL CHECK (char_length(contenido) BETWEEN 1 AND 300),
  fecha_hora          TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comentario_publicacion
  ON comentario (id_publicacion, fecha_hora);

CREATE TABLE IF NOT EXISTS me_gusta (
  id_publicacion INT         NOT NULL
                 REFERENCES publicacion(id_publicacion) ON DELETE CASCADE,
  nombre_usuario VARCHAR(30) NOT NULL
                 REFERENCES usuario(nombre_usuario) ON DELETE CASCADE,
  fecha          TIMESTAMP   NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_publicacion, nombre_usuario)
);

CREATE TABLE IF NOT EXISTS articulo (
  id_articulo    SERIAL        PRIMARY KEY,
  nombre_artista VARCHAR(30)   NOT NULL
                 REFERENCES artista(nombre_usuario) ON DELETE CASCADE,
  nombre         VARCHAR(120)  NOT NULL,
  descripcion    TEXT,
  precio         NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  stock          INT           NOT NULL DEFAULT 0 CHECK (stock >= 0),
  id_imagen      INT           REFERENCES imagen(id_imagen) ON DELETE SET NULL,
  activo         BOOLEAN       NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_articulo_artista ON articulo (nombre_artista);

-- Carrito: una fila por artículo y por fan (el carrito es privado)
CREATE TABLE IF NOT EXISTS carrito_item (
  nombre_usuario VARCHAR(30) NOT NULL
                 REFERENCES usuario(nombre_usuario) ON DELETE CASCADE,
  id_articulo    INT         NOT NULL
                 REFERENCES articulo(id_articulo) ON DELETE CASCADE,
  cantidad       INT         NOT NULL CHECK (cantidad >= 1),
  fecha          TIMESTAMP   NOT NULL DEFAULT NOW(),
  PRIMARY KEY (nombre_usuario, id_articulo)
);

CREATE TABLE IF NOT EXISTS compra (
  id_compra         SERIAL        PRIMARY KEY,
  nombre_usuario    VARCHAR(30)   NOT NULL
                    REFERENCES usuario(nombre_usuario) ON DELETE CASCADE,
  nombre_artista    VARCHAR(30)   NOT NULL
                    REFERENCES artista(nombre_usuario) ON DELETE CASCADE,
  estado            VARCHAR(20)   NOT NULL DEFAULT 'pago_pendiente'
                    CHECK (estado IN ('pago_pendiente', 'en_preparacion', 'en_camino',
                                      'cancelada', 'recibida')),
  total             NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  fecha             TIMESTAMP     NOT NULL DEFAULT NOW(),
  fecha_vencimiento TIMESTAMP     NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_compra_usuario ON compra (nombre_usuario, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_compra_artista ON compra (nombre_artista, fecha DESC);

CREATE TABLE IF NOT EXISTS compra_item (
  id_compra       INT           NOT NULL
                  REFERENCES compra(id_compra) ON DELETE CASCADE,
  id_articulo     INT           REFERENCES articulo(id_articulo) ON DELETE SET NULL,
  nombre          VARCHAR(120)  NOT NULL,
  precio_unitario NUMERIC(10,2) NOT NULL,
  cantidad        INT           NOT NULL CHECK (cantidad >= 1)
);

CREATE INDEX IF NOT EXISTS idx_compra_item_compra ON compra_item (id_compra);
`;

async function initDb() {
  await pool.query(schema);
  console.log("Tablas verificadas/creadas");
}

module.exports = pool;
module.exports.initDb = initDb;

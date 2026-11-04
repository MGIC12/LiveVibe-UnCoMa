--
-- PostgreSQL database dump
--

\restrict 8evRJqnK5xu4ZOL4SBzuAISFqRa1uf9Be7f3PdsD0kwacrlLHO60pBoGB82hNge

-- Dumped from database version 16.15 (Debian 16.15-1.pgdg13+2)
-- Dumped by pg_dump version 16.15 (Debian 16.15-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.admin (
    nombre_usuario character varying(30) NOT NULL
);


ALTER TABLE public.admin OWNER TO root;

--
-- Name: artista; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.artista (
    nombre_usuario character varying(30) NOT NULL,
    nombre_artistico character varying(100) NOT NULL,
    nacionalidad character varying(60),
    genero character varying(60),
    tipo_artista character varying(60) DEFAULT 'solista'::character varying NOT NULL,
    CONSTRAINT artista_tipo_check CHECK (((tipo_artista)::text = ANY ((ARRAY['solista'::character varying, 'banda'::character varying])::text[])))
);


ALTER TABLE public.artista OWNER TO root;

--
-- Name: comentario; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.comentario (
    id_comentario integer NOT NULL,
    id_publicacion integer NOT NULL,
    nombre_autor character varying(30) NOT NULL,
    id_comentario_padre integer,
    contenido text NOT NULL,
    fecha_hora timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT comentario_contenido_check CHECK (((char_length(contenido) >= 1) AND (char_length(contenido) <= 300)))
);


ALTER TABLE public.comentario OWNER TO root;

--
-- Name: comentario_id_comentario_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.comentario_id_comentario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comentario_id_comentario_seq OWNER TO root;

--
-- Name: comentario_id_comentario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.comentario_id_comentario_seq OWNED BY public.comentario.id_comentario;


--
-- Name: entrada; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.entrada (
    id_entrada integer NOT NULL,
    id_evento integer NOT NULL,
    tipo_acceso character varying(60) DEFAULT 'General'::character varying NOT NULL,
    zona character varying(60),
    fila character varying(10),
    numero_asiento integer,
    precio numeric(10,2) NOT NULL,
    stock integer NOT NULL,
    CONSTRAINT entrada_precio_check CHECK ((precio >= (0)::numeric)),
    CONSTRAINT entrada_stock_check CHECK ((stock >= 0))
);


ALTER TABLE public.entrada OWNER TO root;

--
-- Name: entrada_id_entrada_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.entrada_id_entrada_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.entrada_id_entrada_seq OWNER TO root;

--
-- Name: entrada_id_entrada_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.entrada_id_entrada_seq OWNED BY public.entrada.id_entrada;


--
-- Name: evento; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.evento (
    id_evento integer NOT NULL,
    nombre character varying(255) NOT NULL,
    genero character varying(100),
    ciudad character varying(100),
    pais character varying(100),
    lugar character varying(255),
    fecha date NOT NULL,
    hora_apertura time without time zone,
    cant_entradas integer,
    clasificacion character varying(100),
    gira character varying(255),
    nombre_artista character varying(30),
    estado character varying(20) DEFAULT 'activo'::character varying NOT NULL,
    CONSTRAINT evento_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'cancelado'::character varying])::text[])))
);


ALTER TABLE public.evento OWNER TO root;

--
-- Name: evento_id_evento_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.evento_id_evento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.evento_id_evento_seq OWNER TO root;

--
-- Name: evento_id_evento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.evento_id_evento_seq OWNED BY public.evento.id_evento;


--
-- Name: eventos; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.eventos (
    id_evento integer NOT NULL,
    nombre character varying(255) NOT NULL,
    genero character varying(100),
    ciudad character varying(100),
    pais character varying(100),
    lugar character varying(255),
    fecha date NOT NULL,
    hora_apertura time without time zone,
    cant_entradas integer,
    clasificacion character varying(100),
    gira character varying(255),
    id_artista integer
);


ALTER TABLE public.eventos OWNER TO root;

--
-- Name: eventos_id_evento_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.eventos_id_evento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eventos_id_evento_seq OWNER TO root;

--
-- Name: eventos_id_evento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.eventos_id_evento_seq OWNED BY public.eventos.id_evento;


--
-- Name: fan; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.fan (
    nombre_usuario character varying(30) NOT NULL,
    cancion_favorita character varying(150),
    insignia character varying(60)
);


ALTER TABLE public.fan OWNER TO root;

--
-- Name: imagen; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.imagen (
    id_imagen integer NOT NULL,
    descripcion character varying(200),
    url character varying(255) NOT NULL
);


ALTER TABLE public.imagen OWNER TO root;

--
-- Name: imagen_id_imagen_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.imagen_id_imagen_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.imagen_id_imagen_seq OWNER TO root;

--
-- Name: imagen_id_imagen_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.imagen_id_imagen_seq OWNED BY public.imagen.id_imagen;


--
-- Name: integrante; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.integrante (
    id_integrante integer NOT NULL,
    nombre_usuario character varying(30) NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    instrumento character varying(60),
    fecha_nac date,
    nacionalidad character varying(60)
);


ALTER TABLE public.integrante OWNER TO root;

--
-- Name: integrante_id_integrante_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.integrante_id_integrante_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.integrante_id_integrante_seq OWNER TO root;

--
-- Name: integrante_id_integrante_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.integrante_id_integrante_seq OWNED BY public.integrante.id_integrante;


--
-- Name: me_gusta; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.me_gusta (
    id_publicacion integer NOT NULL,
    nombre_usuario character varying(30) NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.me_gusta OWNER TO root;

--
-- Name: notificacion; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.notificacion (
    id_notificacion integer NOT NULL,
    nombre_destinatario character varying(30) NOT NULL,
    tipo character varying(30) NOT NULL,
    mensaje text NOT NULL,
    id_evento integer,
    nombre_origen character varying(30),
    leida boolean DEFAULT false NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT notificacion_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['nuevo_seguidor'::character varying, 'nueva_reserva'::character varying, 'entradas_agotadas'::character varying, 'evento_nuevo'::character varying, 'evento_modificado'::character varying, 'evento_cancelado'::character varying])::text[])))
);


ALTER TABLE public.notificacion OWNER TO root;

--
-- Name: notificacion_id_notificacion_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.notificacion_id_notificacion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notificacion_id_notificacion_seq OWNER TO root;

--
-- Name: notificacion_id_notificacion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.notificacion_id_notificacion_seq OWNED BY public.notificacion.id_notificacion;


--
-- Name: publicacion; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.publicacion (
    id_publicacion integer NOT NULL,
    nombre_autor character varying(30) NOT NULL,
    contenido text NOT NULL,
    fecha_publicacion timestamp without time zone DEFAULT now() NOT NULL,
    id_imagen integer,
    CONSTRAINT publicacion_contenido_check CHECK (((char_length(contenido) >= 1) AND (char_length(contenido) <= 500)))
);


ALTER TABLE public.publicacion OWNER TO root;

--
-- Name: publicacion_id_publicacion_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.publicacion_id_publicacion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.publicacion_id_publicacion_seq OWNER TO root;

--
-- Name: publicacion_id_publicacion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.publicacion_id_publicacion_seq OWNED BY public.publicacion.id_publicacion;


--
-- Name: reserva; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.reserva (
    id_reserva integer NOT NULL,
    id_evento integer,
    nombre_usuario character varying(50),
    estado character varying(20) DEFAULT 'confirmada'::character varying,
    fecha_reserva timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reserva_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'confirmada'::character varying, 'cancelada'::character varying, 'asisti├│'::character varying])::text[])))
);


ALTER TABLE public.reserva OWNER TO root;

--
-- Name: reserva_id_reserva_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.reserva_id_reserva_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reserva_id_reserva_seq OWNER TO root;

--
-- Name: reserva_id_reserva_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.reserva_id_reserva_seq OWNED BY public.reserva.id_reserva;


--
-- Name: sigue; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.sigue (
    nombre_fan character varying(30) NOT NULL,
    nombre_artista character varying(30) NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sigue OWNER TO root;

--
-- Name: sigue_fan; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.sigue_fan (
    nombre_seguidor character varying(30) NOT NULL,
    nombre_seguido character varying(30) NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT sigue_fan_check CHECK (((nombre_seguidor)::text <> (nombre_seguido)::text))
);


ALTER TABLE public.sigue_fan OWNER TO root;

--
-- Name: suscripcion_novedades; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.suscripcion_novedades (
    nombre_fan character varying(30) NOT NULL,
    nombre_artista character varying(30) NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.suscripcion_novedades OWNER TO root;

--
-- Name: usuario; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.usuario (
    nombre_usuario character varying(30) NOT NULL,
    email character varying(255) NOT NULL,
    contrasenia_hash character varying(255) NOT NULL,
    fecha_nac date,
    fecha_alta timestamp without time zone DEFAULT now() NOT NULL,
    biografia text,
    rol character varying(10) NOT NULL,
    id_imagen integer,
    CONSTRAINT usuario_rol_check CHECK (((rol)::text = ANY ((ARRAY['fan'::character varying, 'artista'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.usuario OWNER TO root;

--
-- Name: comentario id_comentario; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.comentario ALTER COLUMN id_comentario SET DEFAULT nextval('public.comentario_id_comentario_seq'::regclass);


--
-- Name: entrada id_entrada; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.entrada ALTER COLUMN id_entrada SET DEFAULT nextval('public.entrada_id_entrada_seq'::regclass);


--
-- Name: evento id_evento; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.evento ALTER COLUMN id_evento SET DEFAULT nextval('public.evento_id_evento_seq'::regclass);


--
-- Name: eventos id_evento; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.eventos ALTER COLUMN id_evento SET DEFAULT nextval('public.eventos_id_evento_seq'::regclass);


--
-- Name: imagen id_imagen; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.imagen ALTER COLUMN id_imagen SET DEFAULT nextval('public.imagen_id_imagen_seq'::regclass);


--
-- Name: integrante id_integrante; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.integrante ALTER COLUMN id_integrante SET DEFAULT nextval('public.integrante_id_integrante_seq'::regclass);


--
-- Name: notificacion id_notificacion; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.notificacion ALTER COLUMN id_notificacion SET DEFAULT nextval('public.notificacion_id_notificacion_seq'::regclass);


--
-- Name: publicacion id_publicacion; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.publicacion ALTER COLUMN id_publicacion SET DEFAULT nextval('public.publicacion_id_publicacion_seq'::regclass);


--
-- Name: reserva id_reserva; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.reserva ALTER COLUMN id_reserva SET DEFAULT nextval('public.reserva_id_reserva_seq'::regclass);


--
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.admin (nombre_usuario) FROM stdin;
\.


--
-- Data for Name: artista; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.artista (nombre_usuario, nombre_artistico, nacionalidad, genero, tipo_artista) FROM stdin;
ID_OneDirection	One Direction	Brit├ínica 	Pop	banda
taylor1989	Taylor Switf	Estadounidense	Pop	solista
\.


--
-- Data for Name: comentario; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.comentario (id_comentario, id_publicacion, nombre_autor, id_comentario_padre, contenido, fecha_hora) FROM stdin;
1	2	vero	\N	Wow	2026-11-02 00:36:54.010514
\.


--
-- Data for Name: entrada; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.entrada (id_entrada, id_evento, tipo_acceso, zona, fila, numero_asiento, precio, stock) FROM stdin;
2	2	General	\N	\N	\N	50000.00	10000
1	1	General	\N	\N	\N	80000.00	99
4	4	General	\N	\N	\N	45000.00	100
3	3	General	\N	\N	\N	100.00	39999
5	5	General	\N	\N	\N	100000.00	4999
\.


--
-- Data for Name: evento; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.evento (id_evento, nombre, genero, ciudad, pais, lugar, fecha, hora_apertura, cant_entradas, clasificacion, gira, nombre_artista, estado) FROM stdin;
1	El Regreso	Pop	Buenos Aires	Argentina	MovistarArena	2027-02-27	20:00:00	100	Apto todo p├║blico	Up All Night Tour	ID_OneDirection	activo
2	El final de una era	Pop	Buenos Aires	Argentina	MovistarArena	2026-12-12	21:00:00	10000	Apto todo p├║blico	The Eras Tour	taylor1989	cancelado
4	PAST DAYS	Pop	Neuquen Capital	Argentina	Estadio Ruca Che	2026-10-21	21:00:00	100	\N	Interior Tour	taylor1989	activo
3	Reputation - KING OF MY HEART	Pop	Caracas	Venezuela	Estadio Monumental Sim├│n Bolivar	2027-01-15	19:00:00	40000	+13	Reputation Tour	taylor1989	activo
5	Ultimo Aviso	Pop	Sheffield	Inglaterra	Alg├║n lugar	2026-10-31	10:00:00	5000	Apto todo p├║blico	On The Road Again Tour	ID_OneDirection	activo
\.


--
-- Data for Name: eventos; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.eventos (id_evento, nombre, genero, ciudad, pais, lugar, fecha, hora_apertura, cant_entradas, clasificacion, gira, id_artista) FROM stdin;
\.


--
-- Data for Name: fan; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.fan (nombre_usuario, cancion_favorita, insignia) FROM stdin;
vero	Follow You - Bring Me The Horizon	\N
Pan	\N	\N
\.


--
-- Data for Name: imagen; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.imagen (id_imagen, descripcion, url) FROM stdin;
1	Foto de perfil de vero	/uploads/ad06d890-b81d-48d1-ac2c-856d37eac846.jpg
2	Foto de perfil de taylor1989	/uploads/5d334fc6-fffa-4800-9cf3-e6330afdc6c8.jpg
3	Imagen de una publicaci├│n de vero	/uploads/a08fdcaf-7b58-4a9e-a6fa-e66d1f28991a.jpg
4	Imagen de una publicaci├│n de taylor1989	/uploads/b267e730-001b-4994-bb8b-12524be9f1d3.jpg
\.


--
-- Data for Name: integrante; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.integrante (id_integrante, nombre_usuario, nombre, apellido, instrumento, fecha_nac, nacionalidad) FROM stdin;
1	ID_OneDirection	Zayn	Malik	Voz	1993-01-12	Brit├ínica
2	ID_OneDirection	Liam	Payne	Voz	1993-08-29	Brit├ínica
3	ID_OneDirection	Harry	Styles	Voz	1994-02-01	Brit├ínica
4	ID_OneDirection	Niall	Horan	Voz	1993-09-12	Irland├®s
5	ID_OneDirection	Louis	Tomlinson	Voz	1991-12-24	Brit├ínica
\.


--
-- Data for Name: me_gusta; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.me_gusta (id_publicacion, nombre_usuario, fecha) FROM stdin;
2	Pan	2026-11-02 00:37:29.095143
3	vero	2026-11-02 00:42:52.217868
\.


--
-- Data for Name: notificacion; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.notificacion (id_notificacion, nombre_destinatario, tipo, mensaje, id_evento, nombre_origen, leida, fecha) FROM stdin;
1	ID_OneDirection	nuevo_seguidor	vero empez├│ a seguirte	\N	vero	t	2026-10-30 02:12:08.412597
2	ID_OneDirection	nueva_reserva	vero reserv├│ una entrada para Ultimo Aviso	5	vero	t	2026-10-30 20:53:23.512128
4	vero	nuevo_seguidor	Pan empez├│ a seguirte	\N	Pan	t	2026-11-02 22:17:40.66871
3	taylor1989	nuevo_seguidor	vero empez├│ a seguirte	\N	vero	t	2026-11-02 21:09:12.639058
\.


--
-- Data for Name: publicacion; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.publicacion (id_publicacion, nombre_autor, contenido, fecha_publicacion, id_imagen) FROM stdin;
1	vero	hola gente	2026-11-02 00:36:13.805957	\N
2	vero	Probando, probando	2026-11-02 00:36:32.878881	3
3	taylor1989	I was patient Zero...	2026-11-02 00:42:30.865613	4
\.


--
-- Data for Name: reserva; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.reserva (id_reserva, id_evento, nombre_usuario, estado, fecha_reserva) FROM stdin;
1	1	vero	confirmada	2026-10-27 23:59:06.755282
2	3	vero	confirmada	2026-10-28 00:20:26.244627
3	5	vero	confirmada	2026-10-30 20:53:23.465103
\.


--
-- Data for Name: sigue; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.sigue (nombre_fan, nombre_artista, fecha) FROM stdin;
vero	ID_OneDirection	2026-10-30 02:12:08.403412
vero	taylor1989	2026-11-02 21:09:12.62056
\.


--
-- Data for Name: sigue_fan; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.sigue_fan (nombre_seguidor, nombre_seguido, fecha) FROM stdin;
Pan	vero	2026-11-02 22:17:40.66174
\.


--
-- Data for Name: suscripcion_novedades; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.suscripcion_novedades (nombre_fan, nombre_artista, fecha) FROM stdin;
vero	ID_OneDirection	2026-10-30 02:11:38.112878
vero	taylor1989	2026-11-02 21:09:15.135226
\.


--
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.usuario (nombre_usuario, email, contrasenia_hash, fecha_nac, fecha_alta, biografia, rol, id_imagen) FROM stdin;
ID_OneDirection	onedirection@gmail.com	$2b$10$H3BdAhLSBqQMwVhE9DsR6.SYb.gxhHcUozy/tUZikBc9wuFO72/hS	0010-07-23	2026-10-11 16:46:37.153448	\N	artista	\N
vero	vero@gmail.com	$2b$10$C1t3yz1JvSEa39zQiQVTfePGsDsMXM/IfyVgrgb4svV1TGX3lqfae	2006-01-14	2026-10-05 01:25:22.834339	\N	fan	1
taylor1989	taylorswitf@gmail.com	$2b$10$ypabl8b/hlnkiVHMKzItnOGw5Mdo9ZQObnmHOCQaoSucI.ILgnLLa	1989-12-13	2026-10-19 22:40:45.911001	\N	artista	2
Pan	pansito@gmail.com	$2b$10$wvVfqOGLT/aKGLwF.qHGYee1yHN.NIiif5A/Ud/oAvPZ9PGoO4Cum	2007-02-24	2026-11-01 23:02:16.132327	\N	fan	\N
\.


--
-- Name: comentario_id_comentario_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.comentario_id_comentario_seq', 1, true);


--
-- Name: entrada_id_entrada_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.entrada_id_entrada_seq', 5, true);


--
-- Name: evento_id_evento_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.evento_id_evento_seq', 5, true);


--
-- Name: eventos_id_evento_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.eventos_id_evento_seq', 1, false);


--
-- Name: imagen_id_imagen_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.imagen_id_imagen_seq', 4, true);


--
-- Name: integrante_id_integrante_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.integrante_id_integrante_seq', 5, true);


--
-- Name: notificacion_id_notificacion_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.notificacion_id_notificacion_seq', 4, true);


--
-- Name: publicacion_id_publicacion_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.publicacion_id_publicacion_seq', 4, true);


--
-- Name: reserva_id_reserva_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.reserva_id_reserva_seq', 5, true);


--
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (nombre_usuario);


--
-- Name: artista artista_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.artista
    ADD CONSTRAINT artista_pkey PRIMARY KEY (nombre_usuario);


--
-- Name: comentario comentario_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.comentario
    ADD CONSTRAINT comentario_pkey PRIMARY KEY (id_comentario);


--
-- Name: entrada entrada_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.entrada
    ADD CONSTRAINT entrada_pkey PRIMARY KEY (id_entrada);


--
-- Name: evento evento_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.evento
    ADD CONSTRAINT evento_pkey PRIMARY KEY (id_evento);


--
-- Name: eventos eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT eventos_pkey PRIMARY KEY (id_evento);


--
-- Name: fan fan_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.fan
    ADD CONSTRAINT fan_pkey PRIMARY KEY (nombre_usuario);


--
-- Name: imagen imagen_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.imagen
    ADD CONSTRAINT imagen_pkey PRIMARY KEY (id_imagen);


--
-- Name: integrante integrante_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.integrante
    ADD CONSTRAINT integrante_pkey PRIMARY KEY (id_integrante);


--
-- Name: me_gusta me_gusta_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.me_gusta
    ADD CONSTRAINT me_gusta_pkey PRIMARY KEY (id_publicacion, nombre_usuario);


--
-- Name: notificacion notificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.notificacion
    ADD CONSTRAINT notificacion_pkey PRIMARY KEY (id_notificacion);


--
-- Name: publicacion publicacion_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.publicacion
    ADD CONSTRAINT publicacion_pkey PRIMARY KEY (id_publicacion);


--
-- Name: reserva reserva_id_evento_nombre_usuario_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.reserva
    ADD CONSTRAINT reserva_id_evento_nombre_usuario_key UNIQUE (id_evento, nombre_usuario);


--
-- Name: reserva reserva_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.reserva
    ADD CONSTRAINT reserva_pkey PRIMARY KEY (id_reserva);


--
-- Name: sigue_fan sigue_fan_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.sigue_fan
    ADD CONSTRAINT sigue_fan_pkey PRIMARY KEY (nombre_seguidor, nombre_seguido);


--
-- Name: sigue sigue_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.sigue
    ADD CONSTRAINT sigue_pkey PRIMARY KEY (nombre_fan, nombre_artista);


--
-- Name: suscripcion_novedades suscripcion_novedades_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.suscripcion_novedades
    ADD CONSTRAINT suscripcion_novedades_pkey PRIMARY KEY (nombre_fan, nombre_artista);


--
-- Name: usuario usuario_email_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_email_key UNIQUE (email);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (nombre_usuario);


--
-- Name: idx_comentario_publicacion; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_comentario_publicacion ON public.comentario USING btree (id_publicacion, fecha_hora);


--
-- Name: idx_notificacion_destinatario; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_notificacion_destinatario ON public.notificacion USING btree (nombre_destinatario, leida, fecha DESC);


--
-- Name: idx_publicacion_autor; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_publicacion_autor ON public.publicacion USING btree (nombre_autor, fecha_publicacion DESC);


--
-- Name: idx_publicacion_fecha; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_publicacion_fecha ON public.publicacion USING btree (fecha_publicacion DESC);


--
-- Name: idx_sigue_artista; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_sigue_artista ON public.sigue USING btree (nombre_artista);


--
-- Name: idx_sigue_fan_seguido; Type: INDEX; Schema: public; Owner: root
--

CREATE INDEX idx_sigue_fan_seguido ON public.sigue_fan USING btree (nombre_seguido);


--
-- Name: admin admin_nombre_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_nombre_usuario_fkey FOREIGN KEY (nombre_usuario) REFERENCES public.usuario(nombre_usuario) ON DELETE CASCADE;


--
-- Name: artista artista_nombre_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.artista
    ADD CONSTRAINT artista_nombre_usuario_fkey FOREIGN KEY (nombre_usuario) REFERENCES public.usuario(nombre_usuario) ON DELETE CASCADE;


--
-- Name: comentario comentario_id_comentario_padre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.comentario
    ADD CONSTRAINT comentario_id_comentario_padre_fkey FOREIGN KEY (id_comentario_padre) REFERENCES public.comentario(id_comentario) ON DELETE CASCADE;


--
-- Name: comentario comentario_id_publicacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.comentario
    ADD CONSTRAINT comentario_id_publicacion_fkey FOREIGN KEY (id_publicacion) REFERENCES public.publicacion(id_publicacion) ON DELETE CASCADE;


--
-- Name: comentario comentario_nombre_autor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.comentario
    ADD CONSTRAINT comentario_nombre_autor_fkey FOREIGN KEY (nombre_autor) REFERENCES public.usuario(nombre_usuario) ON DELETE CASCADE;


--
-- Name: entrada entrada_id_evento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.entrada
    ADD CONSTRAINT entrada_id_evento_fkey FOREIGN KEY (id_evento) REFERENCES public.evento(id_evento) ON DELETE CASCADE;


--
-- Name: evento evento_nombre_artista_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.evento
    ADD CONSTRAINT evento_nombre_artista_fkey FOREIGN KEY (nombre_artista) REFERENCES public.artista(nombre_usuario) ON DELETE CASCADE;


--
-- Name: fan fan_nombre_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.fan
    ADD CONSTRAINT fan_nombre_usuario_fkey FOREIGN KEY (nombre_usuario) REFERENCES public.usuario(nombre_usuario) ON DELETE CASCADE;


--
-- Name: integrante integrante_nombre_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.integrante
    ADD CONSTRAINT integrante_nombre_usuario_fkey FOREIGN KEY (nombre_usuario) REFERENCES public.artista(nombre_usuario) ON DELETE CASCADE;


--
-- Name: me_gusta me_gusta_id_publicacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.me_gusta
    ADD CONSTRAINT me_gusta_id_publicacion_fkey FOREIGN KEY (id_publicacion) REFERENCES public.publicacion(id_publicacion) ON DELETE CASCADE;


--
-- Name: me_gusta me_gusta_nombre_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.me_gusta
    ADD CONSTRAINT me_gusta_nombre_usuario_fkey FOREIGN KEY (nombre_usuario) REFERENCES public.usuario(nombre_usuario) ON DELETE CASCADE;


--
-- Name: notificacion notificacion_id_evento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.notificacion
    ADD CONSTRAINT notificacion_id_evento_fkey FOREIGN KEY (id_evento) REFERENCES public.evento(id_evento) ON DELETE CASCADE;


--
-- Name: notificacion notificacion_nombre_destinatario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.notificacion
    ADD CONSTRAINT notificacion_nombre_destinatario_fkey FOREIGN KEY (nombre_destinatario) REFERENCES public.usuario(nombre_usuario) ON DELETE CASCADE;


--
-- Name: notificacion notificacion_nombre_origen_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.notificacion
    ADD CONSTRAINT notificacion_nombre_origen_fkey FOREIGN KEY (nombre_origen) REFERENCES public.usuario(nombre_usuario) ON DELETE SET NULL;


--
-- Name: publicacion publicacion_id_imagen_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.publicacion
    ADD CONSTRAINT publicacion_id_imagen_fkey FOREIGN KEY (id_imagen) REFERENCES public.imagen(id_imagen) ON DELETE SET NULL;


--
-- Name: publicacion publicacion_nombre_autor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.publicacion
    ADD CONSTRAINT publicacion_nombre_autor_fkey FOREIGN KEY (nombre_autor) REFERENCES public.usuario(nombre_usuario) ON DELETE CASCADE;


--
-- Name: reserva reserva_id_evento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.reserva
    ADD CONSTRAINT reserva_id_evento_fkey FOREIGN KEY (id_evento) REFERENCES public.evento(id_evento) ON DELETE CASCADE;


--
-- Name: reserva reserva_nombre_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.reserva
    ADD CONSTRAINT reserva_nombre_usuario_fkey FOREIGN KEY (nombre_usuario) REFERENCES public.usuario(nombre_usuario) ON DELETE CASCADE;


--
-- Name: sigue_fan sigue_fan_nombre_seguido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.sigue_fan
    ADD CONSTRAINT sigue_fan_nombre_seguido_fkey FOREIGN KEY (nombre_seguido) REFERENCES public.fan(nombre_usuario) ON DELETE CASCADE;


--
-- Name: sigue_fan sigue_fan_nombre_seguidor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.sigue_fan
    ADD CONSTRAINT sigue_fan_nombre_seguidor_fkey FOREIGN KEY (nombre_seguidor) REFERENCES public.fan(nombre_usuario) ON DELETE CASCADE;


--
-- Name: sigue sigue_nombre_artista_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.sigue
    ADD CONSTRAINT sigue_nombre_artista_fkey FOREIGN KEY (nombre_artista) REFERENCES public.artista(nombre_usuario) ON DELETE CASCADE;


--
-- Name: sigue sigue_nombre_fan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.sigue
    ADD CONSTRAINT sigue_nombre_fan_fkey FOREIGN KEY (nombre_fan) REFERENCES public.fan(nombre_usuario) ON DELETE CASCADE;


--
-- Name: suscripcion_novedades suscripcion_novedades_nombre_artista_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.suscripcion_novedades
    ADD CONSTRAINT suscripcion_novedades_nombre_artista_fkey FOREIGN KEY (nombre_artista) REFERENCES public.artista(nombre_usuario) ON DELETE CASCADE;


--
-- Name: suscripcion_novedades suscripcion_novedades_nombre_fan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.suscripcion_novedades
    ADD CONSTRAINT suscripcion_novedades_nombre_fan_fkey FOREIGN KEY (nombre_fan) REFERENCES public.fan(nombre_usuario) ON DELETE CASCADE;


--
-- Name: usuario usuario_id_imagen_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_id_imagen_fkey FOREIGN KEY (id_imagen) REFERENCES public.imagen(id_imagen) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict 8evRJqnK5xu4ZOL4SBzuAISFqRa1uf9Be7f3PdsD0kwacrlLHO60pBoGB82hNge


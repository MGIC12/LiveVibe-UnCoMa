# LiveVibe

**LiveVibe** es una plataforma web y ecosistema diseñado para los apasionados de la música en vivo. Su propósito central es agilizar el acceso a los eventos musicales y conectar a los fans a través de una comunidad interactiva y asistencia con Inteligencia Artificial.

---

## Contexto Académico
Este proyecto es desarrollado como **Trabajo Final** para la **Tecnicatura Universitaria en Desarrollo Web** (Año 2026). 
* **Institución:** Universidad Nacional del Comahue - Facultad de Informática
* **Grupo:** AGUA Y ACEITE

---
## Integrantes del Equipo
* Mariano Infante [FAI-3823]
* Verónica López [FAI-5481]
---

## Características Principales

1. **Catálogo y reserva de eventos**
   * Descubrir próximos conciertos con filtros por género y ciudad, y buscador general.
   * Reserva y cancelación de entradas; el artista crea, edita y cancela sus eventos (con imagen).
   * Detalle del evento con datos reales, mapa, "Cómo llegar" (auto, transporte público o a pie), perfil del artista y acceso a su merch.
   * "Agregar al calendario": descarga un archivo .ics de la reserva, con recordatorio un día antes.

2. **Comunidad musical**
   * Perfiles de fans y de artistas (foto, biografía, canción favorita), seguidores y novedades.
   * Feed con publicaciones (texto e imagen), comentarios y "me gusta"; página de Comunidad en columnas.
   * Notificaciones (nuevo seguidor, novedades de artistas).

3. **Insignias de asistencia**
   * El fan gana *Aficionado* (1 concierto), *Fanático* (5) u *Obsesionado* (10) según los eventos a los que asistió.
   * El perfil muestra cuántos conciertos le faltan para el próximo nivel.

4. **Merchandising**
   * Cada artista carga, edita y elimina sus artículos (con foto) desde "Mi tienda".
   * Los fans los ven en el perfil del artista, los agregan al carrito y compran (el pago es simulado).
   * Estados de la compra: pago pendiente, en preparación, en camino, recibida o cancelada. El pago pendiente vence a los 7 días y devuelve el stock.

5. **Inteligencia Artificial (Google Gemini)**
   * **Asistente virtual** con herramientas: busca eventos reales, muestra tus reservas y te prepara una reserva que se concreta solo cuando tocás "Confirmar reserva". Recuerda el contexto de la conversación.
   * **Recomendador personalizado**: arma tu perfil con los artistas que seguís, los conciertos a los que fuiste, tus compras de merch y tu biografía, y explica por qué te recomienda cada evento. Si la IA no responde, usa un puntaje con las mismas señales.
   * **Soundtrack por evento**: cinco temas afines generados por IA; se guardan en la base para no repetir la llamada.

---

## Stack Tecnológico

El proyecto cumple con los requisitos de la cátedra utilizando frameworks comerciales y tecnologías modernas:

* **Frontend:** React JS + Tailwind CSS
* **Backend:** Node.js
* **Base de Datos:** PostgreSQL
* **Infraestructura:** Docker

---

## Cómo correrlo

1. Crear `backend/.env` a partir de `backend/.env.example` y completar:
   * `GEMINI_API_KEY`: clave de Google AI Studio (sin ella no funcionan las funciones de IA).
   * `JWT_SECRET`: un valor aleatorio.
   * `CLOUDINARY_URL`: para subir imágenes (fotos de perfil, eventos y merch).
   * `FRONTEND_URL`: dirección del frontend permitida por CORS (por defecto `http://localhost:3000`).
2. Levantar todo con Docker:

   ```bash
   docker compose up --build
   ```

   Frontend en <http://localhost:3000> y backend en <http://localhost:5000>. Las tablas se crean solas al iniciar el backend.

## Seguridad básica

* Límite de intentos de inicio de sesión (10 fallidos cada 15 minutos) y de registros por conexión.
* El chatbot y las funciones de IA tienen límite de consultas por minuto, y los mensajes se acotan a 300 caracteres.
* El servidor no arranca si falta `JWT_SECRET`.

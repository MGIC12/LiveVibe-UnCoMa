// Dirección que busca una canción en YouTube (la misma búsqueda que usa el soundtrack)
export const urlYouTube = (cancion) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(cancion)}`;
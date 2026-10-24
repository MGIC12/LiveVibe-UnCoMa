const TIPOS_ARTISTA = ["solista", "banda"];
const MIN_INTEGRANTES = 2;
const MAX_INTEGRANTES = 10;

// Devuelve el texto sin espacios de más ("" si no es texto)
const texto = (valor) => (typeof valor === "string" ? valor.trim() : "");

// Valida y limpia los datos propios de un artista
function validarDatosArtista(b) {
  const datos = {
    nombre_artistico: texto(b.nombre_artistico),
    nacionalidad: texto(b.nacionalidad) || null,
    genero: texto(b.genero) || null,
    tipo_artista: texto(b.tipo_artista) || "solista",
    integrantes: [],
  };

  if (!datos.nombre_artistico) {
    return { error: "Indicá tu nombre artístico" };
  }
  if (!TIPOS_ARTISTA.includes(datos.tipo_artista)) {
    return { error: "El tipo de artista debe ser solista o banda" };
  }

  if (datos.tipo_artista === "banda") {
    const lista = Array.isArray(b.integrantes) ? b.integrantes : [];
    if (lista.length < MIN_INTEGRANTES || lista.length > MAX_INTEGRANTES) {
      return {
        error: `Una banda debe tener entre ${MIN_INTEGRANTES} y ${MAX_INTEGRANTES} integrantes`,
      };
    }
    if (lista.some((i) => !texto(i?.nombre) || !texto(i?.apellido))) {
      return { error: "Completá nombre y apellido de todos los integrantes" };
    }
    datos.integrantes = lista.map((i) => ({
      nombre: texto(i.nombre),
      apellido: texto(i.apellido),
      instrumento: texto(i.instrumento) || null,
      fecha_nac: texto(i.fecha_nac) || null,
      nacionalidad: texto(i.nacionalidad) || null,
    }));
  }

  return { datos };
}

module.exports = { texto, validarDatosArtista };
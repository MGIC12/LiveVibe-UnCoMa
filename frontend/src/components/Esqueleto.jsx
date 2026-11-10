export function Bloque({ className = "", style }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-crema/10 ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

// Envoltorio accesible: los lectores de pantalla anuncian "texto" y no cada bloque
function Carga({ texto, className = "", children }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{texto}</span>
      {children}
    </div>
  );
}

// Tarjeta de una lista (eventos, entradas, compras, carrito)
function TarjetaLista() {
  return (
    <div className="bg-crema/5 border border-crema/15 rounded-xl p-4 sm:p-6 flex items-center gap-4 sm:gap-6">
      <Bloque className="w-16 h-20 shrink-0" />
      <div className="flex-1 space-y-3">
        <Bloque className="h-5 w-2/3" />
        <Bloque className="h-4 w-1/2" />
        <Bloque className="h-4 w-1/3" />
      </div>
      <Bloque className="hidden sm:block h-10 w-32 rounded-full" />
    </div>
  );
}

export function EsqueletoLista({ cantidad = 3, texto = "Cargando..." }) {
  return (
    <Carga texto={texto} className="space-y-4">
      {Array.from({ length: cantidad }, (_, i) => (
        <TarjetaLista key={i} />
      ))}
    </Carga>
  );
}

// Publicaciones del feed
export function EsqueletoPublicaciones({ cantidad = 3 }) {
  return (
    <Carga texto="Cargando publicaciones..." className="space-y-4">
      {Array.from({ length: cantidad }, (_, i) => (
        <div
          key={i}
          className="bg-crema/5 border border-crema/15 rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <Bloque className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Bloque className="h-4 w-1/3" />
              <Bloque className="h-3 w-1/4" />
            </div>
          </div>
          <Bloque className="h-4 w-full" />
          <Bloque className="h-4 w-5/6" />
          {i % 2 === 0 && <Bloque className="h-40 w-full rounded-xl" />}
        </div>
      ))}
    </Carga>
  );
}

// Fila de artistas del carrusel
export function EsqueletoCarrusel() {
  return (
    <Carga
      texto="Cargando artistas..."
      className="flex gap-4 overflow-hidden py-4"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <Bloque key={i} className="w-44 h-56 shrink-0 rounded-2xl" />
      ))}
    </Carga>
  );
}

// Pantalla de un evento
export function EsqueletoEvento() {
  return (
    <Carga
      texto="Cargando evento..."
      className="max-w-6xl mx-auto px-4 pt-28 pb-16 space-y-8"
    >
      <Bloque className="h-10 w-48 rounded-full" />
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Bloque className="h-52 w-full rounded-2xl" />
          <Bloque className="h-5 w-1/3" />
          <Bloque className="h-12 w-48 rounded-full" />
          <Bloque className="h-24 w-full rounded-2xl" />
          <Bloque className="h-4 w-full" />
          <Bloque className="h-4 w-4/5" />
        </div>
        <Bloque className="h-80 w-full rounded-2xl" />
      </div>
    </Carga>
  );
}

// Cabecera de un perfil y debajo algunas tarjetas
export function EsqueletoPerfil() {
  return (
    <Carga texto="Cargando perfil..." className="space-y-8 py-6">
      <div className="flex items-center gap-6">
        <Bloque className="w-28 h-28 rounded-full shrink-0" />
        <div className="flex-1 space-y-3">
          <Bloque className="h-8 w-1/2" />
          <Bloque className="h-4 w-1/3" />
          <Bloque className="h-4 w-2/3" />
        </div>
      </div>
      <EsqueletoLista cantidad={2} texto="Cargando..." />
    </Carga>
  );
}

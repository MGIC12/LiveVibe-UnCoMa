import Avatar from "./Avatar";

export default function CabeceraPerfil({
  avatar, // objeto con foto_url, foto_descripcion y nombre_usuario (para la inicial)
  titulo,
  subtitulo,
  etiquetas = [], // [{ texto, destacada }]
  banner = "bg-fucsia", // color del banner
  children, // acciones (botones); si no hay, no se muestra el bloque
}) {
  return (
    <section className="bg-crema/5 backdrop-blur-xl border border-crema/20 rounded-3xl overflow-hidden shadow-2xl">
      {/* Banner */}
      <div className={`relative h-28 sm:h-32 overflow-hidden ${banner}`}>
        <svg
          className="absolute -right-10 -bottom-12 w-44 h-44"
          viewBox="0 0 150 150"
          aria-hidden="true"
        >
          <circle cx="75" cy="75" r="72" fill="#0F0D14" />
          <circle cx="75" cy="75" r="58" fill="none" stroke="#FFF4E3" opacity=".3" />
          <circle cx="75" cy="75" r="46" fill="none" stroke="#FFF4E3" opacity=".3" />
          <circle cx="75" cy="75" r="22" fill="#FFC62E" />
          <circle cx="75" cy="75" r="4" fill="#0F0D14" />
        </svg>
      </div>

      <div className="px-6 sm:px-8 pb-8 text-center">
        {/* La foto va por encima del banner: por eso relative z-10 */}
        <div className="relative z-10 -mt-14 sm:-mt-16 flex justify-center">
          <Avatar
            usuario={avatar}
            clases="w-28 h-28 sm:w-32 sm:h-32 text-5xl shadow-xl border-4 border-sol"
            fondo="bg-tinta"
          />
        </div>

        <h1 className="mt-4 text-3xl sm:text-4xl font-black text-crema tracking-tight">
          {titulo}
        </h1>
        {subtitulo && <p className="text-crema/60 text-sm mt-1">{subtitulo}</p>}

        {etiquetas.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {etiquetas.map((e, n) => (
              <span
                key={n}
                className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                  e.destacada ? "bg-sol text-tinta" : "bg-crema/10 text-crema/80"
                }`}
              >
                {e.texto}
              </span>
            ))}
          </div>
        )}

        {children && (
          <div className="mt-6 pt-6 border-t border-crema/20">{children}</div>
        )}
      </div>
    </section>
  );
}
import { urlImagen } from "../utils/api";

export default function Avatar({
  usuario,
  clases = "w-8 h-8",
  fondo = "bg-crema/15",
}) {
  const url = urlImagen(usuario?.foto_url);
  const inicial = (usuario?.nombre_usuario || "U").charAt(0);

  return (
    <div
      className={`${clases} ${fondo} shrink-0 rounded-full overflow-hidden flex items-center justify-center font-bold text-crema uppercase`}
    >
      {url ? (
        <img
          src={url}
          alt={usuario.foto_descripcion || "Foto de perfil"}
          className="w-full h-full object-cover"
        />
      ) : (
        inicial
      )}
    </div>
  );
}
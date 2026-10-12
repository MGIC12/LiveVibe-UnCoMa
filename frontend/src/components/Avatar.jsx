import { urlImagen } from "../utils/api";

export default function Avatar({ usuario, clases = "w-8 h-8" }) {
  const url = urlImagen(usuario?.foto_url);

  return (
    <div
      className={`${clases} shrink-0 bg-gray-600 rounded-full overflow-hidden flex items-center justify-center`}
    >
      {url ? (
        <img
          src={url}
          alt={usuario.foto_descripcion || "Foto de perfil"}
          className="w-full h-full object-cover"
        />
      ) : (
        "👤"
      )}
    </div>
  );
}
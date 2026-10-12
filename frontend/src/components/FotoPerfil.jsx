import { useRef, useState } from "react";
import { TIPOS_IMAGEN, MAX_BYTES_IMAGEN } from "../utils/formularios";

export default function FotoPerfil({
  urlActual,
  valor,
  onChange,
  titulo = "Foto de perfil",
  descripcion = "Foto de perfil",
}) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  // Qué se ve: la elegida recién > la guardada (salvo que se marcó para quitar)
  const mostrada = valor.previa ?? (valor.quitar ? null : urlActual);

  function elegir(e) {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!archivo) return;

    if (!TIPOS_IMAGEN.includes(archivo.type)) {
      return setError("Elegí una imagen JPG, PNG o WebP");
    }
    if (archivo.size > MAX_BYTES_IMAGEN) {
      return setError("La imagen no puede superar los 2 MB");
    }

    setError("");
    const lector = new FileReader();
    lector.onload = () => onChange({ archivo, previa: lector.result, quitar: false });
    lector.readAsDataURL(archivo);
  }

  function quitar() {
    setError("");
    if (valor.previa) {
      // Descarta la elegida y vuelve a la que ya estaba guardada
      onChange({ archivo: null, previa: null, quitar: false });
    } else {
      // Marca la foto guardada para quitarla al guardar
      onChange({ archivo: null, previa: null, quitar: true });
    }
  }

  function deshacer() {
    onChange({ archivo: null, previa: null, quitar: false });
  }

  return (
    <div>
      <p className="text-sm text-gray-300 mb-2">{titulo}</p>

      <div className="flex items-center gap-4">
        <div className="w-24 h-24 shrink-0 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center text-4xl">
          {mostrada ? (
            <img src={mostrada} alt={descripcion} className="w-full h-full object-cover" />
          ) : (
            "👤"
          )}
        </div>

        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={elegir}
            className="hidden"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current.click()}
              className="px-4 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white"
            >
              {mostrada ? "Cambiar foto" : "Elegir foto"}
            </button>

            {mostrada && (
              <button
                type="button"
                onClick={quitar}
                className="px-4 py-1.5 rounded-full border border-gray-600 text-sm text-gray-300 hover:border-red-400 hover:text-red-400"
              >
                {valor.previa ? "Descartar" : "Quitar"}
              </button>
            )}
          </div>

          {valor.quitar && urlActual && (
            <p className="text-xs text-gray-400">
              La foto se quitará al guardar.{" "}
              <button
                type="button"
                onClick={deshacer}
                className="text-purple-400 hover:text-purple-300"
              >
                Deshacer
              </button>
            </p>
          )}

          <p className="text-xs text-gray-500">JPG, PNG o WebP, hasta 2 MB.</p>
          {error && (
            <p className="text-red-400 text-xs" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
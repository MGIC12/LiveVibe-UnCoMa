import IntegrantesEditor from "./IntegrantesEditor";
import {
  inputClase,
  labelClase,
  INTEGRANTE_VACIO,
  MIN_INTEGRANTES,
} from "../utils/formularios";

export default function CamposArtista({ valores, onChange }) {
  const esBanda = valores.tipo_artista === "banda";
  const integrantes = valores.integrantes ?? [];

  function elegirTipo(tipo) {
    onChange("tipo_artista", tipo);

    if (tipo === "banda" && integrantes.length < MIN_INTEGRANTES) {
      // Al elegir banda, arranca con los bloques mínimos vacíos
      const faltan = MIN_INTEGRANTES - integrantes.length;
      const nuevos = Array.from({ length: faltan }, () => ({ ...INTEGRANTE_VACIO }));
      onChange("integrantes", [...integrantes, ...nuevos]);
    }
    if (tipo === "solista") {
      onChange("integrantes", []);
    }
  }

  return (
    <div className="space-y-5">
      <label className={labelClase}>
        Nombre artístico
        <input
          name="nombre_artistico"
          value={valores.nombre_artistico ?? ""}
          onChange={(e) => onChange(e.target.name, e.target.value)}
          maxLength={100}
          required
          className={inputClase}
        />
      </label>

      <fieldset>
        <legend className="text-sm text-gray-300 mb-2">Soy</legend>
        <div className="grid grid-cols-2 gap-3">
          {["solista", "banda"].map((opcion) => (
            <label
              key={opcion}
              className={`cursor-pointer text-center py-3 rounded-xl border font-semibold transition ${
                valores.tipo_artista === opcion
                  ? "bg-purple-600 border-purple-500 text-white"
                  : "bg-gray-700 border-gray-600 text-gray-300 hover:border-purple-500"
              }`}
            >
              <input
                type="radio"
                name="tipo_artista"
                value={opcion}
                checked={valores.tipo_artista === opcion}
                onChange={() => elegirTipo(opcion)}
                className="sr-only"
              />
              {opcion === "solista" ? "🎤 Solista" : "🎸 Banda"}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className={labelClase}>
          Nacionalidad
          <input
            name="nacionalidad"
            value={valores.nacionalidad ?? ""}
            onChange={(e) => onChange(e.target.name, e.target.value)}
            maxLength={60}
            className={inputClase}
          />
        </label>
        <label className={labelClase}>
          Género musical
          <input
            name="genero"
            value={valores.genero ?? ""}
            onChange={(e) => onChange(e.target.name, e.target.value)}
            maxLength={60}
            className={inputClase}
          />
        </label>
      </div>

      {esBanda && (
        <IntegrantesEditor
          integrantes={integrantes}
          onChange={(lista) => onChange("integrantes", lista)}
        />
      )}
    </div>
  );
}
import { inputClase, labelClase } from "../utils/formularios";

export default function CamposFan({ valores, onChange }) {
  return (
    <label className={labelClase}>
      Canción favorita
      <input
        name="cancion_favorita"
        value={valores.cancion_favorita ?? ""}
        onChange={(e) => onChange(e.target.name, e.target.value)}
        maxLength={150}
        className={inputClase}
      />
    </label>
  );
}
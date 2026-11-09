// Mapa del lugar del evento y enlaces para llegar.
// Usa el mapa incrustado de Google Maps buscando por dirección (no necesita clave) y los
// enlaces oficiales de Google Maps: "Cómo llegar" parte de la ubicación de quien lo abre.

const enlace =
  "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border transition";

export default function MapaEvento({ lugar, ciudad, pais }) {
  const direccion = [lugar, ciudad, pais || "Argentina"].filter(Boolean).join(", ");
  if (!lugar && !ciudad) return null;

  const q = encodeURIComponent(direccion);
  const indicaciones = (modo) =>
    `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=${modo}`;

  return (
    <section aria-labelledby="mapa-evento" className="mt-10">
      <h3
        id="mapa-evento"
        className="text-2xl font-bold text-crema mb-4 border-b border-crema/20 pb-2"
      >
        Dónde es
      </h3>
      <p className="text-crema/70 mb-4">📍 {direccion}</p>

      <div className="rounded-2xl overflow-hidden border border-crema/20 bg-crema/5 aspect-[16/9] max-w-3xl">
        <iframe
          title={`Mapa de ${direccion}`}
          src={`https://maps.google.com/maps?q=${q}&hl=es&z=15&output=embed`}
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>

      <div className="flex flex-wrap gap-3 mt-4">
        <a
          href={indicaciones("driving")}
          target="_blank"
          rel="noopener noreferrer"
          className={`${enlace} bg-fucsia text-tinta border-fucsia hover:bg-chicle`}
        >
          🧭 Cómo llegar
        </a>
        <a
          href={indicaciones("transit")}
          target="_blank"
          rel="noopener noreferrer"
          className={`${enlace} border-cielo text-cielo hover:bg-cielo hover:text-tinta`}
        >
          🚌 En transporte público
        </a>
        <a
          href={indicaciones("walking")}
          target="_blank"
          rel="noopener noreferrer"
          className={`${enlace} border-crema/30 text-crema hover:bg-crema hover:text-tinta`}
        >
          🚶 A pie
        </a>
      </div>
    </section>
  );
}

import { urlImagen } from "../utils/api";

const COLORES = ["#FF2E93", "#FFC62E", "#3DB4F2", "#FF7A1A", "#FF9ACB"];
const BARRAS = [70, 150, 100, 210, 130, 270, 180, 120, 240, 160, 90, 200, 110, 150, 80];

// 12 rayos para el diseño del sol: cada uno es un triángulo que sale del centro
const RAYOS = Array.from({ length: 12 }, (_, i) => {
  const R = 900;
  const punto = (grados) => {
    const a = (grados * Math.PI) / 180;
    return `${(400 + R * Math.cos(a)).toFixed(1)} ${(225 + R * Math.sin(a)).toFixed(1)}`;
  };
  return `M400 225 L${punto(i * 30 - 7)} L${punto(i * 30 + 7)} Z`;
});

// Seis diseños con la paleta del sitio. El evento usa uno u otro según su número.
const DISENOS = [
  // 0 · Vinilo sobre fucsia
  () => (
    <>
      <rect width="800" height="450" fill="#FF2E93" />
      <circle cx="120" cy="90" r="46" fill="#FFC62E" />
      <circle cx="560" cy="225" r="190" fill="#0F0D14" />
      <circle cx="560" cy="225" r="150" fill="none" stroke="#FFF4E3" strokeOpacity=".25" strokeWidth="2" />
      <circle cx="560" cy="225" r="118" fill="none" stroke="#FFF4E3" strokeOpacity=".25" strokeWidth="2" />
      <circle cx="560" cy="225" r="62" fill="#FFC62E" />
      <circle cx="560" cy="225" r="9" fill="#0F0D14" />
      <rect x="60" y="330" width="220" height="14" rx="7" fill="#FFF4E3" fillOpacity=".7" />
      <rect x="60" y="360" width="140" height="14" rx="7" fill="#FFF4E3" fillOpacity=".4" />
    </>
  ),
  // 1 · Sol sobre cielo
  () => (
    <>
      <rect width="800" height="450" fill="#3DB4F2" />
      {RAYOS.map((d, i) => (
        <path key={i} d={d} fill="#FFC62E" fillOpacity=".6" />
      ))}
      <circle cx="400" cy="225" r="96" fill="#FF2E93" />
      <circle cx="400" cy="225" r="58" fill="#0F0D14" />
      <circle cx="400" cy="225" r="14" fill="#FFF4E3" />
    </>
  ),
  // 2 · Ecualizador sobre tinta
  () => (
    <>
      <rect width="800" height="450" fill="#0F0D14" />
      <circle cx="700" cy="85" r="36" fill="#FFF4E3" fillOpacity=".9" />
      {BARRAS.map((h, i) => (
        <rect key={i} x={25 + i * 50} y={415 - h} width="36" height={h} rx="8" fill={COLORES[i % COLORES.length]} />
      ))}
      <rect x="20" y="420" width="760" height="5" rx="2.5" fill="#FFF4E3" fillOpacity=".3" />
    </>
  ),
  // 3 · Reflectores sobre sol
  () => (
    <>
      <rect width="800" height="450" fill="#FFC62E" />
      <polygon points="140,0 260,0 400,450 40,450" fill="#FFF4E3" fillOpacity=".45" />
      <polygon points="540,0 660,0 790,450 420,450" fill="#FF2E93" fillOpacity=".3" />
      <circle cx="400" cy="150" r="64" fill="#0F0D14" />
      <circle cx="400" cy="150" r="46" fill="none" stroke="#FFF4E3" strokeOpacity=".35" strokeWidth="2" />
      <rect y="385" width="800" height="65" fill="#0F0D14" />
      <rect x="320" y="372" width="160" height="14" rx="7" fill="#FF2E93" />
    </>
  ),
  // 4 · Olas sobre mandarina
  () => (
    <>
      <rect width="800" height="450" fill="#FF7A1A" />
      <circle cx="620" cy="120" r="66" fill="#FFF4E3" />
      <path d="M0 290 Q100 230 200 290 T400 290 T600 290 T800 290 V450 H0 Z" fill="#FFC62E" />
      <path d="M0 335 Q100 275 200 335 T400 335 T600 335 T800 335 V450 H0 Z" fill="#FF2E93" />
      <path d="M0 385 Q100 325 200 385 T400 385 T600 385 T800 385 V450 H0 Z" fill="#0F0D14" />
    </>
  ),
  // 5 · Parlantes sobre chicle
  () => (
    <>
      <rect width="800" height="450" fill="#FF9ACB" />
      {[110, 470].map((x) => (
        <g key={x}>
          <rect x={x} y="50" width="220" height="350" rx="28" fill="#0F0D14" />
          <circle cx={x + 110} cy="125" r="34" fill="none" stroke="#FFF4E3" strokeOpacity=".4" strokeWidth="3" />
          <circle cx={x + 110} cy="285" r="84" fill="none" stroke="#FFF4E3" strokeOpacity=".4" strokeWidth="3" />
          <circle cx={x + 110} cy="285" r="56" fill="#FF2E93" />
          <circle cx={x + 110} cy="285" r="18" fill="#FFC62E" />
        </g>
      ))}
    </>
  ),
];

// La portada automática: el número del evento decide cuál de los seis diseños usa
export function PortadaGenerada({ id, className = "" }) {
  const Diseno = DISENOS[Math.abs(Number(id) || 0) % DISENOS.length];
  return (
    <svg
      viewBox="0 0 800 450"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label="Portada del evento"
    >
      <Diseno />
    </svg>
  );
}

// La imagen del evento o, si no tiene, su portada automática.
// Se le da el tamaño desde afuera con className (por ejemplo "w-full h-full object-cover").
export default function ImagenEvento({ evento, className = "" }) {
  const url = urlImagen(evento?.imagen_url);
  if (url) {
    return <img src={url} alt={`Imagen de ${evento.nombre}`} className={className} />;
  }
  return <PortadaGenerada id={evento?.id_evento} className={className} />;
}
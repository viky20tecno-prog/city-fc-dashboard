// Rayos de energía animados sobre la imagen del hero — mismo patrón "web"
// morado que ya está pintado en public/og-image.jpg, pero con vida: carga
// viajando por cada rayo + parpadeo eléctrico + chispas sueltas.
//
// mixBlendMode:'screen' es la clave para que no se vea "pegado": solo suma
// luz sobre el fondo oscuro de la imagen en vez de tapar a los deportistas
// con una línea sólida encima — así la energía se lee como si pasara por
// detrás/alrededor de ellos, igual que el efecto original de la imagen.
//
// Coordenadas en el mismo espacio que el JPG completo (1200×630), trazadas a
// mano sobre la zona donde ya está la trama eléctrica de la imagen (detrás
// de los jugadores, mitad derecha) — el prop `viewBox` solo recorta qué
// ventana de ese mismo sistema de coordenadas se muestra (ver Hero.jsx,
// donde se le pasa el recorte "700 0 500 630" para la foto ya cropeada);
// las coordenadas de los rayos no cambian.
const BOLTS = [
  { id: 'b1', d: 'M760,260 L820,180 L800,140 L860,60 L840,20',                    delay: '0s',    dur: '3.2s' },
  { id: 'b2', d: 'M760,260 L900,220 L960,240 L1080,180 L1160,150',                delay: '0.6s',  dur: '3.6s' },
  { id: 'b3', d: 'M760,260 L860,320 L900,300 L1020,380 L1140,420',                delay: '1.3s',  dur: '3.4s' },
  { id: 'b4', d: 'M760,260 L780,360 L740,400 L820,480 L780,560',                  delay: '1.9s',  dur: '3.8s' },
  { id: 'b5', d: 'M760,260 L680,320 L660,380 L560,440 L520,540',                  delay: '0.3s',  dur: '3.0s' },
  { id: 'b6', d: 'M900,220 L980,140 L1040,150 L1120,90',                          delay: '2.2s',  dur: '2.8s' },
  { id: 'b7', d: 'M900,300 L960,360 L1040,340 L1100,400 L1160,380',               delay: '0.9s',  dur: '3.5s' },
];

const SPARKS = [
  { cx: 840,  cy: 20,  delay: '0.4s',  dur: '4.5s' },
  { cx: 1160, cy: 150, delay: '1.8s',  dur: '5.2s' },
  { cx: 1140, cy: 420, delay: '3.1s',  dur: '4.8s' },
  { cx: 780,  cy: 560, delay: '2.4s',  dur: '5.6s' },
  { cx: 520,  cy: 540, delay: '0.9s',  dur: '4.2s' },
  { cx: 1120, cy: 90,  delay: '3.6s',  dur: '5.0s' },
  { cx: 1160, cy: 380, delay: '1.2s',  dur: '4.6s' },
];

export default function LightningOverlay({ viewBox = '0 0 1200 630' }) {
  return (
    <>
      <style>{`
        @keyframes lightning-flicker {
          0%, 100% { opacity: 0.22; }
          4%  { opacity: 0.75; }
          8%  { opacity: 0.15; }
          12% { opacity: 0.55; }
          40% { opacity: 0.20; }
          55% { opacity: 0.65; }
          58% { opacity: 0.18; }
          85% { opacity: 0.45; }
        }
        @keyframes lightning-travel {
          0%   { stroke-dashoffset: 900; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes lightning-spark {
          0%, 92%, 100% { opacity: 0; transform: scale(0.4); }
          95%           { opacity: 1; transform: scale(1.3); }
          97%           { opacity: 0.6; transform: scale(0.9); }
        }
        .lightning-bolt {
          fill: none;
          stroke: url(#lightning-grad);
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: url(#lightning-glow);
          stroke-dasharray: 46 900;
          animation: lightning-flicker var(--dur) ease-in-out var(--delay) infinite,
                     lightning-travel calc(var(--dur) * 2.6) linear var(--delay) infinite;
        }
        .lightning-spark {
          transform-origin: center;
          transform-box: fill-box;
          animation: lightning-spark var(--dur) ease-in-out var(--delay) infinite;
        }
      `}</style>
      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          mixBlendMode: 'screen', pointerEvents: 'none',
        }}
      >
        <defs>
          <linearGradient id="lightning-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#C4B5FD" />
            <stop offset="45%"  stopColor="#A855F7" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <filter id="lightning-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {BOLTS.map(b => (
          <path
            key={b.id}
            d={b.d}
            className="lightning-bolt"
            style={{ '--delay': b.delay, '--dur': b.dur }}
          />
        ))}

        {SPARKS.map((s, i) => (
          <circle
            key={i}
            cx={s.cx}
            cy={s.cy}
            r={3.5}
            fill="#E9D5FF"
            filter="url(#lightning-glow)"
            className="lightning-spark"
            style={{ '--delay': s.delay, '--dur': s.dur }}
          />
        ))}
      </svg>
    </>
  );
}

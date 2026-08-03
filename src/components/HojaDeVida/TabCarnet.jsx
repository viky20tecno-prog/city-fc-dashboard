import TabCarnetV1 from './TabCarnetV1';
import TabCarnetV2 from './TabCarnetV2';

// Rollout controlado por club mientras se define el diseño definitivo: v2 es
// el rediseño tipo carnet deportivo/jersey (rayas + halftone + escudo
// fantasma, ver lib/carnetFondos.js), activado explícitamente por club vía
// `clubConfig.carnet_v2 === true`. Todos los demás clubes siguen viendo v1
// (el selector de 6 fondos de siempre) hasta que se decida el rollout global.
export default function TabCarnet({ jugador, clubConfig = {} }) {
  return clubConfig?.carnet_v2 === true
    ? <TabCarnetV2 jugador={jugador} clubConfig={clubConfig} />
    : <TabCarnetV1 jugador={jugador} clubConfig={clubConfig} />;
}

import { getIqBoost } from './iqData';

export type JugadorCampo = {
  nombre: string;
  tiro_al_arco: number;
  defensa: number;
  velocidad: number;
  fisico: number;
  pase_salida: number;
  partidos_jugados: number;
  partidos_totales: number;
  partidos_ganados: number;
  ratingFinal?: number;
};

export type Arquero = {
  nombre: string;
  valoracion_general: number;
  partidos_totales: number;
  partidos_jugados: number;
  partidos_ganados: number;
};

// Tipo interno temporal para manejar el sorteo sin romper la UI
type JugadorSorteo = JugadorCampo & { _ratingEfectivo: number };

export function generarEquipos(jugadores: JugadorCampo[], arqueros: Arquero[]) {
  // 1. Calcular rating, winrate e INYECTAR IQ
  const jugadoresConRating: JugadorSorteo[] = jugadores.map(j => {
    const promedioStats = (j.tiro_al_arco + j.defensa + j.velocidad + j.fisico + j.pase_salida) / 5;
    const winrate = j.partidos_jugados > 0 ? (j.partidos_ganados / j.partidos_jugados) : 0;
    // Solo otorga el bonus si el winrate es estrictamente mayor al 50% (0.5)
    const bonusWinrate = winrate > 0.5 ? (winrate * 1.5) : 0; 
    const ratingFinal = promedioStats + bonusWinrate;
    
    const boost = getIqBoost(j.nombre);
    const _ratingEfectivo = ratingFinal + boost;

    return { ...j, ratingFinal, _ratingEfectivo };
  }).sort((a, b) => b._ratingEfectivo - a._ratingEfectivo); // Ordenamos con el rating oculto

  const equipoA: (JugadorCampo | Arquero)[] = [];
  const equipoB: (JugadorCampo | Arquero)[] = [];
  
  // Ratings para balancear internamente (con IQ)
  let ratingA = 0;
  let ratingB = 0;
  
  // Ratings para devolver a la UI (sin IQ, pura matemática visible)
  let visibleRatingA = 0;
  let visibleRatingB = 0;

  // 2. Distribuir Arqueros
  if (arqueros.length === 2) {
    equipoA.push(arqueros[0]);
    equipoB.push(arqueros[1]);
    
    ratingA += arqueros[0].valoracion_general;
    visibleRatingA += arqueros[0].valoracion_general;
    
    ratingB += arqueros[1].valoracion_general;
    visibleRatingB += arqueros[1].valoracion_general;
  } else if (arqueros.length === 1) {
    if (Math.random() > 0.5) {
      equipoA.push(arqueros[0]);
      ratingA += arqueros[0].valoracion_general;
      visibleRatingA += arqueros[0].valoracion_general;
    } else {
      equipoB.push(arqueros[0]);
      ratingB += arqueros[0].valoracion_general;
      visibleRatingB += arqueros[0].valoracion_general;
    }
  }

  // 3. Distribuir Jugadores de campo para balancear
  for (const jugador of jugadoresConRating) {
    // Destructuramos para que el _ratingEfectivo NO viaje al frontend
    const { _ratingEfectivo, ...jugadorLimpio } = jugador;

    if (equipoA.length < equipoB.length) {
      equipoA.push(jugadorLimpio);
      ratingA += _ratingEfectivo; 
      visibleRatingA += jugadorLimpio.ratingFinal!;
    } else if (equipoB.length < equipoA.length) {
      equipoB.push(jugadorLimpio);
      ratingB += _ratingEfectivo;
      visibleRatingB += jugadorLimpio.ratingFinal!;
    } else {
      if (ratingA <= ratingB) {
        equipoA.push(jugadorLimpio);
        ratingA += _ratingEfectivo;
        visibleRatingA += jugadorLimpio.ratingFinal!;
      } else {
        equipoB.push(jugadorLimpio);
        ratingB += _ratingEfectivo;
        visibleRatingB += jugadorLimpio.ratingFinal!;
      }
    }
  }

  // Devolvemos la diferencia de los ratings visibles para no levantar sospechas
  return { 
    equipoA, 
    equipoB, 
    diferencia: Math.abs(visibleRatingA - visibleRatingB) 
  };
}
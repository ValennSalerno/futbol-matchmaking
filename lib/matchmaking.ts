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

export function generarEquipos(jugadores: JugadorCampo[], arqueros: Arquero[]) {
  // 1. Calcular rating y winrate
  const jugadoresConRating = jugadores.map(j => {
    const promedioStats = (j.tiro_al_arco + j.defensa + j.velocidad + j.fisico + j.pase_salida) / 5;
    const winrate = j.partidos_jugados > 0 ? (j.partidos_ganados / j.partidos_jugados) : 0;
    const ratingFinal = promedioStats + (winrate * 1.5); // El winrate aporta hasta 1.5 puntos extra
    return { ...j, ratingFinal };
  }).sort((a, b) => b.ratingFinal! - a.ratingFinal!);

  const equipoA: (JugadorCampo | Arquero)[] = [];
  const equipoB: (JugadorCampo | Arquero)[] = [];
  let ratingA = 0;
  let ratingB = 0;

  // 2. Distribuir Arqueros
  if (arqueros.length === 2) {
    equipoA.push(arqueros[0]);
    equipoB.push(arqueros[1]);
    ratingA += arqueros[0].valoracion_general;
    ratingB += arqueros[1].valoracion_general;
  } else if (arqueros.length === 1) {
    if (Math.random() > 0.5) {
      equipoA.push(arqueros[0]);
      ratingA += arqueros[0].valoracion_general;
    } else {
      equipoB.push(arqueros[0]);
      ratingB += arqueros[0].valoracion_general;
    }
  }

  // 3. Distribuir Jugadores de campo para balancear
  for (const jugador of jugadoresConRating) {
    if (equipoA.length < equipoB.length) {
      equipoA.push(jugador);
      ratingA += jugador.ratingFinal!;
    } else if (equipoB.length < equipoA.length) {
      equipoB.push(jugador);
      ratingB += jugador.ratingFinal!;
    } else {
      if (ratingA <= ratingB) {
        equipoA.push(jugador);
        ratingA += jugador.ratingFinal!;
      } else {
        equipoB.push(jugador);
        ratingB += jugador.ratingFinal!;
      }
    }
  }

  return { equipoA, equipoB, diferencia: Math.abs(ratingA - ratingB) };
}
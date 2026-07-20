'use server'

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Cambia 'db.json' a 'db_test.json' para hacer tus pruebas
const dbPath = path.join(process.cwd(), 'data/db.json');

export async function getDbData() {
  try {
    const file = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(file);
  } catch {
    return { jugadores_campo: [], arqueros: [], partidos: [], partido_en_curso: null };
  }
}

export async function guardarSorteo(formData: FormData) {
  const data = await getDbData();
  
  const equipoA = JSON.parse(formData.get('equipoA') as string);
  const equipoB = JSON.parse(formData.get('equipoB') as string);
  
  // Inferencia automática del formato (14 jug = F7, 10 jug = F5)
  const formato = (equipoA.length + equipoB.length) === 14 ? 7 : 5;

  data.partido_en_curso = {
    equipoA,
    equipoB,
    formato,
    fecha_sorteo: new Date().toISOString()
  };

  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
  revalidatePath('/'); 
  redirect('/'); 
}

export async function resolverPartido(formData: FormData) {
  const data = await getDbData();
  
  if (!data.partido_en_curso) return;

  const nuevoPartido = {
    id: Date.now().toString(),
    fecha: new Date().toISOString(),
    sede: formData.get('sede'),
    formato: data.partido_en_curso.formato, // Toma el formato inferido automáticamente
    ganador: formData.get('ganador'),
    equipoA: data.partido_en_curso.equipoA,
    equipoB: data.partido_en_curso.equipoB,
  };

  data.partidos.push(nuevoPartido);

  type JugadorDB = {
    nombre: string;
    partidos_totales: number;
    partidos_jugados: number;
    partidos_ganados: number;
    [key: string]: unknown;
  };

  const actualizarStats = (jugadorDb: JugadorDB, nombre: string, esGanador: boolean) => {
    if (jugadorDb.nombre === nombre) {
      jugadorDb.partidos_totales += 1;
      jugadorDb.partidos_jugados += 1;
      if (esGanador) jugadorDb.partidos_ganados += 1;
    }
  };

  const procesarEquipo = (nombresEquipo: string[], esGanador: boolean) => {
    nombresEquipo.forEach(nombre => {
      data.jugadores_campo.forEach((j: JugadorDB) => actualizarStats(j, nombre, esGanador));
      data.arqueros.forEach((a: JugadorDB) => actualizarStats(a, nombre, esGanador));
    });
  };

  procesarEquipo(nuevoPartido.equipoA, nuevoPartido.ganador === 'A');
  procesarEquipo(nuevoPartido.equipoB, nuevoPartido.ganador === 'B');

  data.partido_en_curso = null;

  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
  revalidatePath('/'); 
}
'use server'

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Inicializamos el cliente de Supabase anulando el caché de Next.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' })
  }
});

export async function getDbData() {
  try {
    // Consultamos todas las tablas en paralelo
    const [jugadoresRes, arquerosRes, partidosRes, enCursoRes] = await Promise.all([
      supabase.from('jugadores_campo').select('*'),
      supabase.from('arqueros').select('*'),
      supabase.from('partidos').select('*'),
      supabase.from('partido_en_curso').select('datos').eq('id', 1).maybeSingle()
    ]);

    return {
      jugadores_campo: jugadoresRes.data || [],
      arqueros: arquerosRes.data || [],
      partidos: partidosRes.data || [],
      partido_en_curso: enCursoRes.data?.datos || null
    };
  } catch (error) {
    console.error("Error al obtener datos:", error);
    return { jugadores_campo: [], arqueros: [], partidos: [], partido_en_curso: null };
  }
}

export async function guardarSorteo(formData: FormData) {
  // 1. Verificamos que la base de datos esté libre
  const { partido_en_curso: activo } = await getDbData();
  if (activo) {
    console.error("Intento de sobrescritura bloqueado");
    redirect('/'); 
  }

  const equipoA = JSON.parse(formData.get('equipoA') as string);
  const equipoB = JSON.parse(formData.get('equipoB') as string);
  
  const formato = (equipoA.length + equipoB.length) / 2;

  const partidoEnCurso = {
    equipoA,
    equipoB,
    formato,
    fecha_sorteo: new Date().toISOString()
  };

  // Guardado Atómico: Solo se guarda si "datos" está vacío (null)
  const { data, error } = await supabase
    .from('partido_en_curso')
    .update({ datos: partidoEnCurso })
    .eq('id', 1)
    .is('datos', null)
    .select();

  // Si alguien más guardó una fracción de segundo antes, 'datos' ya no será null
  // y Supabase nos devolverá un array vacío (length === 0).
  if (error || !data || data.length === 0) {
    console.error("Colisión: Otro usuario ya inició un draft.");
    redirect('/'); 
  }

  revalidatePath('/'); 
  redirect('/'); 
}

export async function resolverPartido(formData: FormData) {
  const { jugadores_campo, arqueros, partido_en_curso } = await getDbData();
  if (!partido_en_curso) return;

  const nuevoPartido = {
    id: Date.now().toString(),
    fecha: new Date().toISOString(),
    sede: formData.get('sede'),
    formato: partido_en_curso.formato,
    ganador: formData.get('ganador'),
    equipo_a: partido_en_curso.equipoA, 
    equipo_b: partido_en_curso.equipoB,
  };

  // 1. Insertamos el partido en el historial
  await supabase.from('partidos').insert(nuevoPartido);

  // Helper para actualizar estadísticas
  const actualizarJugador = async (nombre: string, esGanador: boolean) => {
    // Determinamos si es arquero, jugador de campo, o invitado
    const isArquero = arqueros.some((a: { nombre: string }) => a.nombre === nombre);
    const isCampo = jugadores_campo.some((j: { nombre: string }) => j.nombre === nombre);
    const tabla = isArquero ? 'arqueros' : isCampo ? 'jugadores_campo' : null;

    if (!tabla) return; // Es un invitado, lo ignoramos
    
    const jugadorActual = isArquero 
      ? arqueros.find((a: { nombre: string }) => a.nombre === nombre)
      : jugadores_campo.find((j: { nombre: string }) => j.nombre === nombre);

    await supabase.from(tabla).update({
      partidos_totales: jugadorActual.partidos_totales + 1,
      partidos_jugados: jugadorActual.partidos_jugados + 1,
      partidos_ganados: jugadorActual.partidos_ganados + (esGanador ? 1 : 0)
    }).eq('nombre', nombre);
  };

  const procesarEquipo = async (nombres: string[], esGanador: boolean) => {
    const promesas = nombres.map(nombre => actualizarJugador(nombre, esGanador));
    await Promise.all(promesas);
  };

  // 2. Procesamos ambos equipos y limpiamos el partido en curso en paralelo
  await Promise.all([
    procesarEquipo(partido_en_curso.equipoA, nuevoPartido.ganador === 'equipoA'),
    procesarEquipo(partido_en_curso.equipoB, nuevoPartido.ganador === 'equipoB'),
    supabase.from('partido_en_curso').update({ datos: null }).eq('id', 1)
  ]);

  revalidatePath('/'); 
}

export async function cancelarPartidoEnCurso() {
  await supabase.from('partido_en_curso').update({ datos: null }).eq('id', 1);
  revalidatePath('/'); 
  revalidatePath('/test');
}
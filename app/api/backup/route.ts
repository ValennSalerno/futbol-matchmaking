import { NextResponse } from 'next/server';
import { getDbData } from '@/app/actions';

export async function GET() {
  // Traemos toda la base de datos actualizada usando tu función ya creada
  const data = await getDbData();
  
  // Generamos la fecha de hoy para el nombre del archivo
  const fecha = new Date().toISOString().split('T')[0];
  
  return NextResponse.json(data, {
    headers: {
      'Content-Disposition': `attachment; filename="taquito_backup_${fecha}.json"`,
    },
  });
}
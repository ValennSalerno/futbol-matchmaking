// Función blindada para limpiar strings (quita tildes, espacios raros y mayúsculas)
export function normalizarNombre(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Elimina acentos
    .toLowerCase()
    .replace(/\s+/g, " ") // Colapsa múltiples espacios en uno solo
    .trim();
}

export const playerIQMap: Record<string, number> = {
  "nahue": 4.6,
  "chiffo": 6.2,
  "chino": 8.0,
  "kevin": 6.5,
  "leo": 9.0,
  "mati bianchi": 5.1, 
  "mati toledo": 7.0,
  "rama": 5.5,
  "valen": 8.0,
  "agus ross": 8.2,
  "junco": 7.8,
  "agus fatur": 7.5,
  "ari": 8.0,
  "gonza": 7.0,
  "franco": 7.4,
  "junquito": 6.4,
  "agus ruiz": 4.5,
  "negro": 5.2,
  "cubi": 5.0,
  "dylan": 4.8,
  "pitiki": 8.1,
  "peluque": 5.8,
  "gonzi": 7.0,
  "mati p": 5.4,
  "cris": 5.2,
};

// Función para obtener el boost matemático
export function getIqBoost(nombre: string): number {
  const normalizedName = normalizarNombre(nombre);
  const iq = playerIQMap[normalizedName] ?? 7; // 7 es el punto de equilibrio
  
  // Fórmula: Cada punto por encima de 7 suma 0.5 de rating, por debajo resta 0.5.
  return (iq - 7) * 0.5; 
}
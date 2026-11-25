export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getDbData } from "../actions";
import ForoInteractive, {
  JugadorVotable,
} from "@/components/ui/ForoInteractive";

export default async function ForoPage() {
  const db = await getDbData();

  const jugadores: JugadorVotable[] = [
    ...(db.jugadores_campo || []).map((j) => ({
      nombre: j.nombre,
      esArquero: false,
    })),
    ...(db.arqueros || []).map((a) => ({
      nombre: a.nombre,
      esArquero: true,
    })),
  ].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return <ForoInteractive jugadores={jugadores} />;
}

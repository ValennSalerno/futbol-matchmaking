import { getDbData } from "@/app/actions";
import { getIqBoost, playerIQMap, normalizarNombre } from "@/lib/iqData";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function IqDebugger() {
  const db = await getDbData();
  const jugadores = db.jugadores_campo || [];

  // Replicamos la lógica para exponer los datos
  const datosDebug = jugadores
    .map((j) => {
      const promedioStats =
        (j.tiro_al_arco + j.defensa + j.velocidad + j.fisico + j.pase_salida) /
        5;
      const winrate =
        j.partidos_jugados > 0 ? j.partidos_ganados / j.partidos_jugados : 0;
      const bonusWinrate = winrate > 0.5 ? winrate * 1.5 : 0;
      const ratingVisible = promedioStats + bonusWinrate;

      const nombreNormalizado = normalizarNombre(j.nombre);
      const iq = playerIQMap[nombreNormalizado] ?? 7;
      const boost = getIqBoost(j.nombre);
      const ratingEfectivo = ratingVisible + boost;

      return {
        nombre: j.nombre,
        promedio: promedioStats,
        bonusWinrate,
        ratingVisible,
        iq,
        boost,
        ratingEfectivo,
      };
    })
    .sort((a, b) => b.ratingEfectivo - a.ratingEfectivo);

  return (
    <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-purple-600 mt-6">
      <CardHeader>
        <CardTitle className="text-purple-400 flex items-center gap-2">
          <span>🧠</span> Panel de Control Clasificado (IQ / MMR Oculto)
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="font-bold text-slate-400">
                Jugador
              </TableHead>
              <TableHead className="font-bold text-slate-400 text-center">
                Stats Base
              </TableHead>
              <TableHead className="font-bold text-slate-400 text-center">
                + Winrate
              </TableHead>
              <TableHead className="font-bold text-cyan-500 text-center">
                OVR + Winrate
              </TableHead>
              <TableHead className="font-bold text-purple-400 text-center">
                IQ (Base 7)
              </TableHead>
              <TableHead className="font-bold text-purple-400 text-center">
                Boost Oculto
              </TableHead>
              <TableHead className="font-bold text-emerald-400 text-center">
                Rating Real
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {datosDebug.map((d, i) => (
              <TableRow
                key={i}
                className="border-slate-800 hover:bg-slate-800/50"
              >
                <TableCell className="font-bold text-slate-200">
                  {d.nombre}
                </TableCell>
                <TableCell className="text-center text-slate-400">
                  {d.promedio.toFixed(2)}
                </TableCell>
                <TableCell className="text-center text-slate-400">
                  +{d.bonusWinrate.toFixed(2)}
                </TableCell>
                <TableCell className="text-center font-bold text-cyan-500">
                  {d.ratingVisible.toFixed(2)}
                </TableCell>
                <TableCell className="text-center font-bold text-purple-400">
                  {d.iq.toFixed(1)}
                </TableCell>
                <TableCell
                  className={`text-center font-bold ${d.boost >= 0 ? "text-emerald-500" : "text-red-500"}`}
                >
                  {d.boost >= 0 ? "+" : ""}
                  {d.boost.toFixed(2)}
                </TableCell>
                <TableCell className="text-center font-black text-emerald-400 text-lg">
                  {d.ratingEfectivo.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

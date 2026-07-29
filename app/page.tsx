export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getDbData, resolverPartido } from "./actions";
import Link from "next/link";
import PlayerCardModal from "@/components/ui/PlayerCardModal";
import ClickableRow from "@/components/ui/ClickableRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function Home() {
  const db = await getDbData();
  const { partidos, jugadores_campo, arqueros, partido_en_curso } = db;

  const totalPartidos = 34 + (partidos?.length || 0);
  const ultimoPartido =
    partidos?.length > 0
      ? new Date(partidos[partidos.length - 1].fecha).toLocaleDateString()
      : "18/7/2026";

  const todosLosJugadores = [...(jugadores_campo || []), ...(arqueros || [])]
    .filter((j) => j.partidos_totales > 0)
    .sort((a, b) => {
      if (b.partidos_totales !== a.partidos_totales) {
        return b.partidos_totales - a.partidos_totales;
      }
      const winrateA =
        a.partidos_jugados > 0 ? a.partidos_ganados / a.partidos_jugados : 0;
      const winrateB =
        b.partidos_jugados > 0 ? b.partidos_ganados / b.partidos_jugados : 0;
      return winrateB - winrateA;
    });

  const contadoresFormato: Record<number, number> = { 5: 7, 7: 27, 8: 0, 9: 0 };
  const contadoresMeses: Record<number, number> = {
    0: 6,
    1: 4,
    2: 6,
    3: 4,
    4: 5,
    5: 6,
    6: 3,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
  };

  partidos?.forEach((p) => {
    if (p.formato)
      contadoresFormato[p.formato] = (contadoresFormato[p.formato] || 0) + 1;
    if (p.fecha) {
      const mes = new Date(p.fecha).getMonth();
      contadoresMeses[mes] = (contadoresMeses[mes] || 0) + 1;
    }
  });

  const nombresMeses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-4xl font-extrabold text-emerald-400 pb-2">
          | Taquito FC
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Partidos Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-100">
                {totalPartidos}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Último Partido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-emerald-500">
                {ultimoPartido}
              </div>
            </CardContent>
          </Card>

          {partido_en_curso ? (
            <Card className="bg-slate-900 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex flex-col justify-center">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-xs font-bold text-emerald-400 uppercase tracking-wider text-center flex items-center justify-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Partido en Curso
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* NUEVA SECCIÓN: Listado de Equipos */}
                <div className="flex justify-between bg-slate-950/50 rounded-lg p-3 mb-4 border border-slate-800 text-xs shadow-inner">
                  <div className="flex flex-col w-1/2 pr-2 border-r border-slate-800/80 space-y-1.5">
                    <span className="font-black text-cyan-500 border-b border-cyan-900/50 pb-1 mb-1">
                      EQUIPO A
                    </span>
                    {(
                      partido_en_curso?.datos?.equipoA ||
                      partido_en_curso?.equipoA ||
                      []
                    ).map((j: string | { nombre: string }, i: number) => (
                      <span
                        key={`A-${i}`}
                        className="text-cyan-100/80 font-medium truncate"
                      >
                        {typeof j === "string" ? j : j.nombre}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col w-1/2 pl-2 text-right space-y-1.5">
                    <span className="font-black text-emerald-500 border-b border-emerald-900/50 pb-1 mb-1">
                      EQUIPO B
                    </span>
                    {(
                      partido_en_curso?.datos?.equipoB ||
                      partido_en_curso?.equipoB ||
                      []
                    ).map((j: string | { nombre: string }, i: number) => (
                      <span
                        key={`B-${i}`}
                        className="text-emerald-100/80 font-medium truncate"
                      >
                        {typeof j === "string" ? j : j.nombre}
                      </span>
                    ))}
                  </div>
                </div>

                {/* BOTONES DE SELECCIÓN */}
                <form
                  action={resolverPartido}
                  className="grid grid-cols-2 gap-2"
                >
                  <button
                    type="submit"
                    name="ganador"
                    value="equipoA"
                    className="bg-cyan-900/40 hover:bg-cyan-700 border border-cyan-800 text-cyan-100 font-bold py-2 rounded-lg transition-colors text-sm truncate px-1"
                  >
                    Gana A
                  </button>
                  <button
                    type="submit"
                    name="ganador"
                    value="equipoB"
                    className="bg-emerald-900/40 hover:bg-emerald-700 border border-emerald-800 text-emerald-100 font-bold py-2 rounded-lg transition-colors text-sm truncate px-1"
                  >
                    Gana B
                  </button>
                  <button
                    type="submit"
                    name="ganador"
                    value="empate"
                    className="col-span-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-2 rounded-lg transition-colors text-sm mt-1"
                  >
                    Empate
                  </button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Link
              href="/matchmaking"
              className="w-full h-full min-h-30 flex flex-col items-center justify-center bg-emerald-500 hover:bg-emerald-400 transition-all rounded-xl border border-emerald-400 font-bold text-slate-950 shadow-lg shadow-emerald-500/20"
            >
              <span className="text-2xl mb-1">⚽</span>
              ARMAR EQUIPOS
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-slate-900 border-slate-800 h-full">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-100">
                  Rendimiento y Asistencia
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="font-bold text-slate-400 w-16">
                        Pos
                      </TableHead>
                      <TableHead className="font-bold text-slate-400">
                        Jugador
                      </TableHead>
                      <TableHead className="font-bold text-slate-400 text-center">
                        PJ
                      </TableHead>
                      <TableHead className="font-bold text-slate-400 text-center">
                        % Asistencia
                      </TableHead>
                      <TableHead className="font-bold text-slate-400 text-center">
                        Winrate
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todosLosJugadores.map((j, index) => {
                      const asistencia = Math.round(
                        (j.partidos_totales / totalPartidos) * 100,
                      );
                      const winrate =
                        j.partidos_jugados > 0
                          ? Math.round(
                              (j.partidos_ganados / j.partidos_jugados) * 100,
                            )
                          : 0;

                      const pos = index + 1;
                      const isTop3 = pos <= 3;
                      const isSudamericana = pos >= 4 && pos <= 10;
                      const isDescenso = pos >= 21 && pos <= 25;

                      let rowStyles = "border-slate-800 transition-colors ";
                      if (isTop3 || isSudamericana)
                        rowStyles += "bg-sky-900/20 hover:bg-sky-900/40";
                      else if (isDescenso)
                        rowStyles += "bg-red-900/20 hover:bg-red-900/40";
                      else rowStyles += "hover:bg-slate-800/50";

                      return (
                        <ClickableRow
                          key={j.nombre}
                          nombreJugador={j.nombre}
                          className={rowStyles}
                        >
                          <TableCell
                            className={`font-black ${isTop3 ? "text-emerald-400" : "text-slate-500"}`}
                          >
                            #{pos}
                          </TableCell>
                          <TableCell className="font-bold text-slate-200">
                            {j.nombre}
                          </TableCell>
                          <TableCell className="text-center font-medium text-slate-300">
                            {j.partidos_totales}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="bg-slate-800 text-slate-300 py-1 px-2 rounded-md font-bold text-sm">
                              {asistencia}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`py-1 px-2 rounded-md font-bold text-sm ${winrate > 50 ? "text-emerald-400 bg-emerald-400/10" : winrate > 0 ? "text-yellow-400 bg-yellow-400/10" : "text-slate-500"}`}
                            >
                              {winrate}%
                            </span>
                          </TableCell>
                        </ClickableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="bg-slate-950/40 border-b border-slate-800 py-4">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                  Formato
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {[7, 5, 8, 9].map(
                      (formato) =>
                        contadoresFormato[formato] > 0 && (
                          <TableRow
                            key={formato}
                            className="border-slate-800 hover:bg-slate-800/50"
                          >
                            <TableCell className="font-bold text-slate-300">
                              Fútbol {formato}
                            </TableCell>
                            <TableCell className="text-right font-bold text-emerald-400">
                              {contadoresFormato[formato]}
                            </TableCell>
                          </TableRow>
                        ),
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent bg-slate-900/20">
                      <TableHead className="text-slate-400">Mes</TableHead>
                      <TableHead className="text-right text-slate-400">
                        Jugados
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nombresMeses.map(
                      (mes, index) =>
                        contadoresMeses[index] > 0 && (
                          <TableRow
                            key={mes}
                            className="border-slate-800 hover:bg-slate-800/50"
                          >
                            <TableCell className="font-medium text-slate-300">
                              {mes}
                            </TableCell>
                            <TableCell className="text-right font-bold text-slate-100">
                              {contadoresMeses[index]}
                            </TableCell>
                          </TableRow>
                        ),
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <PlayerCardModal jugadoresDb={todosLosJugadores} />
    </main>
  );
}

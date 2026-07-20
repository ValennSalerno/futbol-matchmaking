export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getDbData, resolverPartido } from "./actions";
import Link from "next/link";
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
    .sort((a, b) => b.partidos_totales - a.partidos_totales);

  const capitanA = partido_en_curso?.equipoA?.[0] || "A";
  const capitanB = partido_en_curso?.equipoB?.[0] || "B";

  return (
    <main className="p-8 max-w-6xl mx-auto space-y-8 min-h-screen selection:bg-emerald-500/30">
      <div className="flex items-center gap-3 mb-10">
        <div className="h-10 w-3 bg-emerald-500 rounded-full"></div>
        <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-400">
          Taquito FC
        </h1>
      </div>

      {partido_en_curso && (
        <Card className="bg-slate-900 border-emerald-500/50 shadow-emerald-500/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse"></div>
          <CardHeader>
            <CardTitle className="text-emerald-400 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Partido en Curso (Fútbol {partido_en_curso.formato})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={resolverPartido}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
            >
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400">Sede</label>
                <input
                  name="sede"
                  placeholder="Ej: Sagrado"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-lg outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400">
                  Ganador
                </label>
                <select
                  name="ganador"
                  defaultValue=""
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-lg outline-none focus:border-emerald-500"
                  required
                >
                  <option value="" disabled>
                    Seleccionar...
                  </option>

                  <option value="A">Equipo de {capitanA}</option>
                  <option value="B">Equipo de {capitanB}</option>

                  <option value="Empate">Empate</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold p-3 rounded-lg transition-colors h-12.5"
              >
                Cargar Resultado
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-800 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 uppercase text-xs font-bold tracking-wider">
              Partidos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-black text-white">{totalPartidos}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 uppercase text-xs font-bold tracking-wider">
              Último Partido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-emerald-400">
              {ultimoPartido}
            </p>
          </CardContent>
        </Card>

        {!partido_en_curso ? (
          <Link
            href="/matchmaking"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl p-6 transition-all shadow-xl flex flex-col justify-center items-center hover:scale-[1.02] active:scale-95"
          >
            <span className="text-3xl mb-1">⚽</span>
            <span className="text-xl tracking-tight uppercase">
              Armar Equipos
            </span>
          </Link>
        ) : (
          <Card className="bg-slate-900 border-slate-800 shadow-xl flex flex-col justify-center items-center opacity-50">
            <span className="text-slate-500 font-bold uppercase text-center p-4">
              Termina el partido actual <br /> para armar otro
            </span>
          </Card>
        )}
      </div>

      <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-slate-800 bg-slate-900/50">
          <CardTitle className="text-xl font-bold text-slate-200">
            Rendimiento y Asistencia
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-950/50">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 font-bold">Pos</TableHead>
                <TableHead className="text-slate-400 font-bold">
                  Jugador
                </TableHead>
                <TableHead className="text-slate-400 font-bold text-center">
                  PJ
                </TableHead>
                <TableHead className="text-slate-400 font-bold text-center">
                  % Asistencia
                </TableHead>
                <TableHead className="text-slate-400 font-bold text-center">
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
                const isTop3 = index < 3;

                return (
                  <TableRow
                    key={j.nombre}
                    className="border-slate-800 hover:bg-slate-800/50 transition-colors"
                  >
                    <TableCell
                      className={`font-black ${isTop3 ? "text-emerald-400" : "text-slate-500"}`}
                    >
                      #{index + 1}
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
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}

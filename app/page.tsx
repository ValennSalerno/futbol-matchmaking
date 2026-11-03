export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getDbData, resolverPartido } from "./actions";
import Link from "next/link";
import PlayerCardModal from "@/components/ui/PlayerCardModal";
import DashboardInteractive from "@/components/ui/DashboardInteractive";
import ConfirmForm from "@/components/ui/ConfirmForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  const db = await getDbData();
  const { partidos, jugadores_campo, arqueros, partido_en_curso } = db;

  const totalPartidos = 34 + (partidos?.length || 0);
  const partidosOrdenados =
    partidos
      ?.slice()
      .sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
      ) || [];

  const ultimoPartido =
    partidosOrdenados.length > 0
      ? new Date(
          partidosOrdenados[partidosOrdenados.length - 1].fecha,
        ).toLocaleDateString("es-AR", {
          timeZone: "America/Argentina/Buenos_Aires",
        })
      : "18/7/2026";

  const todosLosJugadores = [
    ...(jugadores_campo || []),
    ...(arqueros || []).map((a) => ({ ...a, esArquero: true })),
  ]
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

  const contadoresFormato: Record<number, number> = {
    5: 7,
    6: 0,
    7: 27,
    8: 0,
    9: 0,
  };
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

  const sanciones = [
    { cant: 8, nombre: "Cris", motivo: "No jugó en al menos 8 meses" },
    { cant: 7, nombre: "Peluque", motivo: "No jugó en al menos 7 meses" },
    { cant: 7, nombre: "Dylan", motivo: "No jugó en al menos 7 meses" },
    { cant: 4, nombre: "Gonzi", motivo: "No jugó en al menos 4 meses" },
    { cant: 2, nombre: "Ari", motivo: "No jugó en al menos 2 meses" },
    { cant: 2, nombre: "Mati P", motivo: "Estuvo 2 meses sin jugar" },
    { cant: 2, nombre: "Junquito", motivo: "Estuvo 2 meses sin jugar" },
    { cant: 1, nombre: "Chino", motivo: "Bajarse del partido 3 hs antes" },
    { cant: 1, nombre: "Fran", motivo: "Estuvo 1 mes sin jugar" },
  ];

  return (
    <main className="min-h-screen bg-[#080C14] text-slate-100 p-4 md:p-8 selection:bg-[#00E676] selection:text-slate-950">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Modal de Carta FUT + Radar + Comparador 1v1 */}
        <PlayerCardModal
          jugadoresDb={todosLosJugadores}
          totalPartidos={totalPartidos}
        />

        {/* Header Superior */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-1.5 rounded-full bg-[#00E676] shadow-[0_0_12px_#00E676]"></div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-sport text-3xl font-bold tracking-wider text-white">
                  TAQUITO <span className="text-[#00E676]">FC</span>
                </h1>
                <span className="text-[11px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30">
                  Temporada 2026
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Panel oficial de rendimiento, cartas FUT y Matchmaking
                inteligente
              </p>
            </div>
          </div>
        </header>

        {/* Top KPI Cards + Acción de Partido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0E1422] border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Partidos Totales
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-sport text-4xl font-bold text-white">
                {totalPartidos}
              </span>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                Temporada 2026
              </span>
            </div>
          </div>

          <div className="bg-[#0E1422] border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Último Encuentro
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-sport text-2xl font-bold text-[#00E676]">
                {ultimoPartido}
              </span>
              <span className="text-xs text-slate-400">Historial Oficial</span>
            </div>
          </div>

          <div className="bg-[#0E1422] border border-[#00E676]/40 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#00E676]">
                Próxima Fecha
              </span>
              <p className="text-sm font-semibold text-white mt-0.5">
                {partido_en_curso
                  ? `Partido en curso (Fútbol ${partido_en_curso.formato})`
                  : "Armar equipos y ver cancha 2D"}
              </p>
            </div>
            {!partido_en_curso && (
              <Link
                href="/matchmaking"
                className="px-4 py-2.5 rounded-xl bg-[#00E676] text-slate-950 font-bold text-xs tracking-wide hover:brightness-110 transition shadow-[0_0_20px_rgba(0,230,118,0.3)] shrink-0"
              >
                ⚽ ARMAR EQUIPOS
              </Link>
            )}
          </div>
        </div>

        {/* Tarjeta de Partido en Curso (si existe un sorteo activo) */}
        {partido_en_curso && (
          <Card className="bg-[#0E1422] border-emerald-500/50 shadow-lg shadow-emerald-500/10">
            <CardHeader className="bg-emerald-950/20 border-b border-slate-800 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-[#00E676] text-lg flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  Partido en curso (Fútbol {partido_en_curso.formato})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-cyan-400 block mb-1">
                    Equipo A
                  </span>
                  <p className="text-sm text-slate-300 font-medium">
                    {partido_en_curso.equipoA.join(", ")}
                  </p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-[#00E676] block mb-1">
                    Equipo B
                  </span>
                  <p className="text-sm text-slate-300 font-medium">
                    {partido_en_curso.equipoB.join(", ")}
                  </p>
                </div>
              </div>

              <ConfirmForm action={resolverPartido}>
                <input
                  type="text"
                  name="sede"
                  placeholder="Sede (Ej: El Coloso)"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-lg text-sm mb-3 outline-none focus:border-[#00E676]"
                  required
                />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <button
                    type="submit"
                    name="ganador"
                    value="equipoA"
                    className="bg-cyan-900/40 hover:bg-cyan-700 border border-cyan-800 text-cyan-100 font-bold py-2 rounded-lg transition-colors text-sm truncate px-1 cursor-pointer"
                  >
                    Gana Equipo A
                  </button>
                  <button
                    type="submit"
                    name="ganador"
                    value="equipoB"
                    className="bg-emerald-900/40 hover:bg-emerald-700 border border-emerald-800 text-emerald-100 font-bold py-2 rounded-lg transition-colors text-sm truncate px-1 cursor-pointer"
                  >
                    Gana Equipo B
                  </button>
                  <button
                    type="submit"
                    name="ganador"
                    value="empate"
                    className="col-span-2 md:col-span-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-2 rounded-lg transition-colors text-sm mt-1 md:mt-0 cursor-pointer"
                  >
                    Empate
                  </button>
                </div>
              </ConfirmForm>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Interactivo (Highlights + Tabla + Galería + Sidebar) */}
        <DashboardInteractive
          jugadores={todosLosJugadores}
          totalPartidos={totalPartidos}
          childrenSidebar={
            <>
              {/* Tarjeta 1: Formato Jugado */}
              <div className="bg-[#0E1422] border border-slate-800/90 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Formato Jugado
                  </span>
                  <span className="text-xs text-slate-400">
                    {totalPartidos} totales
                  </span>
                </div>
                <div className="space-y-2.5">
                  {[7, 5, 6, 8, 9]
                    .filter((fmt) => (contadoresFormato[fmt] || 0) > 0)
                    .map((fmt) => {
                      const cant = contadoresFormato[fmt] || 0;
                      const pct =
                        totalPartidos > 0
                          ? Math.round((cant / totalPartidos) * 100)
                          : 0;
                      return (
                        <div key={fmt}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold text-white">
                              Fútbol {fmt}
                            </span>
                            <span className="text-[#00E676] font-bold">
                              {cant} partidos ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-[#00E676] rounded-full"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Tarjeta 2: Sanciones por Inactividad */}
              <div className="bg-[#0E1422] border border-rose-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-rose-400">
                    🚨 Sanciones vigentes
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-rose-500/15 text-rose-300">
                    {sanciones.length} registros
                  </span>
                </div>
                <div className="divide-y divide-slate-800/70 text-xs">
                  {sanciones.map((s) => (
                    <div
                      key={s.nombre}
                      className="py-2 flex items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-bold text-white">{s.nombre}</span>{" "}
                        <span className="text-slate-400">• {s.motivo}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded font-bold shrink-0 ${
                          s.cant >= 4
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {s.cant} {s.cant === 1 ? "sanción" : "sanciones"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tarjeta 3: Actividad por Mes */}
              <div className="bg-[#0E1422] border border-slate-800/90 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Partidos por Mes
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {nombresMeses.map((mes, idx) => {
                    const cant = contadoresMeses[idx] || 0;
                    return (
                      <div
                        key={mes}
                        className={`p-2 rounded-lg border text-center ${
                          cant > 0
                            ? "bg-slate-900/90 border-slate-800 text-slate-200"
                            : "bg-slate-950/40 border-slate-900 text-slate-600"
                        }`}
                      >
                        <span className="block text-[10px] uppercase">
                          {mes.slice(0, 3)}
                        </span>
                        <span className="font-sport font-bold text-sm text-[#00E676]">
                          {cant}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          }
        />
      </div>
    </main>
  );
}

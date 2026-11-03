"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { generarEquipos, JugadorCampo, Arquero } from "@/lib/matchmaking";
import { getPlayerStatsAndTier, JugadorStatsDB } from "@/lib/playerStats";
import { getDbData, guardarSorteo } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type Invitado = { nombre: string; rating: number };
type JugadorEquipo = JugadorCampo | Arquero;

export default function Matchmaking() {
  const [db, setDb] = useState<{
    jugadores_campo: JugadorCampo[];
    arqueros: Arquero[];
  }>({ jugadores_campo: [], arqueros: [] });
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [invitados, setInvitados] = useState<Invitado[]>([]);

  const [nombreInvitado, setNombreInvitado] = useState("");
  const [ratingInvitado, setRatingInvitado] = useState<number | "">("");

  const [equipos, setEquipos] = useState<{
    equipoA: JugadorEquipo[];
    equipoB: JugadorEquipo[];
  } | null>(null);

  const [seleccionSwap, setSeleccionSwap] = useState<{
    nombre: string;
    equipo: "equipoA" | "equipoB";
  } | null>(null);

  const router = useRouter();

  useEffect(() => {
    getDbData().then((data) => {
      if (data.partido_en_curso) {
        router.push("/");
        return;
      }
      setDb(data);
    });
  }, [router]);

  const totalJugadores = seleccionados.length + invitados.length;
  const formatosValidos = [10, 12, 14, 16, 18];
  const esCantidadValida = formatosValidos.includes(totalJugadores);

  const todosLosJugadores = [...db.jugadores_campo, ...db.arqueros];
  const jugadoresDisponibles = todosLosJugadores.filter(
    (j) => !seleccionados.includes(j.nombre),
  );

  const agregarJugador = (nombre: string) => {
    if (!nombre) return;
    setSeleccionados((prev) => [...prev, nombre]);
  };

  const quitarJugador = (nombre: string) => {
    setSeleccionados((prev) => prev.filter((n) => n !== nombre));
  };

  const agregarInvitado = () => {
    if (!nombreInvitado || !ratingInvitado) return;
    setInvitados((prev) => [
      ...prev,
      { nombre: `${nombreInvitado} (Inv)`, rating: Number(ratingInvitado) },
    ]);
    setNombreInvitado("");
    setRatingInvitado("");
  };

  const quitarInvitado = (nombre: string) => {
    setInvitados((prev) => prev.filter((i) => i.nombre !== nombre));
  };

  const armarEquipos = () => {
    const jugCampo = db.jugadores_campo.filter((j) =>
      seleccionados.includes(j.nombre),
    );
    const arq = db.arqueros.filter((a) => seleccionados.includes(a.nombre));

    const falsosJugadoresCampo: JugadorCampo[] = invitados.map((inv) => ({
      nombre: inv.nombre,
      tiro_al_arco: inv.rating,
      defensa: inv.rating,
      velocidad: inv.rating,
      fisico: inv.rating,
      pase_salida: inv.rating,
      partidos_jugados: 0,
      partidos_totales: 0,
      partidos_ganados: 0,
    }));

    setEquipos(generarEquipos([...jugCampo, ...falsosJugadoresCampo], arq));
    setSeleccionSwap(null);
  };

  // Permite intercambiar jugadores tocando uno del Equipo A y otro del Equipo B
  const handleJugadorClick = (
    nombre: string,
    equipoDestino: "equipoA" | "equipoB",
  ) => {
    if (!seleccionSwap) {
      setSeleccionSwap({ nombre, equipo: equipoDestino });
      return;
    }

    if (seleccionSwap.nombre === nombre) {
      setSeleccionSwap(null);
      return;
    }

    if (seleccionSwap.equipo === equipoDestino) {
      setSeleccionSwap({ nombre, equipo: equipoDestino });
      return;
    }

    setEquipos((prev) => {
      if (!prev) return prev;

      const equipoOrigen = seleccionSwap.equipo;
      const j1 = prev[equipoOrigen].find(
        (j) => j.nombre === seleccionSwap.nombre,
      )!;
      const j2 = prev[equipoDestino].find((j) => j.nombre === nombre)!;

      const nuevosEquipos = { ...prev };
      nuevosEquipos[equipoOrigen] = prev[equipoOrigen].map((j) =>
        j.nombre === j1.nombre ? j2 : j,
      );
      nuevosEquipos[equipoDestino] = prev[equipoDestino].map((j) =>
        j.nombre === j2.nombre ? j1 : j,
      );

      return nuevosEquipos;
    });

    setSeleccionSwap(null);
  };

  // Cálculo de medias OVR para la barra de balance de cancha
  const getTeamAvgOvr = (team: JugadorEquipo[]) => {
    if (!team.length) return 0;
    const sum = team.reduce((acc, j) => {
      const info = getPlayerStatsAndTier(j as JugadorStatsDB);
      return acc + info.ovr;
    }, 0);
    return sum / team.length;
  };

  const avgA = equipos ? getTeamAvgOvr(equipos.equipoA) : 0;
  const avgB = equipos ? getTeamAvgOvr(equipos.equipoB) : 0;
  const diff = Math.abs(avgA - avgB);
  const parity = Math.max(60, Math.round(100 - diff * 4));

  return (
    <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 min-h-screen bg-[#080C14] text-slate-100 selection:bg-[#00E676] selection:text-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#00E676]">
            Matchmaking & Cancha 2D
          </span>
          <h1 className="font-sport text-3xl md:text-4xl font-bold tracking-wide text-white">
            ARMADOR DE <span className="text-[#00E676]">EQUIPOS</span>
          </h1>
        </div>
        <Link
          href="/"
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
        >
          &larr; Volver al Inicio
        </Link>
      </div>

      {!equipos ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-[#0E1422] border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-200 text-base">
                  Plantel Oficial ({jugadoresDisponibles.length} disponibles)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-3 outline-none focus:border-[#00E676] transition-colors"
                  onChange={(e) => agregarJugador(e.target.value)}
                  value=""
                >
                  <option value="" disabled>
                    Seleccionar jugador de Taquito...
                  </option>
                  {jugadoresDisponibles.map((j) => {
                    const info = getPlayerStatsAndTier(j as JugadorStatsDB);
                    return (
                      <option key={j.nombre} value={j.nombre}>
                        {j.nombre} ({info.ovr} OVR • {info.posLabel})
                      </option>
                    );
                  })}
                </select>
              </CardContent>
            </Card>

            <Card className="bg-[#0E1422] border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-200 text-base">
                  Añadir Invitado
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                <input
                  placeholder="Nombre"
                  value={nombreInvitado}
                  onChange={(e) => setNombreInvitado(e.target.value)}
                  className="w-1/2 bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl outline-none focus:border-[#00E676]"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="Nivel (1-10)"
                  value={ratingInvitado}
                  onChange={(e) =>
                    setRatingInvitado(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-1/3 bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl outline-none focus:border-[#00E676]"
                />
                <button
                  type="button"
                  onClick={agregarInvitado}
                  className="w-1/4 bg-[#00E676] hover:brightness-110 text-slate-950 font-bold rounded-xl cursor-pointer"
                >
                  +
                </button>
              </CardContent>
            </Card>
          </div>

          <div className="bg-[#0E1422] border border-slate-800 rounded-2xl p-4">
            <h3 className="text-slate-300 font-bold mb-4 text-sm">
              Convocados actuales:{" "}
              <span className="font-sport text-lg text-[#00E676]">
                {totalJugadores}
              </span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {seleccionados.map((nombre) => {
                const jugObj = todosLosJugadores.find(
                  (j) => j.nombre === nombre,
                );
                const info = jugObj
                  ? getPlayerStatsAndTier(jugObj as JugadorStatsDB)
                  : null;
                return (
                  <div
                    key={nombre}
                    className="bg-slate-900 rounded-xl p-3 flex justify-between items-center border border-slate-800"
                  >
                    <div>
                      <span className="font-bold text-slate-100 block text-sm">
                        {nombre}
                      </span>
                      {info && (
                        <span className="text-[11px] text-slate-400">
                          {info.ovr} OVR • {info.posLabel}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => quitarJugador(nombre)}
                      className="text-slate-500 hover:text-rose-400 transition-colors font-black px-1.5 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              {invitados.map((inv) => (
                <div
                  key={inv.nombre}
                  className="bg-emerald-950/30 rounded-xl p-3 flex justify-between items-center border border-emerald-500/30"
                >
                  <div>
                    <span className="font-bold text-[#00E676] block text-sm">
                      {inv.nombre}
                    </span>
                    <span className="text-[11px] text-emerald-300/70">
                      Nivel {inv.rating} ({inv.rating * 10} OVR)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => quitarInvitado(inv.nombre)}
                    className="text-slate-500 hover:text-rose-400 transition-colors font-black px-1.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={armarEquipos}
            disabled={!esCantidadValida}
            className="w-full bg-[#00E676] hover:brightness-110 text-slate-950 font-black rounded-2xl p-4 transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(0,230,118,0.25)]"
          >
            {esCantidadValida
              ? "⚽ SORTEAR EQUIPOS EN CANCHA 2D 🎲"
              : `Deben ser 10, 12, 14, 16 o 18 jugadores (Actual: ${totalJugadores})`}
          </button>
        </div>
      ) : (
        /* VISTA DE CANCHA 2D LUEGO DEL SORTEO */
        <div className="bg-[#0E1422] border border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#00E676]">
                Formación en Cancha 2D
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Distribución de Equipos e Intercambio Táctil
              </h2>
            </div>
          </div>

          {/* Barra de Balance OVR */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
              <span className="text-[#00E676]">
                EQUIPO A • Media:{" "}
                <span className="font-sport text-base">{avgA.toFixed(1)}</span>{" "}
                OVR
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {diff <= 3
                  ? `🔥 ${parity}% Parejo en Cancha`
                  : `⚖️ Diferencia de ${diff.toFixed(1)} pts OVR`}
              </span>
              <span className="text-cyan-400">
                EQUIPO B • Media:{" "}
                <span className="font-sport text-base">{avgB.toFixed(1)}</span>{" "}
                OVR
              </span>
            </div>
            <div className="h-3 rounded-full bg-slate-800 overflow-hidden flex">
              <div
                className="bg-gradient-to-r from-emerald-500 to-[#00E676] transition-all duration-300"
                style={{
                  width: `${
                    avgA + avgB > 0 ? (avgA / (avgA + avgB)) * 100 : 50
                  }%`,
                }}
              ></div>
              <div
                className="bg-gradient-to-l from-cyan-500 to-sky-400 transition-all duration-300"
                style={{
                  width: `${
                    avgA + avgB > 0 ? (avgB / (avgA + avgB)) * 100 : 50
                  }%`,
                }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              {seleccionSwap
                ? `👉 Seleccionaste a ${seleccionSwap.nombre}. Ahora tocá a un jugador del otro equipo para intercambiarlos.`
                : "💡 Tocá cualquier jugador del Equipo A y otro del Equipo B para intercambiarlos de lado en la cancha."}
            </p>
          </div>

          <form action={guardarSorteo} className="space-y-6">
            <input
              type="hidden"
              name="equipoA"
              value={JSON.stringify(equipos.equipoA.map((j) => j.nombre))}
            />
            <input
              type="hidden"
              name="equipoB"
              value={JSON.stringify(equipos.equipoB.map((j) => j.nombre))}
            />

            {/* Cancha 2D (Lado A y Lado B) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lado Equipo A */}
              <div className="pitch-pattern rounded-2xl border-2 border-emerald-500/30 p-5 relative min-h-[320px] flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                  <span className="font-sport font-bold text-sm tracking-wider text-[#00E676]">
                    ⚽ EQUIPO A (VERDE)
                  </span>
                  <span className="text-xs text-emerald-200/80">
                    {equipos.equipoA.length} Jugadores
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-auto py-4">
                  {equipos.equipoA.map((j) => {
                    const info = getPlayerStatsAndTier(j as JugadorStatsDB);
                    const isSelected = seleccionSwap?.nombre === j.nombre;
                    const canReceive =
                      seleccionSwap && seleccionSwap.equipo !== "equipoA";

                    return (
                      <button
                        type="button"
                        key={j.nombre}
                        onClick={() => handleJugadorClick(j.nombre, "equipoA")}
                        className={`p-3 rounded-xl border transition flex flex-col items-center text-center group cursor-pointer ${
                          isSelected
                            ? "ring-2 ring-[#00E676] bg-emerald-950/95 border-[#00E676] scale-105"
                            : canReceive
                              ? "bg-slate-900/90 border-yellow-400/50 hover:border-yellow-300"
                              : "bg-slate-900/90 border-white/15 hover:bg-slate-800/90"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-sport text-lg font-black text-[#00E676]">
                            {info.ovr}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white">
                            {info.posLabel}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-white mt-1 group-hover:text-[#00E676] truncate max-w-full">
                          {j.nombre}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Prom. {info.avg10.toFixed(1)} • {info.winrate}% WR
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lado Equipo B */}
              <div className="pitch-pattern rounded-2xl border-2 border-cyan-500/30 p-5 relative min-h-[320px] flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                  <span className="font-sport font-bold text-sm tracking-wider text-cyan-300">
                    ⚽ EQUIPO B (AZUL)
                  </span>
                  <span className="text-xs text-cyan-200/80">
                    {equipos.equipoB.length} Jugadores
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-auto py-4">
                  {equipos.equipoB.map((j) => {
                    const info = getPlayerStatsAndTier(j as JugadorStatsDB);
                    const isSelected = seleccionSwap?.nombre === j.nombre;
                    const canReceive =
                      seleccionSwap && seleccionSwap.equipo !== "equipoB";

                    return (
                      <button
                        type="button"
                        key={j.nombre}
                        onClick={() => handleJugadorClick(j.nombre, "equipoB")}
                        className={`p-3 rounded-xl border transition flex flex-col items-center text-center group cursor-pointer ${
                          isSelected
                            ? "ring-2 ring-cyan-400 bg-cyan-950/95 border-cyan-400 scale-105"
                            : canReceive
                              ? "bg-slate-900/90 border-yellow-400/50 hover:border-yellow-300"
                              : "bg-slate-900/90 border-white/15 hover:bg-slate-800/90"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-sport text-lg font-black text-cyan-300">
                            {info.ovr}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white">
                            {info.posLabel}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-white mt-1 group-hover:text-cyan-300 truncate max-w-full">
                          {j.nombre}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Prom. {info.avg10.toFixed(1)} • {info.winrate}% WR
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#00E676] hover:brightness-110 text-slate-950 text-lg font-black rounded-2xl p-4 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,230,118,0.3)]"
            >
              Confirmar Equipos y Jugar ⚽
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setEquipos(null);
              setSeleccionSwap(null);
            }}
            className="w-full text-slate-400 hover:text-white text-sm font-medium p-2 cursor-pointer"
          >
            &larr; Modificar lista de convocados
          </button>
        </div>
      )}
    </main>
  );
}

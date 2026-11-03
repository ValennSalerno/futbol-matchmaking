"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useCallback, useEffect, useState } from "react";
import {
  getPlayerStatsAndTier,
  JugadorStatsDB,
  StatItem,
  TierTheme,
} from "@/lib/playerStats";

export function PlayerAvatarSvg({
  nombre,
  rank,
  isGK,
  isWeddingTOTY,
  theme,
  uidSuffix = "modal",
}: {
  nombre: string;
  rank: number;
  isGK: boolean;
  isWeddingTOTY: boolean;
  theme: TierTheme;
  uidSuffix?: string;
}) {
  const initials = nombre
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (isWeddingTOTY) {
    return (
      <svg
        viewBox="0 0 120 120"
        className="w-32 h-32 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
      >
        <defs>
          <linearGradient
            id={`tuxGrad_${uidSuffix}`}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0%" stopColor="#1E1B4B" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
        </defs>
        <path
          d="M36 22 L49 17 L60 26 L71 17 L84 22 L102 42 L90 54 L80 44 L80 100 L40 100 L40 44 L30 54 L18 42 Z"
          fill={`url(#tuxGrad_${uidSuffix})`}
          stroke="#FACC15"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <polygon points="60,26 48,52 72,52" fill="#FFFFFF" />
        <polygon points="52,34 68,42 68,34 52,42" fill="#FACC15" />
        <circle cx="60" cy="38" r="2.5" fill="#CA8A04" />
        <text x="60" y="70" textAnchor="middle" fontSize="20">
          💍
        </text>
        <text
          x="60"
          y="89"
          textAnchor="middle"
          fill="#FACC15"
          fontFamily="Chakra Petch, sans-serif"
          fontWeight="700"
          fontSize="11"
        >
          ¡SE CASA!
        </text>
      </svg>
    );
  }

  if (isGK) {
    return (
      <svg
        viewBox="0 0 120 120"
        className="w-32 h-32 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
      >
        <defs>
          <linearGradient
            id={`gkGrad_${uidSuffix}`}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0%" stopColor={theme.kitPrimary} />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>
        </defs>
        <path
          d="M35 24 L48 18 L60 25 L72 18 L85 24 L106 46 L95 58 L82 46 L82 100 L38 100 L38 46 L25 58 L14 46 Z"
          fill={`url(#gkGrad_${uidSuffix})`}
          stroke={theme.kitSecondary}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle
          cx="60"
          cy="56"
          r="18"
          fill="rgba(0,0,0,0.35)"
          stroke={theme.kitSecondary}
          strokeWidth="1.5"
        />
        <text
          x="60"
          y="62"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="Chakra Petch, sans-serif"
          fontWeight="700"
          fontSize="16"
        >
          🧤
        </text>
        <text
          x="60"
          y="92"
          textAnchor="middle"
          fill={theme.kitSecondary}
          fontFamily="Chakra Petch, sans-serif"
          fontWeight="700"
          fontSize="11"
        >
          GK • {initials}
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 120 120"
      className="w-32 h-32 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
    >
      <defs>
        <linearGradient id={`kitGrad_${uidSuffix}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={theme.kitPrimary} />
          <stop offset="100%" stopColor="#090D16" />
        </linearGradient>
      </defs>
      <path
        d="M36 22 L49 17 L60 26 L71 17 L84 22 L102 42 L90 54 L80 44 L80 100 L40 100 L40 44 L30 54 L18 42 Z"
        fill={`url(#kitGrad_${uidSuffix})`}
        stroke={theme.kitSecondary}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect
        x="56"
        y="26"
        width="8"
        height="74"
        fill={theme.kitSecondary}
        fillOpacity="0.22"
      />
      <text
        x="60"
        y="64"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="Chakra Petch, sans-serif"
        fontWeight="700"
        fontSize="24"
      >
        {initials}
      </text>
      <text
        x="60"
        y="86"
        textAnchor="middle"
        fill={theme.kitSecondary}
        fontFamily="Chakra Petch, sans-serif"
        fontWeight="700"
        fontSize="11"
      >
        #{rank} TAQUITO
      </text>
    </svg>
  );
}

function PlayerRadarSvg({
  statsMain,
  statsCompare,
  mainColor,
}: {
  statsMain: StatItem[];
  statsCompare: StatItem[] | null;
  mainColor: string;
}) {
  const cx = 120;
  const cy = 120;
  const maxR = 82;
  const levels = [0.25, 0.5, 0.75, 1.0];

  const polarToXY = (index: number, ratio: number) => {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * maxR * ratio,
      y: cy + Math.sin(angle) * maxR * ratio,
    };
  };

  const mainPoints = statsMain
    .map((s, i) => {
      const p = polarToXY(i, Math.max(0.15, Math.min(1, s.val / 100)));
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");

  const compPoints = statsCompare
    ? statsCompare
        .map((s, i) => {
          const p = polarToXY(i, Math.max(0.15, Math.min(1, s.val / 100)));
          return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        })
        .join(" ")
    : null;

  return (
    <svg viewBox="0 0 240 240" className="w-52 h-52 overflow-visible">
      {levels.map((lvl) => {
        const pts = [0, 1, 2, 3, 4]
          .map((i) => {
            const p = polarToXY(i, lvl);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          })
          .join(" ");
        return (
          <polygon
            key={lvl}
            points={pts}
            fill="none"
            stroke="rgba(148,163,184,0.22)"
            strokeWidth="1"
          />
        );
      })}

      {statsMain.map((s, i) => {
        const outer = polarToXY(i, 1.0);
        const labelPos = polarToXY(i, 1.25);
        return (
          <g key={s.code}>
            <line
              x1={cx}
              y1={cy}
              x2={outer.x.toFixed(1)}
              y2={outer.y.toFixed(1)}
              stroke="rgba(148,163,184,0.22)"
              strokeWidth="1"
            />
            <text
              x={labelPos.x.toFixed(1)}
              y={(labelPos.y - 4).toFixed(1)}
              textAnchor="middle"
              fill="#E2E8F0"
              fontSize="10"
              fontWeight="700"
            >
              {s.code}
            </text>
            <text
              x={labelPos.x.toFixed(1)}
              y={(labelPos.y + 9).toFixed(1)}
              textAnchor="middle"
              fill={mainColor}
              fontSize="11"
              fontWeight="800"
              fontFamily="Chakra Petch, sans-serif"
            >
              {s.score10} ({s.val})
            </text>
          </g>
        );
      })}

      {compPoints && (
        <polygon
          points={compPoints}
          fill="rgba(56,189,248,0.20)"
          stroke="#38BDF8"
          strokeWidth="2"
          strokeDasharray="4 2"
        />
      )}

      <polygon
        points={mainPoints}
        fill={mainColor}
        fillOpacity="0.28"
        stroke={mainColor}
        strokeWidth="2.5"
      />

      {statsMain.map((s, i) => {
        const pt = polarToXY(i, Math.max(0.15, Math.min(1, s.val / 100)));
        return (
          <circle
            key={s.code}
            cx={pt.x.toFixed(1)}
            cy={pt.y.toFixed(1)}
            r="3.5"
            fill={mainColor}
            stroke="#080C14"
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
  );
}

function PlayerCardModalContent({
  jugadoresDb,
  totalPartidos,
}: {
  jugadoresDb: JugadorStatsDB[];
  totalPartidos?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nombreJugador = searchParams.get("jugador");
  const [compareName, setCompareName] = useState<string>("");

  const closeModal = useCallback(() => {
    setCompareName("");
    router.push("/", { scroll: false });
  }, [router]);

  const selectPlayer = useCallback(
    (nombre: string) => {
      router.push(`/?jugador=${encodeURIComponent(nombre)}`, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeModal]);

  if (!nombreJugador) return null;

  const playerIndex = jugadoresDb.findIndex((j) => j.nombre === nombreJugador);
  if (playerIndex === -1) return null;

  const jugador = jugadoresDb[playerIndex];
  const rank = playerIndex + 1;

  const maxPartidos =
    totalPartidos ||
    Math.max(55, ...jugadoresDb.map((j) => j.partidos_totales || 0));

  const asistencia = Math.round(
    ((jugador.partidos_totales || 0) / maxPartidos) * 100,
  );

  const info = getPlayerStatsAndTier(jugador);

  const comparePlayer = compareName
    ? jugadoresDb.find((j) => j.nombre === compareName) || null
    : null;
  const compareInfo = comparePlayer
    ? getPlayerStatsAndTier(comparePlayer)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
      onClick={closeModal}
    >
      <div
        className="relative w-full max-w-4xl rounded-3xl bg-[#0B101C] border border-slate-700/80 shadow-2xl overflow-hidden my-8 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${info.theme.pillClass}`}
            >
              {info.theme.tierLabel}
            </span>
            <span className="text-xs font-semibold text-slate-300 bg-slate-800/90 px-3 py-1 rounded-full border border-slate-700">
              {info.specialty}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Comparador 1v1 */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1">
              <span className="text-[11px] text-slate-400">
                ⚔️ Comparar con:
              </span>
              <select
                value={compareName}
                onChange={(e) => setCompareName(e.target.value)}
                aria-label="Comparar con otro jugador"
                className="bg-slate-900 text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer"
              >
                <option value="">Ninguno</option>
                {jugadoresDb
                  .filter((p) => p.nombre !== jugador.nombre)
                  .map((p) => {
                    const pInfo = getPlayerStatsAndTier(p);
                    return (
                      <option key={p.nombre} value={p.nombre}>
                        {p.nombre} ({pInfo.ovr} OVR)
                      </option>
                    );
                  })}
              </select>
            </div>

            <button
              onClick={closeModal}
              aria-label="Cerrar modal"
              className="h-8 w-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 items-center">
          {/* Izquierda: Carta FUT Personalizada */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div
              className={`relative w-64 rounded-[28px] p-5 border-2 bg-gradient-to-b overflow-hidden transition-all duration-300 select-none ${info.theme.cardGradient}`}
            >
              {/* Fila Superior */}
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex flex-col items-center leading-none">
                  <span className="font-sport text-5xl font-black tracking-tight text-white drop-shadow">
                    {info.ovr}
                  </span>
                  <span
                    className={`font-sport text-lg font-bold tracking-widest uppercase mt-0.5 ${info.theme.posColor}`}
                  >
                    {info.posLabel}
                  </span>
                  <div className="h-0.5 w-8 bg-white/30 my-1.5"></div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-black/40 text-white/90 border border-white/15">
                    #{rank} Asist.
                  </span>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <div className="px-2.5 py-1 rounded-xl bg-black/45 border border-white/15 text-right">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-300">
                      Media (1-10)
                    </span>
                    <span className="font-sport text-sm font-bold text-[#00E676]">
                      {info.avg10.toFixed(1)}
                    </span>
                  </div>
                  <div className="px-2.5 py-1 rounded-xl bg-black/45 border border-white/15 text-right">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-300">
                      Winrate
                    </span>
                    <span className="font-sport text-sm font-bold text-white">
                      {info.winrate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Avatar SVG (Sin Foto) */}
              <div className="relative z-10 my-3 h-40 rounded-2xl bg-black/30 border border-white/15 flex items-center justify-center overflow-hidden">
                <span className="font-sport text-8xl font-black text-white/10 absolute -bottom-3 -right-2 tracking-tighter select-none">
                  {jugador.nombre.slice(0, 3).toUpperCase()}
                </span>
                <div className="relative z-10 flex flex-col items-center">
                  <PlayerAvatarSvg
                    nombre={jugador.nombre}
                    rank={rank}
                    isGK={info.isGK}
                    isWeddingTOTY={info.isWeddingTOTY}
                    theme={info.theme}
                    uidSuffix="modal"
                  />
                </div>
              </div>

              {/* Nombre y Mini-Stats */}
              <div className="relative z-10 space-y-2.5">
                <div className="bg-black/65 border border-white/20 rounded-xl py-2 px-3 text-center">
                  <h3 className="font-sport text-xl font-black tracking-wider uppercase text-white truncate">
                    {jugador.nombre}
                  </h3>
                </div>

                <div className="grid grid-cols-5 gap-1 bg-black/45 rounded-xl p-2 border border-white/10 text-center">
                  {info.stats.map((s) => (
                    <div key={s.code}>
                      <span className="block text-[9px] font-bold text-slate-300">
                        {s.code}
                      </span>
                      <span className="font-sport text-sm font-bold text-white">
                        {s.score10}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-3 max-w-xs">
              {info.isWeddingTOTY
                ? "💍 ¡Edición Especial Casamiento! Carta TOTY 99 con smoking, moño dorado y todas las stats al máximo."
                : info.isGK
                  ? `🧤 Arquero (${jugador.nombre}): Media ${info.avg10.toFixed(1)} (${info.ovr} OVR) con atributos específicos de arco.`
                  : `✅ Promedio ${info.avg10.toFixed(1)} (${info.ovr} OVR) calculado en vivo.`}
            </p>
          </div>

          {/* Derecha: KPIs, Radar SVG y Barras */}
          <div className="md:col-span-7 space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Partidos Totales
                </span>
                <div className="font-sport text-2xl font-bold text-white mt-0.5">
                  {jugador.partidos_totales} PJ
                </div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  % Asistencia
                </span>
                <div className="font-sport text-2xl font-bold text-[#00E676] mt-0.5">
                  {asistencia}%
                </div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Winrate Oficial
                </span>
                <div className="font-sport text-2xl font-bold text-cyan-300 mt-0.5">
                  {info.winrate}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4">
              <div className="flex flex-col items-center">
                <PlayerRadarSvg
                  statsMain={info.stats}
                  statsCompare={compareInfo ? compareInfo.stats : null}
                  mainColor={info.theme.radarColor}
                />
                <div className="flex items-center gap-4 text-[11px] font-semibold mt-1">
                  <span className="flex items-center gap-1.5 text-[#00E676]">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: info.theme.radarColor }}
                    ></span>
                    <span>
                      {jugador.nombre} ({info.ovr})
                    </span>
                  </span>
                  {comparePlayer && compareInfo && (
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-400"></span>
                      <span>
                        {comparePlayer.nombre} ({compareInfo.ovr})
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                {info.stats.map((s, idx) => {
                  const compVal = compareInfo
                    ? (compareInfo.stats[idx]?.score10 ?? null)
                    : null;
                  const diff =
                    compVal !== null
                      ? Number((s.score10 - compVal).toFixed(1))
                      : null;

                  return (
                    <div key={s.code}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-200">
                          {s.label}
                        </span>
                        <div className="flex items-center gap-2">
                          {diff !== null && comparePlayer && (
                            <span
                              className={`text-[10px] font-bold ${
                                diff >= 0 ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {diff >= 0 ? `+${diff}` : diff} vs{" "}
                              {comparePlayer.nombre}
                            </span>
                          )}
                          <span className="font-sport font-bold text-sm text-white">
                            {s.score10}{" "}
                            <span className="text-xs text-slate-400">
                              ({s.val})
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${info.theme.barClass}`}
                          style={{ width: `${s.val}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selector rápido de jugadores */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-xs text-slate-400">Ver otro jugador:</span>
              <div className="flex flex-wrap gap-1.5">
                {jugadoresDb.slice(0, 6).map((p) => {
                  const pInfo = getPlayerStatsAndTier(p);
                  return (
                    <button
                      key={p.nombre}
                      onClick={() => selectPlayer(p.nombre)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        p.nombre === jugador.nombre
                          ? "bg-[#00E676] text-slate-950 font-bold"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                      }`}
                    >
                      {p.nombre} ({pInfo.ovr})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlayerCardModal(props: {
  jugadoresDb: JugadorStatsDB[];
  totalPartidos?: number;
}) {
  return (
    <Suspense fallback={null}>
      <PlayerCardModalContent {...props} />
    </Suspense>
  );
}

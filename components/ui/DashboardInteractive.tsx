"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlayerStatsAndTier, JugadorStatsDB } from "@/lib/playerStats";
import { PlayerAvatarSvg } from "@/components/ui/PlayerCardModal";

interface DashboardInteractiveProps {
  jugadores: JugadorStatsDB[];
  totalPartidos: number;
  childrenSidebar: React.ReactNode;
}

type ColumnId = "pos" | "jugador" | "ovr" | "pj" | "asistencia" | "winrate";

const DEFAULT_COLUMNS: ColumnId[] = [
  "pos",
  "jugador",
  "ovr",
  "pj",
  "asistencia",
  "winrate",
];

const COLUMN_LABELS: Record<ColumnId, string> = {
  pos: "Pos",
  jugador: "Jugador",
  ovr: "Carta / OVR",
  pj: "PJ",
  asistencia: "% Asistencia",
  winrate: "Winrate",
};

export default function DashboardInteractive({
  jugadores,
  totalPartidos,
  childrenSidebar,
}: DashboardInteractiveProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "cards">(
    "dashboard",
  );
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"pj" | "ovr" | "winrate">("pj");

  // Estados para orden de columnas (Drag & Drop + Popover) y visibilidad en Mobile
  const [columns, setColumns] = useState<ColumnId[]>(() => {
    if (typeof window === "undefined") return DEFAULT_COLUMNS;
    try {
      const savedCols = localStorage.getItem("taquito_table_columns");
      if (savedCols) {
        const parsed = JSON.parse(savedCols) as ColumnId[];
        if (
          Array.isArray(parsed) &&
          parsed.length === DEFAULT_COLUMNS.length &&
          DEFAULT_COLUMNS.every((c) => parsed.includes(c))
        ) {
          return parsed;
        }
      }
    } catch {
      // Fallback silencioso
    }
    return DEFAULT_COLUMNS;
  });

  const [mobileHiddenCols, setMobileHiddenCols] = useState<ColumnId[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const savedHidden = localStorage.getItem("taquito_mobile_hidden_cols");
      if (savedHidden) {
        const parsedHidden = JSON.parse(savedHidden) as ColumnId[];
        if (Array.isArray(parsedHidden)) {
          return parsedHidden;
        }
      }
    } catch {
      // Fallback silencioso
    }
    return [];
  });

  const [draggedCol, setDraggedCol] = useState<ColumnId | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null);
  const [showColMenu, setShowColMenu] = useState(false);

  const updateColumns = (newCols: ColumnId[]) => {
    setColumns(newCols);
    try {
      localStorage.setItem("taquito_table_columns", JSON.stringify(newCols));
    } catch {
      // Ignorar errores de storage
    }
  };

  const toggleMobileColumn = (colId: ColumnId) => {
    // Evitamos que oculten al Jugador para que la fila siempre tenga sentido
    if (colId === "jugador") return;

    const next = mobileHiddenCols.includes(colId)
      ? mobileHiddenCols.filter((c) => c !== colId)
      : [...mobileHiddenCols, colId];

    setMobileHiddenCols(next);
    try {
      localStorage.setItem("taquito_mobile_hidden_cols", JSON.stringify(next));
    } catch {
      // Ignorar errores de storage
    }
  };

  const handleDragStart = (col: ColumnId) => setDraggedCol(col);

  const handleDragOver = (e: React.DragEvent, col: ColumnId) => {
    e.preventDefault();
    if (draggedCol && draggedCol !== col) {
      setDragOverCol(col);
    }
  };

  const handleDrop = (targetCol: ColumnId) => {
    if (!draggedCol || draggedCol === targetCol) {
      setDraggedCol(null);
      setDragOverCol(null);
      return;
    }
    const next = [...columns];
    const fromIdx = next.indexOf(draggedCol);
    const toIdx = next.indexOf(targetCol);
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, draggedCol);
    updateColumns(next);
    setDraggedCol(null);
    setDragOverCol(null);
  };

  const moveColumn = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= columns.length) return;
    const next = [...columns];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    updateColumns(next);
  };

  const resetColumns = () => {
    updateColumns(DEFAULT_COLUMNS);
    setMobileHiddenCols([]);
    try {
      localStorage.removeItem("taquito_mobile_hidden_cols");
    } catch {
      // Ignorar
    }
  };

  const openModal = (nombre: string) => {
    router.push(`/?jugador=${encodeURIComponent(nombre)}`, { scroll: false });
  };

  // Calculamos las estadísticas enriquecidas y el ranking original por asistencia
  const enrichedPlayers = useMemo(() => {
    return jugadores.map((j, idx) => {
      const info = getPlayerStatsAndTier(j);
      const asistencia =
        totalPartidos > 0
          ? Math.round((j.partidos_totales / totalPartidos) * 100)
          : 0;
      return {
        ...j,
        rank: idx + 1,
        asistencia,
        info,
      };
    });
  }, [jugadores, totalPartidos]);

  // Destacados dinámicos calculados a partir de Supabase
  const topAsistencia = enrichedPlayers[0] || null;

  const topWinrate = useMemo(() => {
    const candidatos = enrichedPlayers.filter((p) => p.partidos_jugados >= 15);
    const pool = candidatos.length > 0 ? candidatos : enrichedPlayers;
    return [...pool].sort((a, b) => b.info.winrate - a.info.winrate)[0] || null;
  }, [enrichedPlayers]);

  const topOvr = useMemo(() => {
    const regulares = enrichedPlayers.filter((p) => !p.info.isWeddingTOTY);
    const pool = regulares.length > 0 ? regulares : enrichedPlayers;
    return [...pool].sort((a, b) => b.info.ovr - a.info.ovr)[0] || null;
  }, [enrichedPlayers]);

  // Filtrado y ordenamiento de la tabla
  const filteredPlayers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return enrichedPlayers
      .filter((p) => p.nombre.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortBy === "ovr") return b.info.ovr - a.info.ovr;
        if (sortBy === "winrate") return b.info.winrate - a.info.winrate;
        return a.rank - b.rank;
      });
  }, [enrichedPlayers, search, sortBy]);

  // Jugadores representativos para accesos rápidos al Wizard
  const galleryShowcase = useMemo(() => {
    const names = ["Negro", "Leo", "Junco", "Chino", "Kevin", "Nahue"];
    const found = names
      .map((n) =>
        enrichedPlayers.find(
          (p) => p.nombre.toLowerCase().trim() === n.toLowerCase(),
        ),
      )
      .filter(Boolean) as typeof enrichedPlayers;
    return found.length >= 4 ? found.slice(0, 5) : enrichedPlayers.slice(0, 5);
  }, [enrichedPlayers]);

  return (
    <div className="space-y-6">
      {/* Barra de pestañas interactivas + Accesos rápidos al Wizard */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-emerald-950/30 border border-slate-800/90 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-[#00E676] text-slate-950 shadow-sm"
                : "text-slate-300 hover:text-white"
            }`}
          >
            📊 Tabla y Estadísticas
          </button>
          <button
            onClick={() => setActiveTab("cards")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "cards"
                ? "bg-[#00E676] text-slate-950 shadow-sm"
                : "text-slate-300 hover:text-white"
            }`}
          >
            🃏 Galería de Cartas (Tiers)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-1 hidden sm:inline">
            ✨ Abrir Carta:
          </span>
          {galleryShowcase.map((p) => (
            <button
              key={p.nombre}
              onClick={() => openModal(p.nombre)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${p.info.theme.pillClass}`}
            >
              <span>
                {p.info.isWeddingTOTY
                  ? "💍"
                  : p.info.isGK
                    ? "🧤"
                    : p.info.ovr >= 85
                      ? "💎"
                      : p.info.ovr >= 75
                        ? "🥇"
                        : "🥈"}
              </span>
              <span>
                {p.nombre} ({p.info.ovr})
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === "cards" ? (
        /* VISTA GALERÍA DE TIERS */
        <div className="bg-[#0E1422] border border-slate-800 rounded-2xl p-5 space-y-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#00E676]">
              Diseño Personalizado por OVR
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Estilos de Carta FUT según el puntaje de cada jugador
            </h2>
            <p className="text-xs text-slate-400">
              Tocá cualquiera de las cartas para abrir el Wizard con el radar
              pentágono y el comparador 1v1.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 pt-2">
            {enrichedPlayers.map((p, idx) => (
              <div
                key={p.nombre}
                onClick={() => openModal(p.nombre)}
                className="cursor-pointer flex flex-col items-center group"
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest mb-2 px-2.5 py-0.5 rounded-full border ${p.info.theme.pillClass}`}
                >
                  {p.info.theme.tierLabel}
                </span>
                <div
                  className={`relative w-full max-w-[230px] rounded-[26px] p-4 border-2 bg-gradient-to-b overflow-hidden transition-transform duration-300 group-hover:-translate-y-1.5 select-none ${p.info.theme.cardGradient}`}
                >
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="flex flex-col items-center leading-none">
                      <span className="font-sport text-4xl font-black text-white">
                        {p.info.ovr}
                      </span>
                      <span
                        className={`font-sport text-sm font-bold uppercase mt-0.5 ${p.info.theme.posColor}`}
                      >
                        {p.info.posLabel}
                      </span>
                    </div>
                    <div className="px-2 py-0.5 rounded-lg bg-black/45 border border-white/15 text-right">
                      <span className="block text-[8px] uppercase text-slate-300">
                        Prom.
                      </span>
                      <span className="font-sport text-xs font-bold text-[#00E676]">
                        {p.info.avg10.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 my-2.5 h-32 rounded-xl bg-black/30 border border-white/15 flex items-center justify-center overflow-hidden">
                    <span className="font-sport text-6xl font-black text-white/10 absolute -bottom-2 -right-1 select-none">
                      {p.nombre.slice(0, 3).toUpperCase()}
                    </span>
                    <div className="relative z-10 scale-90">
                      <PlayerAvatarSvg
                        nombre={p.nombre}
                        rank={p.rank}
                        isGK={p.info.isGK}
                        isWeddingTOTY={p.info.isWeddingTOTY}
                        theme={p.info.theme}
                        uidSuffix={`gal_${idx}`}
                      />
                    </div>
                  </div>

                  <div className="relative z-10 space-y-2">
                    <div className="bg-black/65 border border-white/20 rounded-lg py-1.5 px-2 text-center">
                      <h4 className="font-sport text-base font-black tracking-wider uppercase text-white truncate">
                        {p.nombre}
                      </h4>
                    </div>
                    <div className="grid grid-cols-5 gap-1 bg-black/45 rounded-lg p-1.5 border border-white/10 text-center">
                      {p.info.stats.map((s) => (
                        <div key={s.code}>
                          <span className="block text-[8px] font-bold text-slate-300">
                            {s.code}
                          </span>
                          <span className="font-sport text-xs font-bold text-white">
                            {s.score10}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* VISTA PRINCIPAL: HIGHLIGHTS + TABLA + SIDEBAR */
        <>
          {/* 3 Tarjetas de Destacados */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topAsistencia && (
              <div
                onClick={() => openModal(topAsistencia.nombre)}
                className="cursor-pointer group bg-gradient-to-br from-[#0E1422] to-emerald-950/30 border border-emerald-500/30 hover:border-[#00E676] rounded-2xl p-4 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/15 text-[#00E676]">
                    🛡️ El Siempre Está (#1 Asistencia)
                  </span>
                  <h3 className="font-sport text-xl font-bold text-white mt-1.5 group-hover:text-[#00E676] transition uppercase">
                    {topAsistencia.nombre}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {topAsistencia.partidos_totales} PJ (
                    {topAsistencia.asistencia}% Asist.) •{" "}
                    {topAsistencia.info.ovr} OVR
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-sport text-xl font-bold text-[#00E676]">
                  {topAsistencia.asistencia}%
                </div>
              </div>
            )}

            {topWinrate && (
              <div
                onClick={() => openModal(topWinrate.nombre)}
                className="cursor-pointer group bg-gradient-to-br from-[#0E1422] to-amber-950/30 border border-amber-500/30 hover:border-amber-400 rounded-2xl p-4 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/15 text-amber-300">
                    🔥 Winrate mas alto (+5 PJ)
                  </span>
                  <h3 className="font-sport text-xl font-bold text-white mt-1.5 group-hover:text-amber-300 transition uppercase">
                    {topWinrate.nombre}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {topWinrate.partidos_totales} PJ ({topWinrate.asistencia}%
                    Asist.) • {topWinrate.info.ovr} OVR
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-sport text-xl font-bold text-amber-300">
                  {topWinrate.info.winrate}%
                </div>
              </div>
            )}

            {topOvr && (
              <div
                onClick={() => openModal(topOvr.nombre)}
                className="cursor-pointer group bg-gradient-to-br from-[#0E1422] to-cyan-950/30 border border-cyan-500/30 hover:border-cyan-400 rounded-2xl p-4 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300">
                    💎 Mejor OVR
                  </span>
                  <h3 className="font-sport text-xl font-bold text-white mt-1.5 group-hover:text-cyan-300 transition uppercase">
                    {topOvr.nombre}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {topOvr.partidos_totales} PJ ({topOvr.info.winrate}%
                    Winrate) • {topOvr.info.ovr} OVR
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-sport text-xl font-bold text-cyan-300">
                  {topOvr.info.ovr}
                </div>
              </div>
            )}
          </div>

          {/* Grilla Principal: Tabla (2 cols) + Sidebar (1 col) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quitamos overflow-hidden de acá para que el menú de Columnas nunca se corte */}
            <div className="lg:col-span-2 bg-[#0E1422] border border-slate-800/90 rounded-2xl h-fit">
              <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Rendimiento y Asistencia</span>
                    <span className="text-xs font-normal text-slate-400">
                      ({jugadores.length} jugadores • Click para ver carta)
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Estadísticas sincronizadas • Arrastrá las columnas o usá el
                    botón Columnas
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar jugador..."
                    className="bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00E676]"
                  />
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "pj" | "ovr" | "winrate")
                    }
                    aria-label="Ordenar jugadores"
                    className="bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#00E676]"
                  >
                    <option value="pj">Ordenar: Asistencia (PJ)</option>
                    <option value="ovr">Ordenar: Puntaje OVR</option>
                    <option value="winrate">Ordenar: Winrate %</option>
                  </select>

                  {/* Botón y Menú Popover de Columnas */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowColMenu((prev) => !prev)}
                      className={`border rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                        showColMenu
                          ? "bg-[#00E676] text-slate-950 border-[#00E676]"
                          : "bg-slate-900/90 border-slate-700/80 hover:border-[#00E676] text-slate-200"
                      }`}
                    >
                      <span>⇄</span>
                      <span>Columnas</span>
                    </button>

                    {showColMenu && (
                      <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#0B101C] border border-slate-700 shadow-2xl p-3 z-50 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                            Orden y Visibilidad
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={resetColumns}
                              className="text-[11px] text-[#00E676] hover:underline font-semibold cursor-pointer"
                            >
                              Resetear
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowColMenu(false)}
                              className="text-xs text-slate-400 hover:text-white px-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          {columns.map((colId, idx) => {
                            const isVisibleMobile =
                              !mobileHiddenCols.includes(colId);
                            const isLocked = colId === "jugador";

                            return (
                              <div
                                key={colId}
                                className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs"
                              >
                                <span className="font-medium text-slate-200 truncate pr-2">
                                  {idx + 1}. {COLUMN_LABELS[colId]}
                                </span>

                                <div className="flex items-center gap-2">
                                  {/* Switch visible en PC y Mobile para poder probarlo en localhost */}
                                  <button
                                    type="button"
                                    disabled={isLocked}
                                    onClick={() => toggleMobileColumn(colId)}
                                    title={
                                      isLocked
                                        ? "Jugador siempre visible"
                                        : "Mostrar/ocultar en celular"
                                    }
                                    className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${
                                      isVisibleMobile
                                        ? "bg-[#00E676]"
                                        : "bg-slate-700"
                                    } ${
                                      isLocked
                                        ? "opacity-40 cursor-not-allowed"
                                        : "cursor-pointer"
                                    }`}
                                  >
                                    <span
                                      className={`inline-block h-3 w-3 transform rounded-full bg-slate-950 transition-transform ${
                                        isVisibleMobile
                                          ? "translate-x-3.5"
                                          : "translate-x-0.5"
                                      }`}
                                    />
                                  </button>

                                  {/* Flechas para cambiar posición */}
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => moveColumn(idx, -1)}
                                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 cursor-pointer"
                                      title="Mover a la izquierda"
                                    >
                                      ◀
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === columns.length - 1}
                                      onClick={() => moveColumn(idx, 1)}
                                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 cursor-pointer"
                                      title="Mover a la derecha"
                                    >
                                      ▶
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <p className="text-[10px] text-slate-400 pt-1 leading-relaxed">
                          <span className="block text-[#00E676] font-medium mb-0.5">
                            📱 El switch verde oculta o muestra la columna en
                            pantallas móviles.
                          </span>
                          💻 En PC también podés arrastrar los encabezados de la
                          tabla directamente.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-b-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900/40 select-none">
                      {columns.map((colId) => {
                        const isDragging = draggedCol === colId;
                        const isOver = dragOverCol === colId;
                        const isHiddenMobile = mobileHiddenCols.includes(colId);
                        const visibilityClass = isHiddenMobile
                          ? "hidden sm:table-cell"
                          : "";
                        const alignClass =
                          colId === "winrate"
                            ? "text-right"
                            : colId === "pj"
                              ? "text-center"
                              : "";

                        return (
                          <th
                            key={colId}
                            draggable
                            onDragStart={() => handleDragStart(colId)}
                            onDragOver={(e) => handleDragOver(e, colId)}
                            onDragLeave={() => setDragOverCol(null)}
                            onDrop={() => handleDrop(colId)}
                            onDragEnd={() => {
                              setDraggedCol(null);
                              setDragOverCol(null);
                            }}
                            title="Arrastrá para cambiar de posición"
                            className={`py-3 px-3 cursor-grab active:cursor-grabbing transition-colors ${visibilityClass} ${alignClass} ${
                              isDragging ? "opacity-40 bg-slate-800/60" : ""
                            } ${
                              isOver
                                ? "border-l-2 border-l-[#00E676] bg-emerald-950/30 text-white"
                                : "hover:text-slate-200"
                            }`}
                          >
                            <span className="inline-flex items-center gap-1">
                              <span className="text-[10px] opacity-40">⠿</span>
                              <span>{COLUMN_LABELS[colId]}</span>
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {filteredPlayers.map((p) => {
                      const pos = p.rank;
                      const isTop3 = pos <= 3;
                      const isSudamericana = pos >= 4 && pos <= 10;
                      const isDescenso = pos >= 21 && pos <= 25;

                      let rowBg = "hover:bg-slate-800/50";
                      if (isTop3 || isSudamericana) {
                        rowBg = "bg-sky-900/15 hover:bg-sky-900/35";
                      } else if (isDescenso) {
                        rowBg = "bg-rose-950/25 hover:bg-rose-900/35";
                      }

                      const winrateClass =
                        p.info.winrate > 50
                          ? "bg-emerald-500/15 text-[#00E676] border-emerald-500/30"
                          : p.info.winrate > 0
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            : "bg-slate-800 text-slate-500 border-slate-700";

                      return (
                        <tr
                          key={p.nombre}
                          onClick={() => openModal(p.nombre)}
                          className={`cursor-pointer transition group ${rowBg}`}
                        >
                          {columns.map((colId) => {
                            const isHiddenMobile =
                              mobileHiddenCols.includes(colId);
                            const visibilityClass = isHiddenMobile
                              ? "hidden sm:table-cell"
                              : "";

                            switch (colId) {
                              case "pos":
                                return (
                                  <td
                                    key="pos"
                                    className={`py-3 px-3 font-sport text-sm ${visibilityClass} ${
                                      isTop3
                                        ? "text-[#00E676] font-bold"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    #{pos}
                                  </td>
                                );
                              case "jugador":
                                return (
                                  <td
                                    key="jugador"
                                    className={`py-3 px-3 ${visibilityClass}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-white group-hover:text-[#00E676] transition">
                                        {p.nombre}
                                      </span>
                                      {p.info.isGK && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                          🧤 GK
                                        </span>
                                      )}
                                      {p.info.isWeddingTOTY && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-400/40">
                                          💍
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                );
                              case "ovr":
                                return (
                                  <td
                                    key="ovr"
                                    className={`py-3 px-3 ${visibilityClass}`}
                                  >
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${p.info.theme.pillClass}`}
                                    >
                                      <span className="font-sport text-sm">
                                        {p.info.ovr}
                                      </span>
                                      <span className="hidden sm:inline text-[10px] opacity-80">
                                        ({p.info.avg10.toFixed(1)} •{" "}
                                        {p.info.posLabel})
                                      </span>
                                    </span>
                                  </td>
                                );
                              case "pj":
                                return (
                                  <td
                                    key="pj"
                                    className={`py-3 px-3 text-center font-semibold text-slate-200 ${visibilityClass}`}
                                  >
                                    {p.partidos_totales}
                                  </td>
                                );
                              case "asistencia":
                                return (
                                  <td
                                    key="asistencia"
                                    className={`py-3 px-3 ${visibilityClass}`}
                                  >
                                    <div className="w-24 sm:w-28">
                                      <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-300 font-medium">
                                          {p.asistencia}%
                                        </span>
                                      </div>
                                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                        <div
                                          className="h-full bg-[#00E676] rounded-full"
                                          style={{ width: `${p.asistencia}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </td>
                                );
                              case "winrate":
                                return (
                                  <td
                                    key="winrate"
                                    className={`py-3 px-3 text-right ${visibilityClass}`}
                                  >
                                    <span
                                      className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${winrateClass}`}
                                    >
                                      {p.info.winrate}%
                                    </span>
                                  </td>
                                );
                            }
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Columna Derecha (Sidebar enviado desde page.tsx) */}
            <div className="space-y-6">{childrenSidebar}</div>
          </div>
        </>
      )}
    </div>
  );
}

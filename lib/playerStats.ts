// Ubicación en tu proyecto: lib/playerStats.ts

export interface JugadorStatsDB {
  nombre: string;
  esArquero?: boolean;
  partidos_totales: number;
  partidos_jugados: number;
  partidos_ganados: number;
  // Columnas de `jugadores_campo`
  tiro_al_arco?: number | null;
  defensa?: number | null;
  velocidad?: number | null;
  fisico?: number | null;
  pase_salida?: number | null;
  ratingFinal?: number;
  // Columnas de `arqueros`
  valoracion_general?: number | null;
  reflejos?: number | null;
  atajada?: number | null;
  posicionamiento?: number | null;
  saque?: number | null;
  mano_a_mano?: number | null;
}

export interface StatItem {
  code: string;
  label: string;
  score10: number;
  val: number; // Escala 1-100
}

export interface TierTheme {
  tierLabel: string;
  pillClass: string;
  cardGradient: string;
  posColor: string;
  kitPrimary: string;
  kitSecondary: string;
  radarColor: string;
  barClass: string;
}

// Cambiar a `false` si en el futuro querés desactivar la carta TOTY 99 de casamiento del Negro
export const ENABLE_WEDDING_TOTY = true;

export function isGoalkeeper(player: JugadorStatsDB): boolean {
  if (typeof player.esArquero === "boolean") return player.esArquero;
  const cleanName = player.nombre.toLowerCase().trim();
  if (cleanName === "junco" || cleanName === "junquito") return true;
  return (
    !("tiro_al_arco" in player) ||
    player.tiro_al_arco === undefined ||
    player.tiro_al_arco === null
  );
}

export function getTierTheme(
  ovr: number,
  isGK: boolean,
  isWeddingTOTY: boolean
): TierTheme {
  if (isWeddingTOTY) {
    return {
      tierLabel: "💍 TOTY • EDICIÓN CASAMIENTO",
      pillClass:
        "bg-yellow-500/20 text-yellow-300 border-yellow-400/60 shadow-[0_0_12px_rgba(250,204,21,0.3)]",
      cardGradient:
        "from-slate-950 via-indigo-950 to-blue-900 border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.5)] holo-glare",
      posColor: "text-yellow-300",
      kitPrimary: "#312E81",
      kitSecondary: "#FACC15",
      radarColor: "#FACC15",
      barClass: "from-yellow-400 via-amber-300 to-yellow-500",
    };
  }
  if (isGK && ovr >= 85) {
    return {
      tierLabel: "🧤 ARQUERO ÉLITE • 8.5 OVR",
      pillClass: "bg-emerald-500/15 text-emerald-300 border-emerald-400/50",
      cardGradient:
        "from-slate-950 via-emerald-950 to-teal-800/85 border-emerald-400 shadow-[0_0_32px_rgba(16,185,129,0.4)] holo-glare",
      posColor: "text-[#00E676]",
      kitPrimary: "#064E3B",
      kitSecondary: "#00E676",
      radarColor: "#00E676",
      barClass: "from-emerald-400 to-[#00E676]",
    };
  }
  if (ovr >= 85) {
    return {
      tierLabel: "💎 TOTY • ÉLITE TAQUITO",
      pillClass: "bg-cyan-500/15 text-cyan-300 border-cyan-400/40",
      cardGradient:
        "from-slate-950 via-blue-950 to-cyan-900/80 border-cyan-400 shadow-[0_0_35px_rgba(34,211,238,0.35)] holo-glare",
      posColor: "text-cyan-300",
      kitPrimary: "#1E3A8A",
      kitSecondary: "#22D3EE",
      radarColor: "#22D3EE",
      barClass: "from-cyan-400 to-blue-500",
    };
  }
  if (ovr >= 75) {
    return {
      tierLabel: "🥇 CARTA ORO ESPECIAL",
      pillClass: "bg-amber-500/15 text-amber-300 border-amber-400/40",
      cardGradient:
        "from-stone-950 via-amber-950 to-yellow-700/70 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.3)] holo-glare",
      posColor: "text-amber-300",
      kitPrimary: "#78350F",
      kitSecondary: "#FBBF24",
      radarColor: "#FBBF24",
      barClass: "from-amber-400 to-yellow-500",
    };
  }
  if (ovr >= 65) {
    return {
      tierLabel: "🥈 CARTA PLATA SÓLIDO",
      pillClass: "bg-slate-500/20 text-slate-200 border-slate-400/40",
      cardGradient:
        "from-slate-950 via-slate-800 to-zinc-700/80 border-slate-300/80 shadow-[0_0_24px_rgba(148,163,184,0.25)]",
      posColor: "text-slate-200",
      kitPrimary: "#334155",
      kitSecondary: "#E2E8F0",
      radarColor: "#00E676",
      barClass: "from-slate-300 to-emerald-400",
    };
  }
  return {
    tierLabel: "🥉 CARTA BRONCE • RÚSTICO",
    pillClass: "bg-orange-500/15 text-orange-300 border-orange-500/40",
    cardGradient:
      "from-stone-950 via-orange-950/90 to-amber-900/70 border-orange-500/80 shadow-[0_0_22px_rgba(249,115,22,0.25)]",
    posColor: "text-orange-300",
    kitPrimary: "#431407",
    kitSecondary: "#FB923C",
    radarColor: "#FB923C",
    barClass: "from-orange-400 to-amber-500",
  };
}

export function getPlayerStatsAndTier(player: JugadorStatsDB) {
  const cleanName = player.nombre.toLowerCase().trim();
  const isWeddingTOTY = ENABLE_WEDDING_TOTY && cleanName === "negro";
  const isGK = isGoalkeeper(player);

  const winrate =
    player.partidos_jugados > 0
      ? Math.round((player.partidos_ganados / player.partidos_jugados) * 100)
      : 0;

  if (isWeddingTOTY) {
    const stats: StatItem[] = [
      { code: "SHT", label: "Tiro al Arco (SHT)", score10: 10, val: 100 },
      { code: "PAS", label: "Pase Salida (PAS)", score10: 10, val: 100 },
      { code: "PHY", label: "Físico (PHY)", score10: 10, val: 100 },
      { code: "DEF", label: "Defensa (DEF)", score10: 10, val: 100 },
      { code: "SPD", label: "Velocidad (SPD)", score10: 10, val: 100 },
    ];
    const theme = getTierTheme(99, false, true);
    return {
      isGK: false,
      isWeddingTOTY: true,
      posLabel: "CM",
      avg10: 9.9,
      ovr: 99,
      winrate,
      stats,
      specialty: "💍 ¡Se Casa el Negro! (TOTY Exclusivo 99)",
      theme,
    };
  }

  if (isGK) {
    const isJunquito = cleanName.includes("junquito");
    const ref = Number(player.reflejos ?? 9);
    const ata = Number(player.atajada ?? (isJunquito ? 8.5 : 9));
    const pos = Number(player.posicionamiento ?? (isJunquito ? 8 : 8.5));
    const saq = Number(player.saque ?? 8);
    const man = Number(player.mano_a_mano ?? (isJunquito ? 9 : 8));

    const avg10 = Number(((ref + ata + pos + saq + man) / 5).toFixed(1));
    const ovr = Math.round(avg10 * 10);

    const stats: StatItem[] = [
      {
        code: "REF",
        label: "Reflejos (REF)",
        score10: ref,
        val: Math.round(ref * 10),
      },
      {
        code: "ATA",
        label: "Atajada / Vuelo (ATA)",
        score10: ata,
        val: Math.round(ata * 10),
      },
      {
        code: "POS",
        label: "Ubicación (POS)",
        score10: pos,
        val: Math.round(pos * 10),
      },
      {
        code: "SAQ",
        label: "Saque / Salida (SAQ)",
        score10: saq,
        val: Math.round(saq * 10),
      },
      {
        code: "MAN",
        label: "Mano a Mano (MAN)",
        score10: man,
        val: Math.round(man * 10),
      },
    ];

    const theme = getTierTheme(ovr, true, false);
    return {
      isGK: true,
      isWeddingTOTY: false,
      posLabel: "GK",
      avg10,
      ovr,
      winrate,
      stats,
      specialty: `🧤 Muralla en el Arco (${avg10.toFixed(1)} OVR)`,
      theme,
    };
  }

  const sht = Number(player.tiro_al_arco ?? 6);
  const pas = Number(player.pase_salida ?? 6);
  const phy = Number(player.fisico ?? 6);
  const def = Number(player.defensa ?? 6);
  const spd = Number(player.velocidad ?? 6);

  const avg10 = Number(((sht + pas + phy + def + spd) / 5).toFixed(1));
  const ovr = Math.round(avg10 * 10);

  const stats: StatItem[] = [
    {
      code: "SHT",
      label: "Tiro al Arco (SHT)",
      score10: sht,
      val: Math.round(sht * 10),
    },
    {
      code: "PAS",
      label: "Pase Salida (PAS)",
      score10: pas,
      val: Math.round(pas * 10),
    },
    {
      code: "PHY",
      label: "Físico (PHY)",
      score10: phy,
      val: Math.round(phy * 10),
    },
    {
      code: "DEF",
      label: "Defensa (DEF)",
      score10: def,
      val: Math.round(def * 10),
    },
    {
      code: "SPD",
      label: "Velocidad (SPD)",
      score10: spd,
      val: Math.round(spd * 10),
    },
  ];

  const sortedStats = [...stats].sort((a, b) => b.val - a.val);
  const topCode = sortedStats[0]?.code || "SHT";
  const specialtyMap: Record<string, string> = {
    SHT: "🎯 Especialista en Tiro al Arco",
    PAS: "⚡ Salida Limpia & Pase",
    PHY: "🚜 Potencia Física",
    DEF: "🛡️ Muralla Defensiva",
    SPD: "💨 Velocidad por la Banda",
  };
  const theme = getTierTheme(ovr, false, false);

  return {
    isGK: false,
    isWeddingTOTY: false,
    posLabel: "CM",
    avg10,
    ovr,
    winrate,
    stats,
    specialty: specialtyMap[topCode] || "⚽ Polifuncional",
    theme,
  };
}
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export interface JugadorVotable {
  nombre: string;
  esArquero: boolean;
}

type FieldStatKey =
  | "tiro_al_arco"
  | "defensa"
  | "velocidad"
  | "fisico"
  | "pase_salida";

type GkStatKey =
  | "reflejos"
  | "atajada"
  | "posicionamiento"
  | "saque"
  | "mano_a_mano";

type StatKey = FieldStatKey | GkStatKey;

interface VotoStatRow {
  id: number;
  user_email: string;
  jugador_nombre: string;
  es_arquero: boolean;
  tiro_al_arco: number | null;
  defensa: number | null;
  velocidad: number | null;
  fisico: number | null;
  pase_salida: number | null;
  reflejos: number | null;
  atajada: number | null;
  posicionamiento: number | null;
  saque: number | null;
  mano_a_mano: number | null;
  updated_at: string;
}

interface ComentarioRow {
  id: number;
  user_email: string;
  contenido: string;
  created_at: string;
}

const FIELD_STATS: { key: FieldStatKey; label: string }[] = [
  { key: "tiro_al_arco", label: "Tiro al arco" },
  { key: "defensa", label: "Defensa" },
  { key: "velocidad", label: "Velocidad" },
  { key: "fisico", label: "Físico" },
  { key: "pase_salida", label: "Pase / Salida" },
];

const GK_STATS: { key: GkStatKey; label: string }[] = [
  { key: "reflejos", label: "Reflejos" },
  { key: "atajada", label: "Atajada" },
  { key: "posicionamiento", label: "Posicionamiento" },
  { key: "saque", label: "Saque" },
  { key: "mano_a_mano", label: "Mano a mano" },
];

function getStatDefs(esArquero: boolean): { key: StatKey; label: string }[] {
  return esArquero ? GK_STATS : FIELD_STATS;
}

function getDefaultValues(esArquero: boolean): Record<string, number> {
  const defs = getStatDefs(esArquero);
  const res: Record<string, number> = {};
  for (const d of defs) {
    res[d.key] = 5;
  }
  return res;
}

export default function ForoInteractive({
  jugadores,
}: {
  jugadores: JugadorVotable[];
}) {
  const [activeTab, setActiveTab] = useState<"votacion" | "foro">("votacion");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Votación
  const [votos, setVotos] = useState<VotoStatRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Record<string, number>>>(
    {},
  );
  const [savingPlayer, setSavingPlayer] = useState<string | null>(null);
  const [savedPlayer, setSavedPlayer] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<"todos" | "campo" | "arqueros">(
    "todos",
  );

  // Foro
  const [comentarios, setComentarios] = useState<ComentarioRow[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const init = async () => {
      const [{ data: sessionData }, { data: votosData }, { data: comData }] =
        await Promise.all([
          supabase.auth.getSession(),
          supabase.from("votos_stats").select("*"),
          supabase
            .from("foro_comentarios")
            .select("*")
            .order("created_at", { ascending: false }),
        ]);

      if (!active) return;

      setUserEmail(sessionData.session?.user?.email ?? null);
      if (votosData) setVotos(votosData as VotoStatRow[]);
      if (comData) setComentarios(comData as ComentarioRow[]);
      setLoading(false);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginGoogle = async () => {
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/foro`,
      },
    });
    if (error) {
      setErrorMsg("No se pudo iniciar sesión con Google. Intentá de nuevo.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setDrafts({});
  };

  const votosPorJugador = useMemo(() => {
    const map = new Map<string, VotoStatRow[]>();
    for (const v of votos) {
      const list = map.get(v.jugador_nombre) ?? [];
      list.push(v);
      map.set(v.jugador_nombre, list);
    }
    return map;
  }, [votos]);

  const getMyVote = (jugadorNombre: string): VotoStatRow | undefined => {
    if (!userEmail) return undefined;
    const list = votosPorJugador.get(jugadorNombre) ?? [];
    return list.find((v) => v.user_email === userEmail);
  };

  const getPlayerValues = (jugador: JugadorVotable): Record<string, number> => {
    if (drafts[jugador.nombre]) return drafts[jugador.nombre];
    const existing = getMyVote(jugador.nombre);
    if (existing) {
      const defs = getStatDefs(jugador.esArquero);
      const res: Record<string, number> = {};
      for (const d of defs) {
        res[d.key] = existing[d.key] ?? 5;
      }
      return res;
    }
    return getDefaultValues(jugador.esArquero);
  };

  const handleSliderChange = (
    jugador: JugadorVotable,
    statKey: StatKey,
    value: number,
  ) => {
    const current = getPlayerValues(jugador);
    setDrafts((prev) => ({
      ...prev,
      [jugador.nombre]: {
        ...current,
        [statKey]: value,
      },
    }));
  };

  const handleGuardarVoto = async (jugador: JugadorVotable) => {
    if (!userEmail) {
      setErrorMsg("Iniciá sesión con Google para guardar tu voto.");
      return;
    }

    setErrorMsg(null);
    setSavingPlayer(jugador.nombre);
    const values = getPlayerValues(jugador);

    const payload = {
      user_email: userEmail,
      jugador_nombre: jugador.nombre,
      es_arquero: jugador.esArquero,
      tiro_al_arco: jugador.esArquero ? null : values.tiro_al_arco,
      defensa: jugador.esArquero ? null : values.defensa,
      velocidad: jugador.esArquero ? null : values.velocidad,
      fisico: jugador.esArquero ? null : values.fisico,
      pase_salida: jugador.esArquero ? null : values.pase_salida,
      reflejos: jugador.esArquero ? values.reflejos : null,
      atajada: jugador.esArquero ? values.atajada : null,
      posicionamiento: jugador.esArquero ? values.posicionamiento : null,
      saque: jugador.esArquero ? values.saque : null,
      mano_a_mano: jugador.esArquero ? values.mano_a_mano : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("votos_stats")
      .upsert(payload, { onConflict: "user_email,jugador_nombre" })
      .select()
      .single();

    setSavingPlayer(null);

    if (error || !data) {
      setErrorMsg(`Error al guardar el voto para ${jugador.nombre}.`);
      return;
    }

    const savedRow = data as VotoStatRow;
    setVotos((prev) => {
      const filtered = prev.filter(
        (v) =>
          !(
            v.user_email === savedRow.user_email &&
            v.jugador_nombre === savedRow.jugador_nombre
          ),
      );
      return [...filtered, savedRow];
    });

    setSavedPlayer(jugador.nombre);
    setTimeout(() => {
      setSavedPlayer((curr) => (curr === jugador.nombre ? null : curr));
    }, 2500);
  };

  const handlePublicarComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) {
      setErrorMsg("Iniciá sesión con Google para comentar.");
      return;
    }
    const texto = nuevoComentario.trim();
    if (!texto) return;

    setErrorMsg(null);
    setEnviandoComentario(true);

    const { data, error } = await supabase
      .from("foro_comentarios")
      .insert({ user_email: userEmail, contenido: texto })
      .select()
      .single();

    setEnviandoComentario(false);

    if (error || !data) {
      setErrorMsg("No se pudo publicar el comentario.");
      return;
    }

    setComentarios((prev) => [data as ComentarioRow, ...prev]);
    setNuevoComentario("");
  };

  const handleEliminarComentario = async (id: number) => {
    if (!userEmail) return;
    const { error } = await supabase
      .from("foro_comentarios")
      .delete()
      .eq("id", id)
      .eq("user_email", userEmail);

    if (error) {
      setErrorMsg("No se pudo eliminar el comentario.");
      return;
    }

    setComentarios((prev) => prev.filter((c) => c.id !== id));
  };

  const jugadoresFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return jugadores.filter((j) => {
      if (filtroRol === "campo" && j.esArquero) return false;
      if (filtroRol === "arqueros" && !j.esArquero) return false;
      if (q && !j.nombre.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [jugadores, busqueda, filtroRol]);

  const totalCampo = jugadores.filter((j) => !j.esArquero).length;
  const totalArqueros = jugadores.filter((j) => j.esArquero).length;

  return (
    <main className="min-h-screen bg-[#080C14] text-slate-100 p-4 md:p-8 selection:bg-[#00E676] selection:text-slate-950">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-1.5 rounded-full bg-[#00E676] shadow-[0_0_12px_#00E676]" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-sport text-3xl font-bold tracking-wider text-white">
                  FORO <span className="text-[#00E676]">&amp; VOTOS</span>
                </h1>
                <Link
                  href="/"
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-[#00E676]/50 hover:text-white transition"
                >
                  ← Volver al Home
                </Link>
              </div>
              <p className="text-xs text-slate-400">
                Calificá las stats del plantel (1 al 10) y debatí sobre los
                partidos
              </p>
            </div>
          </div>

          {/* Bloque de sesión */}
          <div className="flex items-center gap-3">
            {userEmail ? (
              <>
                <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                  {userEmail}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                >
                  Salir
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleLoginGoogle}
                className="px-4 py-2 rounded-xl bg-[#00E676] text-slate-950 font-bold text-xs tracking-wide hover:brightness-110 transition shadow-[0_0_16px_rgba(0,230,118,0.25)] cursor-pointer"
              >
                Iniciar sesión con Google
              </button>
            )}
          </div>
        </header>

        {errorMsg && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Tabs: 1. Votación, 2. Foro */}
        <div className="flex gap-2 border-b border-slate-800/80 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("votacion")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
              activeTab === "votacion"
                ? "bg-[#00E676] text-slate-950"
                : "bg-[#0E1422] text-slate-400 border border-slate-800 hover:text-white"
            }`}
          >
            ⭐ Votación ({jugadores.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("foro")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
              activeTab === "foro"
                ? "bg-[#00E676] text-slate-950"
                : "bg-[#0E1422] text-slate-400 border border-slate-800 hover:text-white"
            }`}
          >
            💬 Foro ({comentarios.length})
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-slate-400 py-10 text-center">
            Cargando datos...
          </div>
        ) : activeTab === "votacion" ? (
          <section className="space-y-4">
            {/* Buscador + filtros */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar jugador..."
                className="w-full sm:w-72 bg-[#0E1422] border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-[#00E676]"
              />
              <div className="flex gap-2">
                {(
                  [
                    { id: "todos", label: `Todos (${jugadores.length})` },
                    { id: "campo", label: `Campo (${totalCampo})` },
                    { id: "arqueros", label: `Arqueros (${totalArqueros})` },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFiltroRol(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      filtroRol === f.id
                        ? "bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/40"
                        : "bg-[#0E1422] text-slate-400 border border-slate-800 hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {!userEmail && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2">
                <span>
                  Podés ver los promedios votados, pero tenés que iniciar sesión
                  con Google para enviar o editar tus votos.
                </span>
                <button
                  type="button"
                  onClick={handleLoginGoogle}
                  className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold cursor-pointer"
                >
                  Entrar con Google
                </button>
              </div>
            )}

            {/* Grilla de los 25 jugadores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jugadoresFiltrados.map((jugador) => {
                const defs = getStatDefs(jugador.esArquero);
                const values = getPlayerValues(jugador);
                const votosJugador = votosPorJugador.get(jugador.nombre) ?? [];
                const yaVoto = Boolean(getMyVote(jugador.nombre));

                const promGeneral =
                  votosJugador.length > 0
                    ? (
                        votosJugador.reduce((acc, v) => {
                          const sum = defs.reduce(
                            (s, d) => s + (v[d.key] ?? 0),
                            0,
                          );
                          return acc + sum / defs.length;
                        }, 0) / votosJugador.length
                      ).toFixed(1)
                    : null;

                return (
                  <div
                    key={jugador.nombre}
                    className="bg-[#0E1422] border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-white">
                            {jugador.nombre}
                          </h2>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              jugador.esArquero
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                : "bg-emerald-500/15 text-[#00E676] border-emerald-500/30"
                            }`}
                          >
                            {jugador.esArquero ? "GK" : "CAMPO"}
                          </span>
                          {yaVoto && (
                            <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                              ✓ Votado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {promGeneral
                            ? `Comunidad: ${promGeneral} (${votosJugador.length} ${
                                votosJugador.length === 1 ? "voto" : "votos"
                              })`
                            : "Sin votos de la comunidad aún"}
                        </p>
                      </div>
                    </div>

                    {/* 5 stats sliders */}
                    <div className="space-y-2.5">
                      {defs.map((stat) => {
                        const val = values[stat.key] ?? 5;
                        const avgStat =
                          votosJugador.length > 0
                            ? (
                                votosJugador.reduce(
                                  (acc, v) => acc + (v[stat.key] ?? 0),
                                  0,
                                ) / votosJugador.length
                              ).toFixed(1)
                            : null;

                        return (
                          <div key={stat.key} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-300">
                                {stat.label}
                              </span>
                              <div className="flex items-center gap-2">
                                {avgStat && (
                                  <span className="text-[11px] text-slate-500">
                                    prom. {avgStat}
                                  </span>
                                )}
                                <span className="font-bold text-[#00E676] w-5 text-right">
                                  {val}
                                </span>
                              </div>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={10}
                              step={1}
                              value={val}
                              disabled={!userEmail}
                              onChange={(e) =>
                                handleSliderChange(
                                  jugador,
                                  stat.key,
                                  Number(e.target.value),
                                )
                              }
                              className="w-full accent-[#00E676] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={!userEmail || savingPlayer === jugador.nombre}
                      onClick={() => handleGuardarVoto(jugador)}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        savedPlayer === jugador.nombre
                          ? "bg-emerald-500 text-slate-950"
                          : "bg-slate-800 hover:bg-[#00E676] hover:text-slate-950 text-white"
                      }`}
                    >
                      {savingPlayer === jugador.nombre
                        ? "Guardando..."
                        : savedPlayer === jugador.nombre
                          ? "✓ Voto guardado"
                          : yaVoto
                            ? "Actualizar mi voto"
                            : "Guardar voto"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="max-w-3xl space-y-5">
            {/* Formulario para comentar */}
            <form
              onSubmit={handlePublicarComentario}
              className="bg-[#0E1422] border border-slate-800/90 rounded-2xl p-4 space-y-3"
            >
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
                Nuevo comentario
              </label>
              <textarea
                rows={3}
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                disabled={!userEmail}
                placeholder={
                  userEmail
                    ? "Opiná sobre el último partido, alguna stat o lo que quieras..."
                    : "Iniciá sesión con Google para comentar en el foro"
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-[#00E676] disabled:opacity-50"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  {userEmail
                    ? `Publicando como ${userEmail}`
                    : "Tu email registrado aparecerá como usuario"}
                </span>
                {userEmail ? (
                  <button
                    type="submit"
                    disabled={enviandoComentario || !nuevoComentario.trim()}
                    className="px-4 py-2 rounded-xl bg-[#00E676] text-slate-950 font-bold text-xs hover:brightness-110 transition disabled:opacity-40 cursor-pointer"
                  >
                    {enviandoComentario ? "Publicando..." : "Publicar"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleLoginGoogle}
                    className="px-4 py-2 rounded-xl bg-[#00E676] text-slate-950 font-bold text-xs hover:brightness-110 transition cursor-pointer"
                  >
                    Entrar con Google
                  </button>
                )}
              </div>
            </form>

            {/* Lista de comentarios */}
            <div className="space-y-3">
              {comentarios.length === 0 ? (
                <div className="bg-[#0E1422] border border-slate-800/80 rounded-2xl p-6 text-center text-sm text-slate-400">
                  Todavía no hay comentarios. ¡Sé el primero en arrancar el
                  debate!
                </div>
              ) : (
                comentarios.map((c) => (
                  <article
                    key={c.id}
                    className="bg-[#0E1422] border border-slate-800/80 rounded-2xl p-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#00E676]">
                        {c.user_email}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-500">
                          {new Date(c.created_at).toLocaleString("es-AR", {
                            timeZone: "America/Argentina/Buenos_Aires",
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                        {userEmail === c.user_email && (
                          <button
                            type="button"
                            onClick={() => handleEliminarComentario(c.id)}
                            className="text-[11px] text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {c.contenido}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

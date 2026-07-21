"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { generarEquipos, JugadorCampo, Arquero } from "@/lib/matchmaking";
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

  const router = useRouter();

  useEffect(() => {
    getDbData().then(setDb);
  }, []);

  useEffect(() => {
    getDbData().then((data) => {
      // Si ya hay un partido, lo pateamos al Home
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

    // Convertimos a los invitados en jugadores compatibles con el algoritmo
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
  };

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-8 min-h-screen selection:bg-emerald-500/30">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black pb-2 tracking-tight text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-400">
          Draft de Jugadores
        </h1>
        <Link
          href="/"
          className="text-slate-400 hover:text-white font-medium transition-colors"
        >
          &larr; Volver
        </Link>
      </div>

      {!equipos ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-200">
                  Plantel Oficial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-3 outline-none focus:border-emerald-500 transition-colors"
                  onChange={(e) => agregarJugador(e.target.value)}
                  value=""
                >
                  <option value="" disabled>
                    Añadir jugador de Taquito
                  </option>
                  {jugadoresDisponibles.map((j) => (
                    <option key={j.nombre} value={j.nombre}>
                      {j.nombre}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-200">
                  Añadir Invitado
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                <input
                  placeholder="Nombre"
                  value={nombreInvitado}
                  onChange={(e) => setNombreInvitado(e.target.value)}
                  className="w-1/2 bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-lg outline-none focus:border-emerald-500"
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
                  className="w-1/3 bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-lg outline-none focus:border-emerald-500"
                />
                <button
                  onClick={agregarInvitado}
                  className="w-1/4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg"
                >
                  +
                </button>
              </CardContent>
            </Card>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-slate-400 font-bold mb-4">
              Convocados: {totalJugadores}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {seleccionados.map((nombre) => (
                <div
                  key={nombre}
                  className="bg-slate-800 rounded-lg p-3 flex justify-between items-center border border-slate-700"
                >
                  <span className="font-bold text-slate-200">{nombre}</span>
                  <button
                    onClick={() => quitarJugador(nombre)}
                    className="text-slate-500 hover:text-red-400 transition-colors font-black"
                  >
                    X
                  </button>
                </div>
              ))}
              {invitados.map((inv) => (
                <div
                  key={inv.nombre}
                  className="bg-emerald-900/20 rounded-lg p-3 flex justify-between items-center border border-emerald-500/30"
                >
                  <span className="font-bold text-emerald-400">
                    {inv.nombre}{" "}
                    <span className="text-xs opacity-50 ml-1">
                      Lvl.{inv.rating}
                    </span>
                  </span>
                  <button
                    onClick={() => quitarInvitado(inv.nombre)}
                    className="text-slate-500 hover:text-red-400 transition-colors font-black"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={armarEquipos}
            disabled={!esCantidadValida}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl p-4 transition-all disabled:opacity-50 disabled:hover:bg-emerald-500 mt-6"
          >
            {esCantidadValida
              ? "Sortear Equipos 🎲"
              : `Deben ser 10, 12, 14, 16 o 18 (Actual: ${totalJugadores})`}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-900 border-slate-800 shadow-xl border-t-4 border-t-cyan-500">
                <CardHeader>
                  <CardTitle className="text-center text-2xl font-black text-cyan-400">
                    Equipo A
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {equipos.equipoA.map((j) => (
                      <li
                        key={j.nombre}
                        className="text-slate-200 font-medium text-center"
                      >
                        {j.nombre}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 shadow-xl border-t-4 border-t-emerald-500">
                <CardHeader>
                  <CardTitle className="text-center text-2xl font-black text-emerald-400">
                    Equipo B
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {equipos.equipoB.map((j) => (
                      <li
                        key={j.nombre}
                        className="text-slate-200 font-medium text-center"
                      >
                        {j.nombre}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xl font-black rounded-xl p-4 transition-all"
            >
              Confirmar Equipos y Jugar ⚽
            </button>
          </form>

          <button
            onClick={() => setEquipos(null)}
            className="w-full text-slate-400 hover:text-white font-medium p-3"
          >
            Descartar y volver a sortear
          </button>
        </div>
      )}
    </main>
  );
}

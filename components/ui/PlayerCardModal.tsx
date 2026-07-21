"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

type JugadorCampo = {
  nombre: string;
  tiro_al_arco: number;
  defensa: number;
  velocidad: number;
  fisico: number;
  pase_salida: number;
};

type Arquero = {
  nombre: string;
  atajada: number;
  reflejos: number;
  saque: number;
  posicionamiento: number;
};

type Jugador = JugadorCampo | Arquero;

export default function PlayerCardModal({
  jugadoresDb,
}: {
  jugadoresDb: Jugador[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nombreJugador = searchParams.get("jugador");
  const closeModal = useCallback(() => router.push("/"), [router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeModal]);

  if (!nombreJugador) return null;

  const jugador = jugadoresDb.find((j) => j.nombre === nombreJugador);
  if (!jugador) return null;

  // Verificamos si es jugador de campo (tiene tiro_al_arco) o arquero
  const esJugadorCampo = "tiro_al_arco" in jugador;

  // Cálculo del Overall (*10)
  const overall = esJugadorCampo
    ? Math.round(
        ((jugador.tiro_al_arco +
          jugador.defensa +
          jugador.velocidad +
          jugador.fisico +
          jugador.pase_salida) /
          5) *
          10,
      )
    : Math.round(
        ((jugador.atajada +
          jugador.reflejos +
          jugador.saque +
          jugador.posicionamiento) /
          4) *
          10,
      );

  // Formateo de datos para el pentágono
  const chartData = esJugadorCampo
    ? [
        { stat: "SHT", valor: jugador.tiro_al_arco * 10 },
        { stat: "PAS", valor: jugador.pase_salida * 10 },
        { stat: "PHY", valor: jugador.fisico * 10 },
        { stat: "DEF", valor: jugador.defensa * 10 },
        { stat: "SPD", valor: jugador.velocidad * 10 },
      ]
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      onClick={closeModal}
    >
      <div
        className="relative w-full max-w-2xl bg-linear-to-br from-indigo-950 to-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row gap-8 items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sección de la Carta (Izquierda) */}
        <div className="relative w-48 h-72 bg-linear-to-b from-amber-500 to-amber-700 rounded-lg p-1 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          <div className="absolute top-2 left-2 text-white font-black drop-shadow-md">
            <div className="text-xl leading-none">
              {esJugadorCampo ? "CM" : "GK"}
            </div>
            <div className="text-4xl">{overall}</div>
          </div>
          {/* Aquí iría la foto del jugador. Por ahora un placeholder */}
          <div className="w-full h-full bg-slate-800/50 rounded flex items-end justify-center pb-4">
            <span className="text-amber-100 font-bold uppercase tracking-wider bg-slate-900/80 px-4 py-1 rounded">
              {jugador.nombre}
            </span>
          </div>
        </div>

        {/* Sección del Pentágono (Derecha) */}
        <div className="flex-1 w-full h-64 flex flex-col items-center justify-center">
          {esJugadorCampo ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis
                  dataKey="stat"
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: "bold" }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Stats"
                  dataKey="valor"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="#10b981"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-400 text-center flex flex-col items-center gap-2">
              <span className="text-4xl">🧤</span>
              <p className="font-bold uppercase tracking-widest">
                Stats de Arquero
              </p>
              <p className="text-sm opacity-70">
                Gráfico de araña no disponible
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getDbData, cancelarPartidoEnCurso } from "../actions";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import IqDebugger from "@/components/ui/IqDebugger";

export default async function TestPage() {
  const db = await getDbData();
  const { partidos, jugadores_campo, arqueros, partido_en_curso } = db;

  // Evaluamos el estado de salud de la DB
  const dbStatus =
    jugadores_campo.length > 0 ? "Conectada 🟢" : "Error / Vacía 🔴";

  return (
    <main className="min-h-screen bg-slate-950 p-4 md:p-8 font-mono">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-black text-cyan-400">
            Panel de Developer
          </h1>
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors"
          >
            &larr; Volver al Home
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tarjeta de Estado de la DB */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200">
                Estado de Base de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-slate-400 text-sm">
              <p>
                Status: <span className="font-bold text-white">{dbStatus}</span>
              </p>
              <p>
                Jugadores de Campo:{" "}
                <span className="font-bold text-white">
                  {jugadores_campo.length}
                </span>
              </p>
              <p>
                Arqueros:{" "}
                <span className="font-bold text-white">{arqueros.length}</span>
              </p>
              <p>
                Historial de Partidos:{" "}
                <span className="font-bold text-white">{partidos.length}</span>
              </p>
            </CardContent>
          </Card>

          {/* Tarjeta de Backup */}
          <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-slate-200">
                Seguridad y Respaldo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-400">
                Descarga una copia exacta y en tiempo real de toda la base de
                datos en formato JSON. Ideal para resguardar antes de jugar.
              </p>

              <a
                href="/api/backup"
                download
                className="block text-center w-full bg-blue-900/50 hover:bg-blue-900 text-blue-200 font-bold py-2 px-4 rounded-lg transition-colors border border-blue-800"
              >
                💾 Descargar Backup Completo
              </a>
            </CardContent>
          </Card>

          {/* Tarjeta de Control de Matchmaking */}
          <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-yellow-500">
            <CardHeader>
              <CardTitle className="text-slate-200">
                Control de Matchmaking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-400">
                Draft Activo:{" "}
                <span
                  className={
                    partido_en_curso
                      ? "text-red-400 font-bold"
                      : "text-emerald-400 font-bold"
                  }
                >
                  {partido_en_curso ? "SÍ (Bloqueado)" : "NO (Libre)"}
                </span>
              </p>

              {partido_en_curso && (
                <form action={cancelarPartidoEnCurso}>
                  <button
                    type="submit"
                    className="w-full bg-red-900/50 hover:bg-red-900 text-red-200 font-bold py-2 px-4 rounded-lg transition-colors border border-red-800"
                  >
                    ⚠️ Forzar Cancelación de Draft
                  </button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Visor de Datos Crudos (Para debuggear) */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-200">
              Raw Data: Partido en Curso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-xs text-emerald-400 border border-slate-800">
              {JSON.stringify(
                partido_en_curso || { status: "Ningún partido en curso" },
                null,
                2,
              )}
            </pre>
          </CardContent>
        </Card>
        <IqDebugger />
      </div>
    </main>
  );
}

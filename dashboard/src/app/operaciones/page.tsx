import Link from "next/link";
import { OperacionesBotHub } from "@/components/SalesGama/OperacionesBotHub";

export const metadata = {
  title: "Operaciones — SALES-GAMA AI",
  description: "Panel de control del agente de ventas IA y captura de prospectos.",
};

export default function OperacionesPage() {
  return (
    <main className="min-h-screen bg-[#050d1a] text-white p-4 sm:p-8 space-y-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between pb-2 border-b border-blue-900/30">
        <Link
          href="/operacion"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0b1b36] hover:bg-[#14284d] border border-blue-800/50 text-blue-300 text-xs font-semibold transition-all shadow-sm"
        >
          <span>← Volver a Central Operativa & CRM (/operacion)</span>
        </Link>
        <span className="text-[11px] text-slate-400 font-mono">GAMA SALES-BOT COMMAND</span>
      </div>
      <OperacionesBotHub />
    </main>
  );
}

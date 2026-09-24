import { OperacionesBotHub } from "@/components/SalesGama/OperacionesBotHub";

export const metadata = {
  title: "Operaciones — SALES-GAMA AI",
  description: "Panel de control del agente de ventas IA y captura de prospectos.",
};

export default function OperacionesPage() {
  return (
    <main className="min-h-screen bg-[#050d1a] text-white p-4 sm:p-8">
      <OperacionesBotHub />
    </main>
  );
}

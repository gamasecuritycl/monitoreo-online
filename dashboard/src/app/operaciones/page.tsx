import { SalesGamaModal } from "@/components/SalesGama/Modal/SalesGamaModal";

export const metadata = {
  title: "Operaciones — SALES-GAMA",
  description: "Panel de control del agente de ventas IA.",
};

export default function OperacionesPage() {
  return (
    <main className="min-h-screen bg-[#050d1a] text-white p-8">
      <h1 className="apple-display-lg mb-4">Operaciones</h1>
      <p className="text-slate-300 mb-8">
        Controla el agente SALES-GAMA, configura precios, revisa leads y edita
        el prompt de ventas.
      </p>
      <SalesGamaModal />
    </main>
  );
}

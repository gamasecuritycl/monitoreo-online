import ScorpionDashboard from '@/components/ScorpionDashboard'
import OperatorAuthGate from '@/components/OperatorAuthGate'

export const metadata = {
  title: 'Central Operativa GAMA Security — Dashboard Monitoreo 24/7',
  description: 'Sistema de monitoreo táctico y control de alarmas en tiempo real',
}

export default function DashboardPage() {
  return (
    <OperatorAuthGate>
      <ScorpionDashboard />
    </OperatorAuthGate>
  )
}

import OperacionCRM from '@/components/OperacionCRM'
import OperatorAuthGate from '@/components/OperatorAuthGate'

export const metadata = {
  title: 'Acceso Operadores — Central GAMA Security 24/7',
  description: 'Portal de Control de Monitoreo, CRM 360° y Facturación de GAMA Security',
}

export default function OperacionPage() {
  return (
    <OperatorAuthGate>
      <OperacionCRM />
    </OperatorAuthGate>
  )
}

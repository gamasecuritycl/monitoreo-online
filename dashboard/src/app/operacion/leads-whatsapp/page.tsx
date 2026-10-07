import LeadsWhatsAppCRM from '@/components/LeadsWhatsAppCRM'
import OperatorAuthGate from '@/components/OperatorAuthGate'

export const metadata = {
  title: 'Leads WhatsApp 24/7 (Meta Ads) — Central GAMA Security',
  description: 'Control de Leads, Prospectos y Visitas Agendadas de WhatsApp capturados en la nube.',
}

export default function LeadsWhatsAppPage() {
  return (
    <OperatorAuthGate>
      <LeadsWhatsAppCRM />
    </OperatorAuthGate>
  )
}

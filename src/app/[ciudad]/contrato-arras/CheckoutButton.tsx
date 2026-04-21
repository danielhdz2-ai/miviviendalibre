import LeadCaptureForm from '@/components/LeadCaptureForm'

export default function CheckoutButton({ ciudad }: { ciudad: string }) {
  return (
    <LeadCaptureForm
      serviceKey="arras-penitenciales"
      price={120}
      label={`Revisar mi contrato de arras en ${ciudad}`}
    />
  )
}

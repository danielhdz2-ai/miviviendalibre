import LeadCaptureForm from '@/components/LeadCaptureForm'

export default function CheckoutButton({ ciudad }: { ciudad: string }) {
  return (
    <LeadCaptureForm
      serviceKey="alquiler-vivienda-lau"
      price={90}
      label={`Revisar mi contrato de alquiler en ${ciudad}`}
    />
  )
}

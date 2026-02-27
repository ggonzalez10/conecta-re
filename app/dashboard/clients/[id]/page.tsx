import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ClientDetails } from "@/components/clients/client-details"

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <ClientDetails clientId={params.id} />
    </DashboardLayout>
  )
}

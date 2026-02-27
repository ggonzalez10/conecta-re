import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { InspectorDetail } from "@/components/entities/inspector-detail"

export default function InspectorDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <InspectorDetail inspectorId={params.id} />
    </DashboardLayout>
  )
}

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { InspectorForm } from "@/components/entities/inspector-form"

export default function EditInspectorPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <InspectorForm inspectorId={params.id} />
    </DashboardLayout>
  )
}

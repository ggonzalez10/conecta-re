import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { InspectionTemplateForm } from "@/components/inspections/inspection-template-form"

export default function EditInspectionTemplatePage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <InspectionTemplateForm templateId={params.id} />
    </DashboardLayout>
  )
}

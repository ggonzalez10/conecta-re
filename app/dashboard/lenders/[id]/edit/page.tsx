import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { LenderForm } from "@/components/entities/lender-form"

export default function EditLenderPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <LenderForm lenderId={params.id} />
    </DashboardLayout>
  )
}

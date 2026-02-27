import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { PropertyDetails } from "@/components/properties/property-details"

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <PropertyDetails propertyId={params.id} />
    </DashboardLayout>
  )
}

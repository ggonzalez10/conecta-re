import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { FollowUpDetails } from "@/components/follow-ups/follow-up-details"

export default function FollowUpDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <FollowUpDetails followUpId={params.id} />
    </DashboardLayout>
  )
}

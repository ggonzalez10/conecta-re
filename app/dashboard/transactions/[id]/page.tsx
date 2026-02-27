import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { TransactionDetails } from "@/components/transactions/transaction-details"

export default function TransactionDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <TransactionDetails transactionId={params.id} />
    </DashboardLayout>
  )
}

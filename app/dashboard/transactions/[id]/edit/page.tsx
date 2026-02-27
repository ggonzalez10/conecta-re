import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { TransactionEditView } from "@/components/transactions/transaction-edit-view"

export default function EditTransactionPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <TransactionEditView transactionId={params.id} />
    </DashboardLayout>
  )
}

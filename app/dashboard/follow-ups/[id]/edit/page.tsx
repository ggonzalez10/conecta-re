"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { FollowUpForm } from "@/components/follow-ups/follow-up-form"
import { InspectionRequestManager } from "@/components/follow-ups/inspection-request-manager"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface FollowUpData {
  id: string
  event_name: string
  description: string
  due_date: string
  priority: string
  status: string
  transaction_id: string
  assigned_to: string
  notes: string
  is_inspection_related: boolean
  inspection_type_name: string | null
  inspection_type_id: string | null
  template_id: string | null
}

export default function EditFollowUpPage({ params }: { params: { id: string } }) {
  const [followUp, setFollowUp] = useState<FollowUpData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchFollowUp()
  }, [params.id])

  const fetchFollowUp = async () => {
    try {
      const response = await fetch(`/api/follow-ups/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setFollowUp(data.followUp)
      } else {
        router.push("/dashboard/transactions")
      }
    } catch (error) {
      console.error("Error fetching follow-up:", error)
      router.push("/dashboard/transactions")
    } finally {
      setLoading(false)
    }
  }

  const returnUrl = followUp?.transaction_id
    ? `/dashboard/transactions/${followUp.transaction_id}/edit`
    : "/dashboard/transactions"

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="text-center">Loading follow-up details...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!followUp) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="text-center">Follow-up not found</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={returnUrl}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Edit Follow-up</h1>
        </div>

        <FollowUpForm initialData={followUp} returnTo={returnUrl} />

        {/* Inspection Request Manager — only shown for inspection-related tasks */}
        {followUp.is_inspection_related && followUp.transaction_id && (
          <InspectionRequestManager
            followUpId={followUp.id}
            transactionId={followUp.transaction_id}
            inspectionType={followUp.inspection_type_name || ""}
            inspectionTypeId={followUp.inspection_type_id || ""}
            isInspectionRelated={followUp.is_inspection_related}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

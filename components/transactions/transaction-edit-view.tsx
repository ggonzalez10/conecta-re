"use client"

import { useState, useEffect } from "react"
import { TransactionForm } from "./transaction-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Calendar, CheckCircle, Clock, AlertTriangle, Edit, Plus, ChevronDown, Ban, MinusCircle } from "lucide-react"
import Link from "next/link"
import { TransactionAssignmentManager } from "./transaction-assignment-manager"

interface TransactionEditViewProps {
  transactionId: string
}

interface TransactionDetails {
  transaction: any
  property?: { address: string; city: string; state: string }
  buyer?: { first_name: string; last_name: string }
  seller?: { first_name: string; last_name: string }
  listing_agent?: { first_name: string; last_name: string }
  co_listing_agent?: { first_name: string; last_name: string }
  buyer_agent?: { first_name: string; last_name: string }
  co_buyer_agent?: { first_name: string; last_name: string }
  lender?: { company_name: string; contact_name: string }
  attorney?: { firm_name: string; attorney_name: string }
}

interface FollowUp {
  id: string
  event_name: string
  description: string
  due_date: string
  priority: string
  status: string
  assigned_first_name: string
  assigned_last_name: string
  notes: string
}

export function TransactionEditView({ transactionId }: TransactionEditViewProps) {
  const [loading, setLoading] = useState(true)
  const [details, setDetails] = useState<TransactionDetails | null>(null)
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [followUpsLoading, setFollowUpsLoading] = useState(true)
  const [followUpsOpen, setFollowUpsOpen] = useState(false)
  const [userRole, setUserRole] = useState<string>("")

  useEffect(() => {
    fetchTransactionDetails()
    fetchFollowUps() // Fetch follow-ups
    fetchUserRole()
  }, [transactionId])

  const fetchUserRole = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setUserRole(data.user?.role || "")
      }
    } catch (error) {
      console.error("Error fetching user role:", error)
    }
  }

  const fetchTransactionDetails = async () => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`)
      if (response.ok) {
        const data = await response.json()
        setDetails(data)
      }
    } catch (error) {
      console.error("Error fetching transaction details:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFollowUps = async () => {
    try {
      const response = await fetch(`/api/follow-ups?transaction_id=${transactionId}`)
      if (response.ok) {
        const data = await response.json()
        setFollowUps(data.followUps || [])
      }
    } catch (error) {
      console.error("Error fetching follow-ups:", error)
    } finally {
      setFollowUpsLoading(false)
    }
  }

  const getFollowUpStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      case "not_applicable":
        return "bg-slate-100 text-slate-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "urgent":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getFollowUpIcon = (priority: string, status: string) => {
    if (status === "overdue") return <AlertTriangle className="h-4 w-4 text-red-500" />
    if (status === "completed") return <CheckCircle className="h-4 w-4 text-green-500" />
    if (status === "not_applicable") return <MinusCircle className="h-4 w-4 text-slate-500" />
    if (priority === "urgent" || priority === "high") return <Clock className="h-4 w-4 text-orange-500" />
    return <Clock className="h-4 w-4 text-blue-500" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleCompleteFollowUp = async (followUpId: string) => {
    try {
      const response = await fetch(`/api/follow-ups/${followUpId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          completed_at: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        // Refresh the follow-ups list
        await fetchFollowUps()
      } else {
        const error = await response.json()
        console.error("Error completing follow-up:", error)
        alert("Failed to update follow-up. Please try again.")
      }
    } catch (error) {
      console.error("Error completing follow-up:", error)
      alert("Failed to update follow-up. Please try again.")
    }
  }

  const handleNotApplicableFollowUp = async (followUpId: string) => {
    try {
      const response = await fetch(`/api/follow-ups/${followUpId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "not_applicable",
        }),
      })

      if (response.ok) {
        // Refresh the follow-ups list
        await fetchFollowUps()
      } else {
        const error = await response.json()
        console.error("Error marking follow-up as not applicable:", error)
        alert("Failed to update follow-up. Please try again.")
      }
    } catch (error) {
      console.error("Error marking follow-up as not applicable:", error)
      alert("Failed to update follow-up. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {details && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {details.property && (
                <div>
                  <p className="text-muted-foreground">Property</p>
                  <p className="font-medium">
                    {details.property.address}, {details.property.city}, {details.property.state}
                  </p>
                </div>
              )}
              {details.buyer && (
                <div>
                  <p className="text-muted-foreground">Buyer</p>
                  <p className="font-medium">
                    {details.buyer.first_name} {details.buyer.last_name}
                  </p>
                </div>
              )}
              {details.seller && (
                <div>
                  <p className="text-muted-foreground">Seller</p>
                  <p className="font-medium">
                    {details.seller.first_name} {details.seller.last_name}
                  </p>
                </div>
              )}
              {/* Purchase: buyer agent + co-buyer agent. Others: listing agent + co-listing agent */}
              {details.transaction?.transaction_type === "purchase" ? (
                <>
                  {details.buyer_agent && (
                    <div>
                      <p className="text-muted-foreground">Buyer Agent</p>
                      <p className="font-medium">
                        {details.buyer_agent.first_name} {details.buyer_agent.last_name}
                      </p>
                    </div>
                  )}
                  {details.co_buyer_agent && (
                    <div>
                      <p className="text-muted-foreground">Co-Buyer Agent</p>
                      <p className="font-medium">
                        {details.co_buyer_agent.first_name} {details.co_buyer_agent.last_name}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {details.listing_agent && (
                    <div>
                      <p className="text-muted-foreground">Listing Agent</p>
                      <p className="font-medium">
                        {details.listing_agent.first_name} {details.listing_agent.last_name}
                      </p>
                    </div>
                  )}
                  {details.co_listing_agent && (
                    <div>
                      <p className="text-muted-foreground">Co-Listing Agent</p>
                      <p className="font-medium">
                        {details.co_listing_agent.first_name} {details.co_listing_agent.last_name}
                      </p>
                    </div>
                  )}
                </>
              )}
              {details.lender && (
                <div>
                  <p className="text-muted-foreground">Lender</p>
                  <p className="font-medium">
                    {details.lender.company_name} - {details.lender.contact_name}
                  </p>
                </div>
              )}
              {details.attorney && (
                <div>
                  <p className="text-muted-foreground">Attorney</p>
                  <p className="font-medium">
                    {details.attorney.firm_name} - {details.attorney.attorney_name}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Collapsible open={followUpsOpen} onOpenChange={setFollowUpsOpen}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0 hover:bg-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Follow-up Tasks ({followUps.length})
                </CardTitle>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${followUpsOpen ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <Button size="sm" asChild>
              <Link href={`/dashboard/follow-ups/new?transaction_id=${transactionId}`}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Link>
            </Button>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {followUpsLoading ? (
                <div className="text-center py-4">Loading follow-up tasks...</div>
              ) : followUps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No follow-up tasks yet</p>
                  <p className="text-sm">Tasks will be created automatically when the transaction is saved</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {followUps.map((followUp) => (
                    <div key={followUp.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                      {getFollowUpIcon(followUp.priority, followUp.status)}
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium text-sm">{followUp.event_name}</h4>
                        {followUp.description && (
                          <p className="text-xs text-muted-foreground">{followUp.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge className={getFollowUpStatusColor(followUp.status)}>{followUp.status}</Badge>
                          <Badge className={getPriorityColor(followUp.priority)}>{followUp.priority}</Badge>
                          <span className="text-xs text-muted-foreground">Due: {formatDate(followUp.due_date)}</span>
                        </div>
                        {followUp.assigned_first_name && (
                          <p className="text-xs text-muted-foreground">
                            Assigned to: {followUp.assigned_first_name} {followUp.assigned_last_name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {(followUp.status === "pending" || followUp.status === "overdue") && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleCompleteFollowUp(followUp.id)}
                              title="Mark as completed"
                            >
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleNotApplicableFollowUp(followUp.id)}
                              title="Mark as Not Applicable"
                            >
                              <Ban className="h-3 w-3 text-slate-600" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6" asChild title="Edit task">
                          <Link href={`/dashboard/follow-ups/${followUp.id}/edit`}>
                            <Edit className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Assistant Assignments - Visible to managers and admins */}
      {(userRole === "manager" || userRole === "admin") && (
        <TransactionAssignmentManager transactionId={transactionId} />
      )}

      <TransactionForm transactionId={transactionId} />
    </div>
  )
}

"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trash2, CheckCircle2 } from "lucide-react"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface Transaction {
  id: string
  transaction_type: string
  status: string
  priority: string
  purchase_price: number
  due_diligence_date: string
  closing_date: string
  property_address: string
  property_city: string
  property_state: string
  buyer_first_name: string
  buyer_last_name: string
  seller_first_name: string
  seller_last_name: string
  listing_agent_first_name: string
  listing_agent_last_name: string
  total_tasks: number
  completed_tasks: number
}

interface TransactionFiltersState {
  search: string
  status: string
  priority: string
  type: string
}

interface TransactionsListProps {
  filters?: TransactionFiltersState
}

export function TransactionsList({ filters }: TransactionsListProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions?sort=closing_date&order=asc")
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  // Apply filters to transactions
  const filteredTransactions = useMemo(() => {
    if (!filters) return transactions

    return transactions.filter((transaction) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch =
          transaction.property_address?.toLowerCase().includes(searchLower) ||
          transaction.property_city?.toLowerCase().includes(searchLower) ||
          transaction.property_state?.toLowerCase().includes(searchLower) ||
          transaction.buyer_first_name?.toLowerCase().includes(searchLower) ||
          transaction.buyer_last_name?.toLowerCase().includes(searchLower) ||
          transaction.seller_first_name?.toLowerCase().includes(searchLower) ||
          transaction.seller_last_name?.toLowerCase().includes(searchLower) ||
          transaction.listing_agent_first_name?.toLowerCase().includes(searchLower) ||
          transaction.listing_agent_last_name?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Status filter
      if (filters.status && filters.status !== "all") {
        if (transaction.status !== filters.status) return false
      }

      // Priority filter
      if (filters.priority && filters.priority !== "all") {
        if (transaction.priority !== filters.priority) return false
      }

      // Type filter
      if (filters.type && filters.type !== "all") {
        if (transaction.transaction_type !== filters.type) return false
      }

      return true
    })
  }, [transactions, filters])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "under_contract":
        return "bg-blue-100 text-blue-800"
      case "contingent":
        return "bg-orange-100 text-orange-800"
      case "closed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    // Parse date as local date to avoid timezone issues
    const datePart = dateString.split("T")[0]
    const [year, month, day] = datePart.split("-")
    return `${month}/${day}/${year}`
  }

  const handleDelete = async (transactionId: string) => {
    if (!confirm("Are you sure you want to delete this transaction? It will be hidden from view.")) {
      return
    }

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Refresh the transactions list
        fetchTransactions()
      } else {
        console.error("Error deleting transaction")
      }
    } catch (error) {
      console.error("Error deleting transaction:", error)
    }
  }

  const canDelete = user?.role === "admin" || user?.role === "manager"

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading transactions...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {transactions.length === 0 
                ? "No transactions found. Create your first transaction to get started."
                : "No transactions match your filters. Try adjusting your search criteria."}
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <ContextMenu key={transaction.id}>
                <ContextMenuTrigger>
                  <div
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/transactions/${transaction.id}/edit`)}
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">
                          {transaction.property_address}, {transaction.property_city}, {transaction.property_state}
                        </h4>
                        <Badge className={getPriorityColor(transaction.priority)}>{transaction.priority}</Badge>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Type:</span> {transaction.transaction_type}
                        </div>
                        <div>
                          <span className="font-medium">Price:</span> {formatCurrency(transaction.purchase_price)}
                        </div>
                        <div>
                          <span className="font-medium">Due Diligence:</span>{" "}
                          {transaction.due_diligence_date ? formatDate(transaction.due_diligence_date) : "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Closing:</span> {formatDate(transaction.closing_date)}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {transaction.buyer_first_name && (
                          <span>
                            <span className="font-medium">Buyer:</span> {transaction.buyer_first_name}{" "}
                            {transaction.buyer_last_name}
                          </span>
                        )}
                        {transaction.seller_first_name && (
                          <span>
                            <span className="font-medium">Seller:</span> {transaction.seller_first_name}{" "}
                            {transaction.seller_last_name}
                          </span>
                        )}
                        {transaction.listing_agent_first_name && (
                          <span>
                            <span className="font-medium">Agent:</span> {transaction.listing_agent_first_name}{" "}
                            {transaction.listing_agent_last_name}
                          </span>
                        )}
                      </div>

                      {/* Task Progress Bar */}
                      {transaction.total_tasks > 0 && (
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Tasks Progress</span>
                            </div>
                            <span className="font-medium">
                              {transaction.completed_tasks}/{transaction.total_tasks}
                            </span>
                          </div>
                          <Progress 
                            value={(transaction.completed_tasks / transaction.total_tasks) * 100} 
                            className="h-2"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </ContextMenuTrigger>
                {canDelete && (
                  <ContextMenuContent>
                    <ContextMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Transaction
                    </ContextMenuItem>
                  </ContextMenuContent>
                )}
              </ContextMenu>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

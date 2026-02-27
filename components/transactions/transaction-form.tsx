"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, Check, X, Search } from "lucide-react"
import Link from "next/link"
import { ClientModal } from "@/components/modals/client-modal"
import { AgentModal } from "@/components/modals/agent-modal"
import { LenderModal } from "@/components/modals/lender-modal"
import { AttorneyModal } from "@/components/modals/attorney-modal"
import { PropertyModal } from "@/components/modals/property-modal"
import { DocumentManager } from "@/components/documents/document-manager"

interface TransactionFormProps {
  transactionId?: string
}

interface Property {
  id: string
  address: string
  city: string
  state: string
}

interface Customer {
  id: string
  first_name: string
  middle_name?: string | null
  last_name: string
  email: string
  phone?: string | null // Added phone
}

interface Agent {
  id: string
  first_name: string
  middle_name?: string | null
  last_name: string
}

interface EntityContact {
  id: string
  contact_name: string
  email?: string
  phone?: string
  role?: string
  is_primary: boolean
}

interface Lender {
  id: string
  company_name: string
  contact_name?: string
  name?: string
  contacts?: EntityContact[]
}

interface Attorney {
  id: string
  firm_name: string
  attorney_name?: string
  email?: string
  phone?: string
  contacts?: EntityContact[]
}

const formatCustomerName = (customer: Customer): string => {
  const firstName = String(customer.first_name || "")
  const middleName = customer.middle_name ? String(customer.middle_name) : ""
  const lastName = String(customer.last_name || "")
  return [firstName, middleName, lastName].filter(Boolean).join(" ").trim() || "Unknown"
}

export function TransactionForm({ transactionId }: TransactionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [lenders, setLenders] = useState<Lender[]>([])
  const [attorneys, setAttorneys] = useState<Attorney[]>([])

  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [agentModalOpen, setAgentModalOpen] = useState(false)
  const [lenderModalOpen, setLenderModalOpen] = useState(false)
  const [attorneyModalOpen, setAttorneyModalOpen] = useState(false)
  const [propertyModalOpen, setPropertyModalOpen] = useState(false)

  const [buyerSearch, setBuyerSearch] = useState("")
  const [sellerSearch, setSellerSearch] = useState("")

  const [formData, setFormData] = useState({
    transaction_type: "",
    property_id: "",
    buyer_ids: [] as string[],
    seller_ids: [] as string[],
    listing_agent_id: "",
    co_listing_agent_id: "",
    buyer_agent_id: "", // Renamed from selling_agent_id
    co_buyer_agent_id: "", // Renamed from co_selling_agent_id
    lender_id: "",
    attorney_id: "",
    purchase_price: "",
    earnest_money: "",
    seller_commission_rate: "",
    buyer_commission_rate: "",
    commission_rate: "",
    commission_flat_fee: "",
    brokerage_fee: "",
    due_diligence_money: "", // Added field
    down_payment: "",
    loan_type: "",
    rate: "",
    status: "pending",
    priority: "medium",
    contract_date: "",
    closing_date: "",
    inspection_date: "",
    appraisal_date: "",
    due_diligence_date: "",
    notes: "",
  })

  useEffect(() => {
    const sellerRate = formData.seller_commission_rate ? Number.parseFloat(formData.seller_commission_rate) : 0
    const buyerRate = formData.buyer_commission_rate ? Number.parseFloat(formData.buyer_commission_rate) : 0
    const totalRate = sellerRate + buyerRate
    setFormData((prev) => ({ ...prev, commission_rate: totalRate > 0 ? totalRate.toFixed(4) : "" }))
  }, [formData.seller_commission_rate, formData.buyer_commission_rate])

  useEffect(() => {
    const initializeForm = async () => {
      if (transactionId) {
        setDataLoaded(false)
        await Promise.all([loadEntities(), loadTransaction()])
        setDataLoaded(true)
      } else {
        await loadEntities()
        setDataLoaded(true)
      }
    }
    initializeForm()
  }, [transactionId])

  // useEffect(() => {
  //   console.log("[v0] Form data state updated:", formData)
  // }, [formData])

  const loadTransaction = async () => {
    try {
      // console.log("[v0] Loading transaction:", transactionId)
      const response = await fetch(`/api/transactions/${transactionId}`)
      if (response.ok) {
        const data = await response.json()
        // console.log("[v0] Transaction data received:", data)

        if (data.transaction) {
          const transaction = data.transaction
          // console.log("[v0] Transaction data received:", transaction)

          const buyerIds = data.buyers ? data.buyers.map((b: any) => String(b.id)) : []
          const sellerIds = data.sellers ? data.sellers.map((s: any) => String(s.id)) : []

          // console.log("[v0] Extracted buyer IDs:", buyerIds)
          // console.log("[v0] Extracted seller IDs:", sellerIds)

          setFormData((prev) => ({
            ...prev,
            transaction_type: transaction.transaction_type || "",
            property_id: transaction.property_id ? String(transaction.property_id) : "",
            buyer_ids: buyerIds,
            seller_ids: sellerIds,
            listing_agent_id: transaction.listing_agent_id ? String(transaction.listing_agent_id) : "",
            co_listing_agent_id: transaction.co_listing_agent_id ? String(transaction.co_listing_agent_id) : "",
            buyer_agent_id: transaction.buyer_agent_id ? String(transaction.buyer_agent_id) : "", // Renamed from selling_agent_id
            co_buyer_agent_id: transaction.co_buyer_agent_id ? String(transaction.co_buyer_agent_id) : "", // Renamed from co_selling_agent_id
            lender_id: transaction.lender_id ? String(transaction.lender_id) : "",
            attorney_id: transaction.attorney_id ? String(transaction.attorney_id) : "",
            purchase_price: transaction.purchase_price ? String(transaction.purchase_price) : "",
            earnest_money: transaction.earnest_money_deposit
              ? String(transaction.earnest_money_deposit)
              : transaction.earnest_money
                ? String(transaction.earnest_money)
                : "",
            seller_commission_rate: transaction.seller_commission_rate
              ? String(transaction.seller_commission_rate)
              : "",
            buyer_commission_rate: transaction.buyer_commission_rate ? String(transaction.buyer_commission_rate) : "",
            commission_rate: transaction.commission_rate ? String(transaction.commission_rate) : "",
            commission_flat_fee: transaction.commission_flat_fee ? String(transaction.commission_flat_fee) : "",
            closing_fee: transaction.closing_fee ? String(transaction.closing_fee) : "",
            brokerage_fee: transaction.brokerage_fee ? String(transaction.brokerage_fee) : "",
            due_diligence_money: transaction.due_diligence_money ? String(transaction.due_diligence_money) : "", // Added field
            down_payment: transaction.down_payment ? String(transaction.down_payment) : "",
            loan_type: transaction.loan_type || "",
            rate: transaction.rate ? String(transaction.rate) : "",
            status: transaction.status || "pending",
            priority: transaction.priority || "medium",
            contract_date: transaction.contract_date ? transaction.contract_date.split("T")[0] : "",
            closing_date: transaction.closing_date ? transaction.closing_date.split("T")[0] : "",
            inspection_date: transaction.inspection_date ? transaction.inspection_date.split("T")[0] : "",
            appraisal_date: transaction.appraisal_date ? transaction.appraisal_date.split("T")[0] : "",
            due_diligence_date: transaction.due_diligence_date ? transaction.due_diligence_date.split("T")[0] : "",
            notes: transaction.notes || "",
          }))

          // console.log("[v0] Form data set successfully")
        }
      } else {
        console.error("[v0] Failed to fetch transaction:", response.status)
      }
    } catch (error) {
      console.error("Error loading transaction:", error)
    }
  }

  const loadEntities = async () => {
    try {
      const [propertiesRes, customersRes, agentsRes, lendersRes, attorneysRes] = await Promise.all([
        fetch("/api/properties"),
        fetch("/api/clients"),
        fetch("/api/agents"),
        fetch("/api/lenders"),
        fetch("/api/attorneys"),
      ])

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json()
        setProperties(propertiesData.properties || [])
      }

      if (customersRes.ok) {
        const customersData = await customersRes.json()
        const clientsList = (customersData.clients || []).map((c: any) => ({
          ...c,
          id: String(c.id),
          first_name: String(c.first_name || ""),
          middle_name: c.middle_name ? String(c.middle_name) : "",
          last_name: String(c.last_name || ""),
          email: String(c.email || ""),
          phone: c.phone ? String(c.phone) : "", // Ensure phone is a string
        }))
        setCustomers(clientsList)
      }

      if (agentsRes.ok) {
        const agentsData = await agentsRes.json()
        const agentsList = (agentsData.agents || []).map((a: any) => ({
          ...a,
          id: String(a.id),
          first_name: String(a.first_name || ""),
          middle_name: a.middle_name ? String(a.middle_name) : "",
          last_name: String(a.last_name || ""),
        }))
        setAgents(agentsList)
      }

      if (lendersRes.ok) {
        const lendersData = await lendersRes.json()
        setLenders(lendersData.lenders || [])
      }

      if (attorneysRes.ok) {
        const attorneysData = await attorneysRes.json()
        setAttorneys(attorneysData.attorneys || [])
      }
    } catch (error) {
      console.error("Error loading entities:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        transaction_type: formData.transaction_type,
        property_id: formData.property_id || null,
        buyer_ids: formData.buyer_ids,
        seller_ids: formData.seller_ids,
        listing_agent_id: formData.listing_agent_id || null,
        co_listing_agent_id: formData.co_listing_agent_id || null,
        buyer_agent_id: formData.buyer_agent_id || null, // Renamed from selling_agent_id
        co_buyer_agent_id: formData.co_buyer_agent_id || null, // Renamed from co_selling_agent_id
        lender_id: formData.lender_id || null,
        attorney_id: formData.attorney_id || null,
        purchase_price: formData.purchase_price ? Number.parseFloat(formData.purchase_price) : null,
        earnest_money_deposit: formData.earnest_money ? Number.parseFloat(formData.earnest_money) : null,
        due_diligence_money: formData.due_diligence_money ? Number.parseFloat(formData.due_diligence_money) : null, // Added field
        seller_commission_rate: formData.seller_commission_rate
          ? Number.parseFloat(formData.seller_commission_rate)
          : null,
        buyer_commission_rate: formData.buyer_commission_rate
          ? Number.parseFloat(formData.buyer_commission_rate)
          : null,
        commission_rate: formData.commission_rate ? Number.parseFloat(formData.commission_rate) : null,
        commission_flat_fee: formData.commission_flat_fee ? Number.parseFloat(formData.commission_flat_fee) : null,
        closing_fee: formData.closing_fee ? Number.parseFloat(formData.closing_fee) : null,
        brokerage_fee: formData.brokerage_fee ? Number.parseFloat(formData.brokerage_fee) : null,
        down_payment: formData.down_payment ? Number.parseFloat(formData.down_payment) : null,
        loan_type: formData.loan_type || null,
        rate: formData.rate ? Number.parseFloat(formData.rate) : null,
        status: formData.status,
        priority: formData.priority,
        contract_date: formData.contract_date || null,
        closing_date: formData.closing_date || null,
        inspection_date: formData.inspection_date || null,
        appraisal_date: formData.appraisal_date || null,
        due_diligence_date: formData.due_diligence_date || null,
        notes: formData.notes || "",
      }

      const url = transactionId ? `/api/transactions/${transactionId}` : "/api/transactions"
      const method = transactionId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push("/dashboard/transactions")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to save transaction")
      }
    } catch (error) {
      console.error("Error saving transaction:", error)
      alert("Failed to save transaction")
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch("/api/clients")
      if (response.ok) {
        const data = await response.json()
        const clientsList = (data.clients || []).map((c: any) => ({
          ...c,
          id: String(c.id),
          first_name: String(c.first_name || ""),
          middle_name: c.middle_name ? String(c.middle_name) : "",
          last_name: String(c.last_name || ""),
          email: String(c.email || ""),
          phone: c.phone ? String(c.phone) : "", // Ensure phone is a string
        }))
        setCustomers(clientsList)
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
    }
  }, [])

  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch("/api/agents")
      if (response.ok) {
        const data = await response.json()
        const agentsList = (data.agents || []).map((a: any) => ({
          ...a,
          id: String(a.id),
          first_name: String(a.first_name || ""),
          middle_name: a.middle_name ? String(a.middle_name) : "",
          last_name: String(a.last_name || ""),
        }))
        setAgents(agentsList)
      }
    } catch (error) {
      console.error("Error fetching agents:", error)
    }
  }, [])

  const fetchLenders = useCallback(async () => {
    try {
      const response = await fetch("/api/lenders")
      if (response.ok) {
        const data = await response.json()
        setLenders(data.lenders || [])
      }
    } catch (error) {
      console.error("Error fetching lenders:", error)
    }
  }, [])

  const fetchAttorneys = useCallback(async () => {
    try {
      const response = await fetch("/api/attorneys")
      if (response.ok) {
        const data = await response.json()
        setAttorneys(data.attorneys || [])
      }
    } catch (error) {
      console.error("Error fetching attorneys:", error)
    }
  }, [])

  const fetchProperties = useCallback(async () => {
    try {
      const response = await fetch("/api/properties")
      if (response.ok) {
        const data = await response.json()
        setProperties(data.properties || [])
      }
    } catch (error) {
      console.error("Error fetching properties:", error)
    }
  }, [])

  const handleToggleBuyer = (customerId: string) => {
    const id = String(customerId)
    setFormData((prev) => {
      const currentIds = prev.buyer_ids || []
      const isSelected = currentIds.includes(id)
      return {
        ...prev,
        buyer_ids: isSelected ? currentIds.filter((i) => i !== id) : [...currentIds, id],
      }
    })
  }

  const handleToggleSeller = (customerId: string) => {
    const id = String(customerId)
    setFormData((prev) => {
      const currentIds = prev.seller_ids || []
      const isSelected = currentIds.includes(id)
      return {
        ...prev,
        seller_ids: isSelected ? currentIds.filter((i) => i !== id) : [...currentIds, id],
      }
    })
  }

  const getCustomerNameById = (id: string): string => {
    const customer = customers.find((c) => c.id === id)
    return customer ? formatCustomerName(customer) : "Unknown"
  }

  const formatAgentName = (agent: Agent): string => {
    const firstName = String(agent.first_name || "")
    const middleName = agent.middle_name ? String(agent.middle_name) : ""
    const lastName = String(agent.last_name || "")
    return [firstName, middleName, lastName].filter(Boolean).join(" ").trim() || "Unknown"
  }

  const filteredBuyers = customers.filter((customer) => {
    if (!buyerSearch) return true
    const searchLower = buyerSearch.toLowerCase()
    const fullName = formatCustomerName(customer).toLowerCase()
    return (
      fullName.includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower)
    )
  })

  const filteredSellers = customers.filter((customer) => {
    if (!sellerSearch) return true
    const searchLower = sellerSearch.toLowerCase()
    const fullName = formatCustomerName(customer).toLowerCase()
    return (
      fullName.includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower)
    )
  })

  const isFormValid = () => {
    // Required fields: transaction_type, at least one buyer OR seller, property, and contract date
    const hasTransactionType = formData.transaction_type.trim() !== ""
    const hasProperty = formData.property_id !== null && formData.property_id !== ""
    const hasContractDate = formData.contract_date !== null && formData.contract_date !== ""

    // Conditional requirements based on transaction type
    if (formData.transaction_type === "purchase") {
      // For purchases, buyers are required
      return hasTransactionType && formData.buyer_ids.length > 0 && hasProperty && hasContractDate
    } else if (formData.transaction_type === "sale") {
      // For sales, sellers are required
      return hasTransactionType && formData.seller_ids.length > 0 && hasProperty && hasContractDate
    } else {
      // For other types (lease, etc.), require both
      return (
        hasTransactionType &&
        formData.buyer_ids.length > 0 &&
        formData.seller_ids.length > 0 &&
        hasProperty &&
        hasContractDate
      )
    }
  }

  return (
    <div className="space-y-6">
      {dataLoaded && (
        <>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/transactions">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{transactionId ? "Edit Transaction" : "New Transaction"}</h1>
              <p className="text-muted-foreground">
                {transactionId ? "Update transaction details" : "Create a new real estate transaction"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="parties">Parties</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="dates">Key Dates</TabsTrigger>
              </TabsList>

              <TabsContent value="basic">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Enter the basic details of the transaction</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="transaction_type">Transaction Type *</Label>
                        <Select
                          value={formData.transaction_type}
                          onValueChange={(value) => setFormData({ ...formData, transaction_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sale">Sale</SelectItem>
                            <SelectItem value="purchase">Purchase</SelectItem>
                            <SelectItem value="lease">Lease</SelectItem>
                            <SelectItem value="rental">Rental</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={formData.priority}
                          onValueChange={(value) => setFormData({ ...formData, priority: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="property_id">Property</Label>
                        <div className="flex gap-2">
                          <Select
                            value={formData.property_id}
                            onValueChange={(value) => setFormData({ ...formData, property_id: value })}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select property" />
                            </SelectTrigger>
                            <SelectContent>
                              {properties.map((property) => (
                                <SelectItem key={property.id} value={property.id}>
                                  {property.address}, {property.city}, {property.state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setPropertyModalOpen(true)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={4}
                        placeholder="Additional notes about this transaction"
                      />
                    </div>

{transactionId && (
  <div className="pt-4">
  <DocumentManager transactionId={transactionId} transactionStatus={formData.status} />
  </div>
  )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="parties">
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Parties</CardTitle>
                    <CardDescription>Select the parties involved in this transaction</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Buyers Selection */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>
                          Buyers{" "}
                          {formData.transaction_type === "purchase" || formData.transaction_type === "lease" ? "*" : ""}
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => setClientModalOpen(true)}>
                          <Plus className="h-4 w-4 mr-1" /> Add New Client
                        </Button>
                      </div>

                      {formData.buyer_ids.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted rounded-md">
                          {formData.buyer_ids.map((id) => (
                            <span
                              key={`buyer-badge-${id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground text-sm rounded-md"
                            >
                              {getCustomerNameById(id)}
                              <button
                                type="button"
                                onClick={() => handleToggleBuyer(id)}
                                className="hover:bg-primary-foreground/20 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search buyers by name, email, or phone..."
                          value={buyerSearch}
                          onChange={(e) => setBuyerSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>

                      <div className="border rounded-md max-h-48 overflow-y-auto">
                        {filteredBuyers.length === 0 ? (
                          <p className="p-4 text-center text-muted-foreground">
                            {buyerSearch
                              ? "No clients found matching your search."
                              : "No clients available. Add a new client first."}
                          </p>
                        ) : (
                          filteredBuyers.map((customer) => {
                            const isSelected = formData.buyer_ids.includes(customer.id)
                            return (
                              <div
                                key={`buyer-${customer.id}`}
                                className={`flex items-center justify-between px-3 py-2 cursor-pointer border-b last:border-b-0 transition-colors ${
                                  isSelected ? "bg-primary/10" : "hover:bg-accent"
                                }`}
                                onClick={() => handleToggleBuyer(customer.id)}
                              >
                                <span className="text-sm">{formatCustomerName(customer)}</span>
                                {isSelected && <Check className="h-4 w-4 text-primary" />}
                              </div>
                            )
                          })
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{formData.buyer_ids.length} buyer(s) selected</p>
                    </div>

                    {/* Sellers Selection */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>
                          Sellers{" "}
                          {formData.transaction_type === "sale" || formData.transaction_type === "lease" ? "*" : ""}
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => setClientModalOpen(true)}>
                          <Plus className="h-4 w-4 mr-1" /> Add New Client
                        </Button>
                      </div>

                      {formData.seller_ids.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted rounded-md">
                          {formData.seller_ids.map((id) => (
                            <span
                              key={`seller-badge-${id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground text-sm rounded-md"
                            >
                              {getCustomerNameById(id)}
                              <button
                                type="button"
                                onClick={() => handleToggleSeller(id)}
                                className="hover:bg-primary-foreground/20 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search sellers by name, email, or phone..."
                          value={sellerSearch}
                          onChange={(e) => setSellerSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>

                      <div className="border rounded-md max-h-48 overflow-y-auto">
                        {filteredSellers.length === 0 ? (
                          <p className="p-4 text-center text-muted-foreground">
                            {sellerSearch
                              ? "No clients found matching your search."
                              : "No clients available. Add a new client first."}
                          </p>
                        ) : (
                          filteredSellers.map((customer) => {
                            const isSelected = formData.seller_ids.includes(customer.id)
                            return (
                              <div
                                key={`seller-${customer.id}`}
                                className={`flex items-center justify-between px-3 py-2 cursor-pointer border-b last:border-b-0 transition-colors ${
                                  isSelected ? "bg-primary/10" : "hover:bg-accent"
                                }`}
                                onClick={() => handleToggleSeller(customer.id)}
                              >
                                <span className="text-sm">{formatCustomerName(customer)}</span>
                                {isSelected && <Check className="h-4 w-4 text-primary" />}
                              </div>
                            )
                          })
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{formData.seller_ids.length} seller(s) selected</p>
                    </div>

                    {/* Agents Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="listing_agent_id">Listing Agent</Label>
                        <div className="flex gap-2">
                          <Select
                            value={formData.listing_agent_id}
                            onValueChange={(value) => setFormData({ ...formData, listing_agent_id: value })}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select listing agent" />
                            </SelectTrigger>
                            <SelectContent>
                              {agents.map((agent) => (
                                <SelectItem key={agent.id} value={agent.id}>
                                  {formatAgentName(agent)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="outline" size="icon" onClick={() => setAgentModalOpen(true)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="co_listing_agent_id">Co-listing Agent</Label>
                        <div className="flex gap-2">
                          <Select
                            value={formData.co_listing_agent_id}
                            onValueChange={(value) => setFormData({ ...formData, co_listing_agent_id: value })}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select co-listing agent" />
                            </SelectTrigger>
                            <SelectContent>
                              {agents.map((agent) => (
                                <SelectItem key={agent.id} value={agent.id}>
                                  {formatAgentName(agent)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="outline" size="icon" onClick={() => setAgentModalOpen(true)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="buyer_agent_id">Buyer Agent</Label>
                        <div className="flex gap-2">
                          <Select
                            value={formData.buyer_agent_id}
                            onValueChange={(value) => setFormData({ ...formData, buyer_agent_id: value })}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select buyer agent" />
                            </SelectTrigger>
                            <SelectContent>
                              {agents.map((agent) => (
                                <SelectItem key={agent.id} value={agent.id}>
                                  {formatAgentName(agent)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="outline" size="icon" onClick={() => setAgentModalOpen(true)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="co_buyer_agent_id">Co-buyer Agent</Label>
                        <div className="flex gap-2">
                          <Select
                            value={formData.co_buyer_agent_id}
                            onValueChange={(value) => setFormData({ ...formData, co_buyer_agent_id: value })}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select co-buyer agent" />
                            </SelectTrigger>
                            <SelectContent>
                              {agents.map((agent) => (
                                <SelectItem key={agent.id} value={agent.id}>
                                  {formatAgentName(agent)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="outline" size="icon" onClick={() => setAgentModalOpen(true)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Lender Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="lender_id">Lender</Label>
                      <div className="flex gap-2">
                        <Select
                          value={formData.lender_id}
                          onValueChange={(value) => setFormData({ ...formData, lender_id: value })}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select lender" />
                          </SelectTrigger>
                          <SelectContent>
                        {lenders.map((lender) => {
                          const primaryContact = lender.contacts?.find((c) => c.is_primary) || lender.contacts?.[0]
                          const contactDisplay = primaryContact?.contact_name || lender.contact_name || ""
                          return (
                            <SelectItem key={lender.id} value={lender.id}>
                              {lender.company_name}{contactDisplay ? ` - ${contactDisplay}` : ""}
                            </SelectItem>
                          )
                        })}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" onClick={() => setLenderModalOpen(true)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Attorney Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="attorney_id">Attorney</Label>
                      <div className="flex gap-2">
                        <Select
                          value={formData.attorney_id}
                          onValueChange={(value) => setFormData({ ...formData, attorney_id: value })}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select attorney" />
                          </SelectTrigger>
                          <SelectContent>
                        {attorneys.map((attorney) => {
                          const primaryContact = attorney.contacts?.find((c) => c.is_primary) || attorney.contacts?.[0]
                          const contactDisplay = primaryContact?.contact_name || attorney.attorney_name || ""
                          return (
                            <SelectItem key={attorney.id} value={attorney.id}>
                              {attorney.firm_name}{contactDisplay ? ` - ${contactDisplay}` : ""}
                            </SelectItem>
                          )
                        })}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" onClick={() => setAttorneyModalOpen(true)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financial">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Details</CardTitle>
                    <CardDescription>Enter the financial information for this transaction</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="purchase_price">Purchase Price ($)</Label>
                        <Input
                          id="purchase_price"
                          type="number"
                          step="0.01"
                          value={formData.purchase_price}
                          onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="earnest_money">Earnest Money ($)</Label>
                        <Input
                          id="earnest_money"
                          type="number"
                          step="0.01"
                          value={formData.earnest_money}
                          onChange={(e) => setFormData({ ...formData, earnest_money: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="seller_commission_rate">Seller Commission Rate (%)</Label>
                        <Input
                          id="seller_commission_rate"
                          type="number"
                          step="0.01"
                          value={formData.seller_commission_rate}
                          onChange={(e) => setFormData({ ...formData, seller_commission_rate: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="buyer_commission_rate">Buyer Commission Rate (%)</Label>
                        <Input
                          id="buyer_commission_rate"
                          type="number"
                          step="0.01"
                          value={formData.buyer_commission_rate}
                          onChange={(e) => setFormData({ ...formData, buyer_commission_rate: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="commission_rate">Total Commission Rate (%) - Readonly</Label>
                        <Input
                          id="commission_rate"
                          type="number"
                          step="0.01"
                          value={formData.commission_rate}
                          readOnly
                          className="bg-muted"
                          placeholder="Auto-calculated"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="due_diligence_money">Due Diligence Money ($)</Label>
                        <Input
                          id="due_diligence_money"
                          type="number"
                          step="0.01"
                          value={formData.due_diligence_money}
                          onChange={(e) => setFormData({ ...formData, due_diligence_money: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="brokerage_fee">Brokerage Fee ($)</Label>
                        <Input
                          id="brokerage_fee"
                          type="number"
                          step="0.01"
                          value={formData.brokerage_fee}
                          onChange={(e) => setFormData({ ...formData, brokerage_fee: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="commission_flat_fee">Commission Flat Fee ($)</Label>
                        <Input
                          id="commission_flat_fee"
                          type="number"
                          step="0.01"
                          value={formData.commission_flat_fee}
                          onChange={(e) => setFormData({ ...formData, commission_flat_fee: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="closing_fee">Closing Fee ($)</Label>
                        <Input
                          id="closing_fee"
                          type="number"
                          step="0.01"
                          value={formData.closing_fee}
                          onChange={(e) => setFormData({ ...formData, closing_fee: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Loan Info Section */}
                    <div className="pt-6 border-t">
                      <h3 className="text-lg font-semibold mb-4">Loan Info</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="down_payment">Down Payment ($)</Label>
                          <Input
                            id="down_payment"
                            type="number"
                            step="0.01"
                            value={formData.down_payment}
                            onChange={(e) => setFormData({ ...formData, down_payment: e.target.value })}
                            placeholder="0.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="loan_type">Loan Type</Label>
                          <Select
                            value={formData.loan_type}
                            onValueChange={(value) => setFormData({ ...formData, loan_type: value })}
                          >
                            <SelectTrigger id="loan_type">
                              <SelectValue placeholder="Select loan type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="conventional">Conventional</SelectItem>
                              <SelectItem value="usda">USDA</SelectItem>
                              <SelectItem value="fha">FHA</SelectItem>
                              <SelectItem value="dscr">DSCR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="rate">Interest Rate (%)</Label>
                          <Input
                            id="rate"
                            type="number"
                            step="0.0001"
                            value={formData.rate}
                            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                            placeholder="0.0000"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dates" className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contract_date">Contract Date</Label>
                      <DateInput
                        id="contract_date"
                        value={formData.contract_date}
                        onChange={(value) => setFormData({ ...formData, contract_date: value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="closing_date">Closing Date</Label>
                      <DateInput
                        id="closing_date"
                        value={formData.closing_date}
                        onChange={(value) => setFormData({ ...formData, closing_date: value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="due_diligence_date">Due Diligence Date</Label>
                      <DateInput
                        id="due_diligence_date"
                        value={formData.due_diligence_date}
                        onChange={(value) => setFormData({ ...formData, due_diligence_date: value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inspection_date">Inspection Date</Label>
                      <DateInput
                        id="inspection_date"
                        value={formData.inspection_date}
                        onChange={(value) => setFormData({ ...formData, inspection_date: value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="appraisal_date">Appraisal Date</Label>
                      <DateInput
                        id="appraisal_date"
                        value={formData.appraisal_date}
                        onChange={(value) => setFormData({ ...formData, appraisal_date: value })}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-4 mt-6">
              <Link href="/dashboard/transactions">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading || !isFormValid()}>
                {loading ? "Saving..." : transactionId ? "Update Transaction" : "Create Transaction"}
              </Button>
            </div>
          </form>

          {/* Floating Save Button */}
          {transactionId && (
            <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50">
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  const form = document.querySelector('form') as HTMLFormElement
                  if (form) {
                    form.requestSubmit()
                  }
                }}
                disabled={loading || !isFormValid()}
                className="shadow-lg hover:shadow-xl transition-shadow"
              >
                {loading ? "Saving..." : "Update Transaction"}
              </Button>
            </div>
          )}
        </>
      )}
      {/* Modals */}
      <ClientModal
        open={clientModalOpen}
        onOpenChange={setClientModalOpen}
        onSuccess={() => {
          fetchCustomers()
          setClientModalOpen(false)
        }}
      />
      <AgentModal
        open={agentModalOpen}
        onOpenChange={setAgentModalOpen}
        onSuccess={() => {
          fetchAgents()
          setAgentModalOpen(false)
        }}
      />
      <LenderModal
        open={lenderModalOpen}
        onOpenChange={setLenderModalOpen}
        onSuccess={() => {
          fetchLenders()
          setLenderModalOpen(false)
        }}
      />
      <AttorneyModal
        open={attorneyModalOpen}
        onOpenChange={setAttorneyModalOpen}
        onSuccess={() => {
          fetchAttorneys()
          setAttorneyModalOpen(false)
        }}
      />
      <PropertyModal
        open={propertyModalOpen}
        onOpenChange={setPropertyModalOpen}
        onSuccess={() => {
          fetchProperties()
          setPropertyModalOpen(false)
        }}
      />
    </div>
  )
}

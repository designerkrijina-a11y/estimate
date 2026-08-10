import { redirect, notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"
import { DEFAULT_PRICING, mergePricing } from "@/lib/pricing"
import { AdminQuoteView, type EstimateRequestDetail } from "@/components/admin-quote-view"

export const dynamic = "force-dynamic"

export default async function AdminEstimateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const currentUser = await getCurrentUser()
  if (!currentUser) redirect("/admin/login")

  const supabase = createAdminClient()
  const [{ data: request }, { data: pricingRow }] = await Promise.all([
    supabase.from("estimate_requests").select("*").eq("id", id).single(),
    supabase.from("pricing_config").select("config").eq("id", 1).single(),
  ])

  if (!request) notFound()

  const pricing = pricingRow?.config ? mergePricing(pricingRow.config) : DEFAULT_PRICING

  return (
    <main className="min-h-screen bg-background text-foreground print:min-h-0">
      <div className="mx-auto max-w-6xl px-4 py-10 print:py-2 md:px-8">
        <AdminQuoteView request={request as EstimateRequestDetail} pricing={pricing} />
      </div>
    </main>
  )
}

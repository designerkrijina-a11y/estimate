import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function AdminPricingRedirectPage() {
  redirect("https://estimate-hub-nine.vercel.app/admin/pricing/office")
}

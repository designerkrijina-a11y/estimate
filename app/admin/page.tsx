import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function AdminRedirectPage() {
  redirect("https://estimate-hub-nine.vercel.app/admin?category=office")
}

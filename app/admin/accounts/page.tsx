import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function AdminAccountsRedirectPage() {
  redirect("https://estimate-hub-nine.vercel.app/admin/accounts")
}

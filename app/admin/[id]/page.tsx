import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AdminDetailRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`https://estimate-hub-nine.vercel.app/admin/office/${id}`)
}

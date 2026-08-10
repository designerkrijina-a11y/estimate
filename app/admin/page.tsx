import Link from "next/link"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"
import { logout } from "./login/actions"
import { AdminExportButton } from "@/components/admin-export-button"

export const dynamic = "force-dynamic"

type EstimateRequest = {
  id: string
  created_at: string
  pyeong: number | null
  area_sqm: number | null
  employee_count: number | null
  building_grade: string | null
  finish_grade: string | null
  construction_type: string | null
  construction_time: string | null
  estimated_price: number | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
}

const numberFmt = new Intl.NumberFormat("ko-KR")

function formatPrice(value: number | null) {
  if (value == null) return "-"
  return `${numberFmt.format(value)}원`
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return <span className="text-muted-foreground">-</span>
  const styles: Record<string, string> = {
    A: "bg-primary/10 text-primary",
    B: "bg-accent text-accent-foreground",
    C: "bg-muted text-muted-foreground",
  }
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
        styles[grade] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {grade}
    </span>
  )
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; pyeong?: string; contact?: string }>
}) {
  const params = await searchParams
  const from = params.from ?? ""
  const to = params.to ?? ""
  const pyeong = params.pyeong ?? ""
  const contact = params.contact ?? ""

  const currentUser = await getCurrentUser()
  if (!currentUser) redirect("/admin/login")

  const isSuperAdmin = currentUser.role === "super_admin"
  const canManagePricing = currentUser.role === "super_admin" || currentUser.role === "admin"

  const supabase = createAdminClient()

  let query = supabase.from("estimate_requests").select("*").order("created_at", { ascending: false })
  if (from) query = query.gte("created_at", `${from}T00:00:00`)
  if (to) query = query.lte("created_at", `${to}T23:59:59`)
  if (pyeong) query = query.eq("pyeong", Number(pyeong))
  if (contact) query = query.ilike("contact_name", `%${contact}%`)

  const { data, error } = await query

  const rows = (data ?? []) as EstimateRequest[]
  const hasFilter = Boolean(from || to || pyeong || contact)

  const totalCount = rows.length
  const avgPrice =
    rows.length > 0
      ? rows.reduce((sum, r) => sum + (r.estimated_price ?? 0), 0) / rows.length
      : 0

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-primary">오피스 인테리어</p>
            <h1 className="text-pretty text-3xl font-bold tracking-tight">견적 요청 관리 보드</h1>
            <p className="text-muted-foreground">접수된 견적 요청을 최신순으로 확인하세요.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-sm text-muted-foreground">{currentUser.name}님</span>
            {canManagePricing && (
              <Link
                href="/admin/pricing"
                className="whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
              >
                단가관리
              </Link>
            )}
            {isSuperAdmin && (
              <Link
                href="/admin/accounts"
                className="whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
              >
                계정관리
              </Link>
            )}
            <form action={logout}>
              <button
                type="submit"
                className="whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
              >
                로그아웃
              </button>
            </form>
          </div>
        </header>

        <form
          method="GET"
          className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="from">
              시작일
            </label>
            <input
              id="from"
              type="date"
              name="from"
              defaultValue={from}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="to">
              종료일
            </label>
            <input
              id="to"
              type="date"
              name="to"
              defaultValue={to}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="pyeong">
              평수
            </label>
            <input
              id="pyeong"
              type="number"
              name="pyeong"
              defaultValue={pyeong}
              placeholder="예: 50"
              className="w-24 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="contact">
              담당자 / 회사명
            </label>
            <input
              id="contact"
              type="text"
              name="contact"
              defaultValue={contact}
              placeholder="검색어 입력"
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            검색
          </button>
          {hasFilter && (
            <a
              href="/admin"
              className="rounded-md border border-border px-4 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            >
              초기화
            </a>
          )}
          <div className="ml-auto">
            <AdminExportButton rows={rows} />
          </div>
        </form>

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{hasFilter ? "검색된 요청 건수" : "총 요청 건수"}</p>
            <p className="mt-1 text-2xl font-bold">{numberFmt.format(totalCount)}건</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">평균 견적 금액</p>
            <p className="mt-1 text-2xl font-bold">{formatPrice(Math.round(avgPrice))}</p>
          </div>
        </section>

        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            데이터를 불러오지 못했습니다: {error.message}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
            {hasFilter ? "검색 조건에 맞는 견적 요청이 없습니다." : "아직 접수된 견적 요청이 없습니다."}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">접수일시</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">평수</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">전용면적</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">직원수</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">건물등급</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">공사유형</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">견적금액</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">담당자</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">연락처</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(row.created_at)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.pyeong != null ? `${row.pyeong}평` : "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.area_sqm != null ? `${row.area_sqm}㎡` : "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.employee_count != null ? `${row.employee_count}명` : "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <GradeBadge grade={row.building_grade} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{row.construction_type ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">{formatPrice(row.estimated_price)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.contact_name ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex flex-col">
                        <span>{row.contact_phone ?? "-"}</span>
                        {row.contact_email && (
                          <span className="text-xs text-muted-foreground">{row.contact_email}</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link href={`/admin/${row.id}`} className="font-medium text-primary hover:underline">
                        견적서 보기 →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

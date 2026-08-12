"use client"

import { useState } from "react"

type ExportRow = {
  created_at: string
  pyeong: number | null
  area_sqm: number | null
  employee_count: number | null
  building_grade: string | null
  finish_grade?: string | null
  construction_type: string | null
  construction_time?: string | null
  estimated_price: number | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
}

export function AdminExportButton({ rows }: { rows: ExportRow[] }) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const XLSX = await import("xlsx")
      const data = rows.map((r) => ({
        접수일시: new Date(r.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
        평수: r.pyeong ?? "",
        전용면적_m2: r.area_sqm ?? "",
        직원수: r.employee_count ?? "",
        건물등급: r.building_grade ?? "",
        마감등급: r.finish_grade ?? "",
        공사유형: r.construction_type ?? "",
        공사시간대: r.construction_time ?? "",
        견적금액: r.estimated_price ?? "",
        담당자_회사명: r.contact_name ?? "",
        연락처: r.contact_phone ?? "",
        이메일: r.contact_email ?? "",
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "견적요청")
      const today = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `견적요청_${today}.xlsx`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading || rows.length === 0}
      className="whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
    >
      {loading ? "생성 중..." : "엑셀 다운로드"}
    </button>
  )
}

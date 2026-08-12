"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BRAND,
  FINISH_GRADES,
  RECOMMENDED_WORK_TYPES,
  won,
  numberToKoreanWon,
  computeEstimateForGrade,
  selectedRoomItems,
  selectedWorkItems,
} from "@/lib/estimate-calc"
import { setupPrintPageBreakNotices } from "@/lib/print-pagination"
import type { PricingConfig } from "@/lib/pricing"
import type { RoomComposition } from "@/app/estimate/actions"

export type EstimateRequestDetail = {
  id: string
  created_at: string
  pyeong: number | null
  area_sqm: number | null
  employee_count: number | null
  building_grade: string | null
  finish_grade: string | null
  construction_type: string | null
  construction_time: string | null
  included_work_types: string[] | null
  room_composition: RoomComposition | null
  estimated_price: number | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
}

export function AdminQuoteView({ request, pricing }: { request: EstimateRequestDetail; pricing: PricingConfig }) {
  const areaSqm = request.area_sqm ?? 0
  const pyeongNum = request.pyeong ?? 0
  const employees = request.employee_count ?? 0
  const gradeValue = request.finish_grade ?? "중급"
  const gradeLabel = FINISH_GRADES.find((f) => f.value === gradeValue)?.label ?? gradeValue

  const recomputed = request.room_composition
    ? computeEstimateForGrade(
        gradeValue,
        {
          areaSqm,
          employees,
          buildingGrade: request.building_grade ?? "B",
          constructionTime: request.construction_time ?? "주간",
          rooms: request.room_composition,
          workTypes: new Set(request.included_work_types ?? []),
        },
        pricing
      )
    : null

  const total = request.estimated_price ?? recomputed?.total ?? 0
  const pricePerPyeong = pyeongNum > 0 ? Math.round(total / pyeongNum) : 0
  const includedWorkCount = RECOMMENDED_WORK_TYPES.length + (request.included_work_types?.length ?? 0)
  const roomItemsSelected = request.room_composition ? selectedRoomItems(request.room_composition) : []
  const workItemsSelected = selectedWorkItems(request.included_work_types ?? [])
  const createdDate = new Date(request.created_at)
  const validUntil = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000)
  const fmt = (d: Date) => d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })

  useEffect(() => {
    return setupPrintPageBreakNotices()
  }, [])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 print:gap-2">
      <div className="hidden print:mb-1 print:block">
        <img src="/ajd-logo.png" alt="아정당인테리어" className="mx-auto h-4 w-auto" />
      </div>
      <div className="flex items-center justify-between print:hidden">
        <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          ← 목록으로
        </Link>
        <Button type="button" variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" />
          인쇄하기
        </Button>
      </div>

      <div data-print-block className="grade-quote-block flex flex-col gap-4 print:gap-2">
        <Card
          className="overflow-hidden border-none p-0 text-white"
          style={{ background: `linear-gradient(135deg, #162163, ${BRAND})` }}
        >
          <CardContent className="flex flex-col gap-6 p-6 print:gap-1.5 print:p-3 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 print:gap-1">
              <div className="flex flex-col gap-1 print:gap-0.5">
                <p className="text-xs font-medium text-white/60 print:text-[8px]">{request.id.slice(0, 8).toUpperCase()}</p>
                <h2 className="text-2xl font-bold print:text-base md:text-3xl">{request.contact_name || "회사명 미입력"}</h2>
                <p className="text-sm text-white/70 print:text-[9px] print:leading-tight">오피스 인테리어 Fit Out · {gradeLabel}</p>
                <p className="mt-1 text-xs text-white/60 print:mt-0 print:text-[8px]">
                  연락처: {request.contact_phone || "-"} · {request.contact_email || "-"}
                </p>
              </div>
              <div className="text-right text-xs text-white/60 print:text-[8px]">
                <p>접수일 {fmt(createdDate)}</p>
                <p>유효기간 {fmt(validUntil)}</p>
              </div>
            </div>

            <div className="h-px bg-white/15" />

            <div>
              <p className="text-sm text-white/60 print:text-[9px]">총 공사비 (VAT 별도)</p>
              <p className="text-3xl font-bold tracking-tight print:text-lg md:text-4xl">₩{won.format(total)}</p>
              <p className="mt-1 text-sm text-white/60 print:mt-0 print:text-[8px]">{numberToKoreanWon(total)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 print:gap-1 sm:grid-cols-4">
              <div className="rounded-lg bg-white/10 p-3 print:p-1">
                <p className="text-xs text-white/60 print:text-[8px] print:leading-tight">전용면적</p>
                <p className="text-sm font-semibold print:text-[10px] print:leading-tight">{won.format(pyeongNum)}평</p>
                <p className="text-xs text-white/50 print:text-[7px] print:leading-tight">{won.format(areaSqm)}㎡</p>
              </div>
              <div className="rounded-lg bg-white/10 p-3 print:p-1">
                <p className="text-xs text-white/60 print:text-[8px] print:leading-tight">평당 단가</p>
                <p className="text-sm font-semibold print:text-[10px] print:leading-tight">
                  {won.format(Math.round(pricePerPyeong / 10_000))}만원
                </p>
                <p className="text-xs text-white/50 print:text-[7px] print:leading-tight">원/평</p>
              </div>
              <div className="rounded-lg bg-white/10 p-3 print:p-1">
                <p className="text-xs text-white/60 print:text-[8px] print:leading-tight">마감등급</p>
                <p className="text-sm font-semibold print:text-[10px] print:leading-tight">{gradeLabel}</p>
                <p className="text-xs text-white/50 print:text-[7px] print:leading-tight">마감 기준</p>
              </div>
              <div className="rounded-lg bg-white/10 p-3 print:p-1">
                <p className="text-xs text-white/60 print:text-[8px] print:leading-tight">포함 공정</p>
                <p className="text-sm font-semibold print:text-[10px] print:leading-tight">{includedWorkCount}개</p>
                <p className="text-xs text-white/50 print:text-[7px] print:leading-tight">공정 산출</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {recomputed && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base print:text-xs">주요 공정 비중</CardTitle>
              <CardDescription>
                전체 항목 중 비중이 큰 상위 {recomputed.topCategories.length}개 (현재 단가 기준 재계산)
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 print:gap-2">
              {recomputed.topCategories.map((c, i) => (
                <div key={c.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className="flex size-5 items-center justify-center rounded-full text-xs text-white"
                        style={{ backgroundColor: BRAND }}
                      >
                        {i + 1}
                      </span>
                      {c.label}
                    </span>
                    <span className="font-semibold" style={{ color: BRAND }}>
                      {c.pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${c.pct}%`, backgroundColor: BRAND }} />
                  </div>
                </div>
              ))}
              {recomputed.total !== total && (
                <p className="mt-1 text-xs leading-relaxed text-amber-600 dark:text-amber-400">
                  ⚠ 접수 시점 견적금액(₩{won.format(total)})과 현재 단가 기준으로 다시 계산한 금액(₩
                  {won.format(recomputed.total)})이 달라요 — 접수 이후 단가관리에서 단가가 변경된 것으로 보입니다.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base print:text-xs">견적 산출 기준</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 print:gap-1 sm:grid-cols-3">
            {[
              { label: "전용면적", value: `${won.format(areaSqm)}㎡ (${won.format(pyeongNum)}평)` },
              { label: "직원 수", value: `${employees}명` },
              { label: "건물등급", value: request.building_grade ? `${request.building_grade}급` : "-" },
              { label: "마감등급", value: gradeLabel },
              { label: "공사유형", value: request.construction_type ?? "-" },
              { label: "공사시간대", value: request.construction_time ?? "주간" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border p-3 print:p-1.5">
                <p className="text-xs text-muted-foreground print:text-[9px] print:leading-tight">{item.label}</p>
                <p className="text-sm font-semibold print:text-xs print:leading-tight">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {roomItemsSelected.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base print:text-xs">선택하신 공간 구성</CardTitle>
              <CardDescription>견적 산출에 반영된 공간별 구성 내역입니다.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {roomItemsSelected.map((item) => (
                <span
                  key={item.key}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs print:px-1.5 print:py-0.5 print:text-[9px]"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.count != null && <span className="font-semibold">× {item.count}</span>}
                </span>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base print:text-xs">포함된 공종</CardTitle>
            <CardDescription>기본 포함 공정과 추가로 선택하신 공종입니다.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {workItemsSelected.map((item) => (
              <span
                key={item.key}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs print:px-1.5 print:py-0.5 print:text-[9px] ${
                  item.base ? "border-border bg-muted/40" : "border-primary/30 bg-primary/10 text-primary"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {!item.base && <span className="text-[10px] print:text-[8px]">(선택)</span>}
              </span>
            ))}
          </CardContent>
        </Card>

        <p
          data-print-break-notice
          className="hidden text-center text-[10px] font-semibold tracking-wide text-muted-foreground print:break-after-avoid"
        >
          — 다음 장으로 이어집니다 —
        </p>

        <Card data-print-break-anchor className="print:break-inside-avoid">
          <CardHeader>
            <CardTitle className="text-base print:text-xs">참고사항</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1.5 print:gap-0.5 text-xs leading-relaxed text-muted-foreground print:text-[9px] print:leading-snug">
              <li>· 본 견적서는 자동 산출 결과로, 실제 시공 금액과 차이가 발생할 수 있습니다.</li>
              <li>· VAT(부가가치세) 별도 기준입니다.</li>
              <li>· 견적 유효기간: 접수일로부터 30일 ({fmt(validUntil)})</li>
              <li>· 자재비 및 인건비는 시장 변동에 따라 단가가 변동될 수 있습니다.</li>
              <li>· 정확한 견적은 현장 실측 후 담당자와 협의하시기 바랍니다.</li>
            </ul>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          본 견적서는 자동 생성되었으며, 정식 계약 전 참고용입니다.
        </p>
      </div>
    </div>
  )
}

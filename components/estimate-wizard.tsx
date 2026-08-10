"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, Users, CheckCircle2, ArrowLeft, ArrowRight, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { submitEstimate, type RoomComposition } from "@/app/estimate/actions"
import { DEFAULT_PRICING, type PricingConfig } from "@/lib/pricing"
import {
  BRAND,
  FINISH_GRADES,
  RECOMMENDED_WORK_TYPES,
  OPTIONAL_WORK_TYPES,
  EXECUTIVE_ROOMS,
  MEETING_ROOMS,
  SMALL_ROOMS,
  ROOM_TOGGLES,
  won,
  numberToKoreanWon,
  computeEstimateForGrade,
  type EstimateContext,
} from "@/lib/estimate-calc"

const PYEONG_TO_SQM = 3.3

const STEPS = ["기본 정보", "공간 구성", "공종 선택", "추가 질문", "연락처"] as const

const BUILDING_GRADES = [
  { value: "A", icon: "🏆", label: "A급 프리미엄", desc: "앵커원·파르나스·서울스퀘어 등 초고층 프라임 오피스" },
  { value: "B", icon: "🏢", label: "B급 일반 오피스", desc: "ISUFIVE·지식산업센터 등 표준 오피스 건물" },
  { value: "C", icon: "🏗️", label: "C급 일반 건물", desc: "구형 상가·공장 사옥·지방 오피스 등" },
] as const

const CONSTRUCTION_TYPES = [
  { value: "신규", icon: "✨", label: "신규 인테리어", desc: "기존 내장재 없이 새로 시공" },
  { value: "리모델링", icon: "🔄", label: "리모델링", desc: "기존 인테리어 철거 후 재시공" },
] as const

// 아정당 인테리어 실제 시공 사례 사진 (landing.ajd.co.kr/interior/portfolio/commercial, 사무실 카테고리)
// 확대컷 제외, 전체 공간이 보이는 사진 위주로 선정
const FINISH_GRADE_IMAGES: Record<string, string[]> = {
  초급: [
    // 강남 'I'사 오피스 (53평)
    "https://pub-8e77b76eec1b4e0987970dbd7b7777d7.r2.dev/photos/commercial/cmpc5lw1i/cmpc5lw1i-up-mpc5ue33-1svxam.jpg",
    "https://pub-8e77b76eec1b4e0987970dbd7b7777d7.r2.dev/photos/commercial/cmpc5lw1i/cmpc5lw1i-up-mpzbewrz-xu7pp6.jpg",
    "https://pub-8e77b76eec1b4e0987970dbd7b7777d7.r2.dev/photos/commercial/cmpc5lw1i/cmpc5lw1i-up-mpc5u6h1-wzgdnr.jpg",
    "https://pub-8e77b76eec1b4e0987970dbd7b7777d7.r2.dev/photos/commercial/cmpc5lw1i/cmpc5lw1i-up-mpc5ulbz-bjf70r.jpg",
  ],
  중급: [
    // 대구 'A'사 오피스 (230평)
    "https://pub-8e77b76eec1b4e0987970dbd7b7777d7.r2.dev/photos/commercial/cmpfanbcz/cmpfanbcz-up-mpfapwvj-ityg7n.jpg",
    "https://pub-8e77b76eec1b4e0987970dbd7b7777d7.r2.dev/photos/commercial/cmpfanbcz/cmpfanbcz-up-mpfappic-s83kjn.jpg",
    // 관악 'A'사 오피스 (30평)
    "https://pub-8e77b76eec1b4e0987970dbd7b7777d7.r2.dev/photos/commercial/cmpc7i7lj/cmpc7i7lj-up-mpc7o3nq-ch3kg2.jpg",
    "https://pub-8e77b76eec1b4e0987970dbd7b7777d7.r2.dev/photos/commercial/cmpc7i7lj/cmpc7i7lj-up-mpc7o3ns-qhsyms.jpg",
  ],
  고급: [
    // 판교 'M' 사 스튜디오 라운지 (24평)
    "https://pub-8e77b76eec1b4e0987970dbd7b7777d7.r2.dev/photos/commercial/cmpc7r6zo/cmpc7r6zo-up-mpc7wpc6-a50lsn.jpg",
    "https://pub-8e77b76eec1b4e0987970dbd7b7777d7.r2.dev/photos/commercial/cmpc7r6zo/cmpc7r6zo-up-mpc7z5b0-n9wwl3.jpg",
    "https://pub-8e77b76eec1b4e0987970dbd7b7777d7.r2.dev/photos/commercial/cmpc7r6zo/cmpc7r6zo-up-mpc7z5ft-w1dp5j.jpg",
    "https://pub-8e77b76eec1b4e0987970dbd7b7777d7.r2.dev/photos/commercial/cmpc7r6zo/cmpc7r6zo-up-mpc7z5dd-iiwc81.jpg",
  ],
  프리미엄: [
    // 강남 'H' 사 오피스 라운지 (39평)
    "https://pub-8e77b76eec1b4e0987970dbd7b7777d7.r2.dev/photos/commercial/cmpc8cx9u/cmpc8cx9u-up-mpc8l9om-9re0p9.jpg",
    "https://pub-8e77b76eec1b4e0987970dbd7b7777d7.r2.dev/photos/commercial/cmpc8cx9u/cmpc8cx9u-up-mpc8l9nu-2tyn0w.jpg",
    "https://pub-8e77b76eec1b4e0987970dbd7b7777d7.r2.dev/photos/commercial/cmpc8cx9u/cmpc8cx9u-up-mpc8l9ma-endij5.jpg",
    "https://pub-8e77b76eec1b4e0987970dbd7b7777d7.r2.dev/photos/commercial/cmpc8cx9u/cmpc8cx9u-up-mpc8l9oo-01iiie.jpg",
  ],
}

// 마감등급 선택 여부와 무관하게 항상 이 순서(초급→중급→고급→프리미엄)로 전체 16장이 순환 재생됨
const ALL_OFFICE_IMAGES = Object.values(FINISH_GRADE_IMAGES).flat()

const CONSTRUCTION_TIMES = [
  { value: "주간", icon: "☀️", label: "주간 공사", desc: "평일 09:00~18:00 기준 (기본 단가)" },
  { value: "부분야간", icon: "🌆", label: "부분 야간", desc: "소음·분진 작업만 야간 (노무비 할증)" },
  { value: "전면야간", icon: "🌙", label: "전면 야간", desc: "평일 22:00~익일 06:00 (노무비 할증)" },
  { value: "주말야간", icon: "🌃", label: "주말·고강도 야간", desc: "주말 주야간 + 평일 야간 (노무비 할증)" },
] as const

const ROOM_COUNTERS = [...EXECUTIVE_ROOMS, ...MEETING_ROOMS, ...SMALL_ROOMS]

function generateEstimateNumber() {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const dd = String(now.getDate()).padStart(2, "0")
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `EST-${yy}${mm}${dd}-${rand}`
}

type BuildingGrade = (typeof BUILDING_GRADES)[number]["value"]
type ConstructionType = (typeof CONSTRUCTION_TYPES)[number]["value"]
type FinishGrade = (typeof FINISH_GRADES)[number]["value"]
type ConstructionTime = (typeof CONSTRUCTION_TIMES)[number]["value"]

const initialRooms: RoomComposition = {
  executive: 0,
  meetingLarge: 0,
  meetingMid: 1,
  meetingSmall: 1,
  lounge: false,
  studio: false,
  oaRoom: false,
  serverRoom: false,
  phoneBooth: 0,
  storage: 1,
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function FinishGradeGallery() {
  // 최초 렌더(서버)는 고정 순서로 그려 하이드레이션 불일치를 피하고,
  // 마운트 직후(클라이언트) 한 번 섞어서 새로고침할 때마다 다른 순서로 보이게 함
  const [images, setImages] = useState(ALL_OFFICE_IMAGES)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setImages(shuffleArray(ALL_OFFICE_IMAGES))
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [images.length])

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
      <img
        src={images[index] || "/placeholder.svg"}
        alt="아정당인테리어 오피스 시공 사례"
        className="h-64 w-full object-cover sm:h-80"
      />
      <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
        시공 사례 · {index + 1}/{images.length}
      </div>
      <button
        type="button"
        onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
        className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg text-foreground shadow hover:bg-white"
        aria-label="이전 이미지"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => setIndex((i) => (i + 1) % images.length)}
        className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg text-foreground shadow hover:bg-white"
        aria-label="다음 이미지"
      >
        ›
      </button>
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {images.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  )
}

export function EstimateWizard({ pricing = DEFAULT_PRICING }: { pricing?: PricingConfig }) {
  const [step, setStep] = useState(0)

  const [pyeong, setPyeong] = useState("50")
  const [sqm, setSqm] = useState((50 * PYEONG_TO_SQM).toFixed(1))
  const [employeeCount, setEmployeeCount] = useState("20")
  const [buildingGrade, setBuildingGrade] = useState<BuildingGrade>("B")
  const [constructionType, setConstructionType] = useState<ConstructionType>("신규")

  const [rooms, setRooms] = useState<RoomComposition>(initialRooms)

  const [finishGrades, setFinishGrades] = useState<Set<FinishGrade>>(new Set())
  const [workTypes, setWorkTypes] = useState<Set<string>>(new Set())

  const [constructionTime, setConstructionTime] = useState<ConstructionTime | "">("")

  const [companyName, setCompanyName] = useState("")
  const [position, setPosition] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [estimateNumber, setEstimateNumber] = useState("")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [stepError, setStepError] = useState<string | null>(null)

  function handlePyeongChange(v: string) {
    setPyeong(v)
    const n = Number.parseFloat(v)
    setSqm(Number.isFinite(n) ? (n * PYEONG_TO_SQM).toFixed(1) : "")
  }

  function handleSqmChange(v: string) {
    setSqm(v)
    const n = Number.parseFloat(v)
    setPyeong(Number.isFinite(n) ? (n / PYEONG_TO_SQM).toFixed(1) : "")
  }

  const areaSqm = Number.parseFloat(sqm) || 0
  const pyeongNum = Number.parseFloat(pyeong) || 0
  const employees = Number.parseInt(employeeCount, 10) || 0

  function toggleFinishGrade(value: FinishGrade) {
    setFinishGrades((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  function toggleWorkType(key: string) {
    setWorkTypes((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function selectAllOptional() {
    setWorkTypes(new Set(OPTIONAL_WORK_TYPES.map((w) => w.key)))
  }

  function selectNoneOptional() {
    setWorkTypes(new Set())
  }

  function updateRoomCount(key: keyof RoomComposition, delta: number) {
    setRooms((prev) => {
      const current = prev[key]
      if (typeof current !== "number") return prev
      const nextValue = Math.max(0, current + delta)
      return { ...prev, [key]: nextValue }
    })
  }

  function toggleRoom(key: keyof RoomComposition) {
    setRooms((prev) => {
      const current = prev[key]
      if (typeof current !== "boolean") return prev
      return { ...prev, [key]: !current }
    })
  }

  const includedWorkCount = RECOMMENDED_WORK_TYPES.length + workTypes.size

  const estimates = useMemo(() => {
    const ctx: EstimateContext = { areaSqm, employees, buildingGrade, constructionTime, rooms, workTypes }
    const grades = finishGrades.size > 0 ? Array.from(finishGrades) : ["중급" as FinishGrade]
    return grades.map((g) => computeEstimateForGrade(g, ctx, pricing))
  }, [areaSqm, employees, buildingGrade, constructionTime, rooms, workTypes, finishGrades, pricing])

  const { issueDateStr, validUntilStr } = useMemo(() => {
    const now = new Date()
    const valid = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const fmt = (d: Date) => d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
    return { issueDateStr: fmt(now), validUntilStr: fmt(valid) }
  }, [done])

  function goNext() {
    setStepError(null)
    if (step === 0) {
      if (!pyeongNum || pyeongNum <= 0) return setStepError("전용면적을 입력해주세요.")
      if (!employees || employees <= 0) return setStepError("직원 수를 1명 이상 입력해주세요.")
    }
    if (step === 2 && finishGrades.size === 0) return setStepError("마감등급을 하나 이상 선택해주세요.")
    if (step === 3 && !constructionTime) return setStepError("공사 시간대를 선택해주세요.")
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function goPrev() {
    setStepError(null)
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleFinalSubmit() {
    setStepError(null)
    if (!companyName.trim()) return setStepError("회사명을 입력해주세요.")
    if (!position.trim()) return setStepError("직급/직책을 입력해주세요.")
    if (!email.trim()) return setStepError("이메일을 입력해주세요.")
    if (!phone.trim()) return setStepError("연락처를 입력해주세요.")
    if (!consent) return setStepError("개인정보 수집 및 이용에 동의해주세요.")

    setSubmitting(true)
    setErrorMsg(null)
    const results = await Promise.all(
      estimates.map((e) =>
        submitEstimate({
          pyeong: pyeongNum,
          area_sqm: areaSqm,
          employee_count: employees,
          building_grade: buildingGrade,
          construction_type: constructionType,
          finish_grade: e.grade as FinishGrade,
          construction_time: (constructionTime || "주간") as ConstructionTime,
          included_work_types: Array.from(workTypes),
          room_composition: rooms,
          estimated_price: e.total,
          company_name: companyName.trim(),
          position: position.trim(),
          contact_phone: phone.trim(),
          contact_email: email.trim(),
          privacy_consent: consent,
        })
      )
    )
    setSubmitting(false)
    const failed = results.find((r) => !r.ok)
    if (!failed) {
      setEstimateNumber(generateEstimateNumber())
      setDone(true)
    } else {
      setErrorMsg(failed.error ?? "제출 중 오류가 발생했습니다.")
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 print:gap-2">
        <div className="hidden print:mb-2 print:block">
          <img src="/ajd-logo.png" alt="아정당인테리어" className="mx-auto h-6 w-auto" />
        </div>
        <div className="flex items-center justify-between print:hidden">
          <button
            type="button"
            onClick={() => {
              setStep(0)
              setDone(false)
            }}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            ← 처음으로 (입력값 유지)
          </button>
          <Button type="button" variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" />
            인쇄하기
          </Button>
        </div>

        {estimates.map((e, idx) => {
          const pricePerPyeong = pyeongNum > 0 ? Math.round(e.total / pyeongNum) : 0
          const gradeLabel = FINISH_GRADES.find((f) => f.value === e.grade)?.label ?? e.grade
          return (
            <div key={e.grade} className="grade-quote-block flex flex-col gap-4 print:gap-2">
              {estimates.length > 1 && (
                <p className="text-xs font-semibold text-muted-foreground print:hidden">
                  비교안 {idx + 1}/{estimates.length} · {gradeLabel}
                </p>
              )}
              <Card
                className="overflow-hidden border-none p-0 text-white"
                style={{ background: `linear-gradient(135deg, #162163, ${BRAND})` }}
              >
                <CardContent className="flex flex-col gap-6 p-6 print:gap-3 print:p-4 md:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-medium text-white/60">{estimateNumber}</p>
                      <h2 className="text-2xl font-bold print:text-xl md:text-3xl">{companyName}</h2>
                      <p className="text-sm text-white/70">오피스 인테리어 Fit Out · {gradeLabel}</p>
                      <p className="mt-1 text-xs text-white/60">
                        담당: {position} · {email}
                      </p>
                    </div>
                    <div className="text-right text-xs text-white/60">
                      <p>발행일 {issueDateStr}</p>
                      <p>유효기간 {validUntilStr}</p>
                    </div>
                  </div>

                  <div className="h-px bg-white/15" />

                  <div>
                    <p className="text-sm text-white/60">총 공사비 (VAT 별도)</p>
                    <p className="text-3xl font-bold tracking-tight print:text-2xl md:text-4xl">₩{won.format(e.total)}</p>
                    <p className="mt-1 text-sm text-white/60">{numberToKoreanWon(e.total)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 print:gap-1 sm:grid-cols-4">
                    <div className="rounded-lg bg-white/10 p-3 print:p-1.5">
                      <p className="text-xs text-white/60 print:text-[9px] print:leading-tight">전용면적</p>
                      <p className="text-sm font-semibold print:text-xs print:leading-tight">{won.format(pyeongNum)}평</p>
                      <p className="text-xs text-white/50 print:text-[8px] print:leading-tight">{won.format(areaSqm)}㎡</p>
                    </div>
                    <div className="rounded-lg bg-white/10 p-3 print:p-1.5">
                      <p className="text-xs text-white/60 print:text-[9px] print:leading-tight">평당 단가</p>
                      <p className="text-sm font-semibold print:text-xs print:leading-tight">{won.format(Math.round(pricePerPyeong / 10_000))}만원</p>
                      <p className="text-xs text-white/50 print:text-[8px] print:leading-tight">원/평</p>
                    </div>
                    <div className="rounded-lg bg-white/10 p-3 print:p-1.5">
                      <p className="text-xs text-white/60 print:text-[9px] print:leading-tight">마감등급</p>
                      <p className="text-sm font-semibold print:text-xs print:leading-tight">{gradeLabel}</p>
                      <p className="text-xs text-white/50 print:text-[8px] print:leading-tight">마감 기준</p>
                    </div>
                    <div className="rounded-lg bg-white/10 p-3 print:p-1.5">
                      <p className="text-xs text-white/60 print:text-[9px] print:leading-tight">포함 공정</p>
                      <p className="text-sm font-semibold print:text-xs print:leading-tight">{includedWorkCount}개</p>
                      <p className="text-xs text-white/50 print:text-[8px] print:leading-tight">공정 산출</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base print:text-xs">주요 공정 비중</CardTitle>
                  <CardDescription>전체 항목 중 비중이 큰 상위 {e.topCategories.length}개</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 print:gap-2">
                  {e.topCategories.map((c, i) => (
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
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    전체 항목의 상세 내역과 산출 근거는 담당자 검토 후 회신 이메일로 안내해 드립니다.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base print:text-xs">견적 산출 기준</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 print:gap-1 sm:grid-cols-3">
                  {[
                    { label: "전용면적", value: `${won.format(areaSqm)}㎡ (${won.format(pyeongNum)}평)` },
                    { label: "직원 수", value: `${employees}명` },
                    { label: "건물등급", value: `${buildingGrade}급` },
                    { label: "마감등급", value: gradeLabel },
                    { label: "공사유형", value: constructionType },
                    { label: "공사시간대", value: constructionTime || "주간" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-border p-3 print:p-1.5">
                      <p className="text-xs text-muted-foreground print:text-[9px] print:leading-tight">{item.label}</p>
                      <p className="text-sm font-semibold print:text-xs print:leading-tight">{item.value}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base print:text-xs">참고사항</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-1.5 print:gap-0.5 text-xs leading-relaxed text-muted-foreground print:text-[9px] print:leading-snug">
                    <li>· 본 견적서는 자동 산출 결과로, 실제 시공 금액과 차이가 발생할 수 있습니다.</li>
                    <li>· VAT(부가가치세) 별도 기준입니다.</li>
                    <li>· 견적 유효기간: 발행일로부터 30일 ({validUntilStr})</li>
                    <li>· 자재비 및 인건비는 시장 변동에 따라 단가가 변동될 수 있습니다.</li>
                    <li>· 정확한 견적은 현장 실측 후 담당자와 협의하시기 바랍니다.</li>
                  </ul>
                </CardContent>
              </Card>

              <p className="text-center text-xs text-muted-foreground">
                본 견적서는 자동 생성되었으며, 정식 계약 전 참고용입니다.
              </p>
            </div>
          )
        })}

        <Card style={{ borderColor: `${BRAND}33` }} className="text-center print:hidden">
          <CardContent className="flex flex-col items-center gap-2 py-8 print:py-3">
            <CheckCircle2 className="size-10" style={{ color: BRAND }} />
            <p className="text-lg font-bold">접수가 완료되었습니다</p>
            <p className="text-sm text-muted-foreground">
              담당자가 견적 내용을 검토 후, 24시간 이내로 {email} 또는 {phone}으로 연락드립니다.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-1 overflow-x-auto rounded-lg border border-border bg-card p-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2 py-2 text-xs font-medium sm:text-sm ${
              i === step ? "bg-primary text-primary-foreground" : i < step ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <span className="flex size-5 items-center justify-center rounded-full border border-current text-[10px]">
              {i + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-xl">🏢</span>
                공간 정보
              </CardTitle>
              <CardDescription>전용면적은 평 또는 ㎡ 중 하나만 입력하면 자동 변환됩니다.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="pyeong">전용면적 (평)</Label>
                  <div className="relative">
                    <Input id="pyeong" inputMode="decimal" value={pyeong} onChange={(e) => handlePyeongChange(e.target.value)} className="pr-10" />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">평</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sqm">전용면적 (㎡)</Label>
                  <div className="relative">
                    <Input id="sqm" inputMode="decimal" value={sqm} onChange={(e) => handleSqmChange(e.target.value)} className="pr-10" />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">㎡</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="employees" className="flex items-center gap-1.5">
                  <Users className="size-4 text-muted-foreground" />
                  입주 예정 직원 수
                </Label>
                <div className="relative">
                  <Input id="employees" inputMode="numeric" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value.replace(/[^0-9]/g, ""))} className="pr-12" />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">명</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">건물 등급</CardTitle>
              <CardDescription>프리미엄 빌딩은 가설공사비가 높아집니다.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              {BUILDING_GRADES.map((g) => {
                const selected = buildingGrade === g.value
                const mod = pricing.buildingGradeModifiers[g.value]
                const pct = mod > 0 ? `+${Math.round(mod * 100)}%` : mod < 0 ? `${Math.round(mod * 100)}%` : "기준"
                return (
                  <button key={g.value} type="button" onClick={() => setBuildingGrade(g.value)} aria-pressed={selected}
                    className={`flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors ${selected ? "border-primary bg-accent ring-1 ring-primary" : "border-border bg-card hover:border-primary/50"}`}>
                    <span className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <span>{g.icon}</span>
                        {g.label}
                      </span>
                      <span className={`text-xs font-medium ${selected ? "text-primary" : "text-muted-foreground"}`}>{pct}</span>
                    </span>
                    <span className="text-xs leading-relaxed text-muted-foreground">{g.desc}</span>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">공사 유형</CardTitle>
              <CardDescription>리모델링은 3단계에서 철거공사를 선택하면 철거비가 추가됩니다.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {CONSTRUCTION_TYPES.map((c) => {
                const selected = constructionType === c.value
                return (
                  <button key={c.value} type="button" onClick={() => setConstructionType(c.value)} aria-pressed={selected}
                    className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${selected ? "border-primary bg-accent ring-1 ring-primary" : "border-border bg-card hover:border-primary/50"}`}>
                    <span className="mt-0.5 text-xl">{c.icon}</span>
                    <span className="flex flex-col gap-1">
                      <span className="font-semibold">{c.label}</span>
                      <span className="text-xs leading-relaxed text-muted-foreground">{c.desc}</span>
                    </span>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">📐</span>
              공간 구성
            </CardTitle>
            <CardDescription>필요한 특수 공간의 개수를 입력하거나 켜주세요.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <RoomGroup number={1} title="임원 공간" items={EXECUTIVE_ROOMS} rooms={rooms} onChange={updateRoomCount} />
            <RoomGroup number={2} title="회의실 구성" items={MEETING_ROOMS} rooms={rooms} onChange={updateRoomCount} />

            <div className="flex flex-col gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-xs text-background">3</span>
                공용 / 특수 공간
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {ROOM_TOGGLES.map((r) => {
                  const active = rooms[r.key as keyof RoomComposition] as boolean
                  return (
                    <button key={r.key} type="button" onClick={() => toggleRoom(r.key as keyof RoomComposition)} aria-pressed={active}
                      className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${active ? "border-primary bg-accent ring-1 ring-primary" : "border-border bg-card hover:border-primary/50"}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{r.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{r.label}</span>
                          <span className="text-xs text-muted-foreground">{r.desc}</span>
                        </div>
                      </div>
                      {active && <CheckCircle2 className="size-5 shrink-0 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <RoomGroup number={4} title="소형 공간" items={SMALL_ROOMS} rooms={rooms} onChange={updateRoomCount} />
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-xl">⚙️</span>
                마감 등급
              </CardTitle>
              <CardDescription>
                마감등급은 전체 공사비에 가장 큰 영향을 미칩니다. 여러 등급을 선택하면 등급별 견적서가 각각 생성됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FinishGradeGallery />
              <div className="grid gap-3 sm:grid-cols-2">
                {FINISH_GRADES.map((f) => {
                  const selected = finishGrades.has(f.value)
                  const mod = pricing.finishGradeModifiers[f.value]
                  const tag = mod === 1 ? "기준" : `×${mod}`
                  return (
                    <button key={f.value} type="button" onClick={() => toggleFinishGrade(f.value)} aria-pressed={selected}
                      className={`flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors ${selected ? "border-primary bg-accent ring-1 ring-primary" : "border-border bg-card hover:border-primary/50"}`}>
                      <span className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <span>{f.dot}</span>
                          {f.label}
                          {selected && <CheckCircle2 className="size-4 text-primary" />}
                        </span>
                        <span className={`text-xs font-medium ${selected ? "text-primary" : "text-muted-foreground"}`}>{tag}</span>
                      </span>
                      <span className="text-xs leading-relaxed text-muted-foreground">{f.desc}</span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">포함 공종 선택</CardTitle>
              <CardDescription>건식벽체·유리벽체 등 기본 6개 공종은 마감비에 이미 포함되어 있습니다. 추가로 필요한 공종을 선택하세요.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid gap-2 sm:grid-cols-2">
                {RECOMMENDED_WORK_TYPES.map((w) => (
                  <div key={w.key} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3 opacity-80">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{w.icon}</span>
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          {w.label}
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">권장</span>
                        </span>
                        <span className="text-xs text-muted-foreground">{w.desc}</span>
                      </div>
                    </div>
                    <CheckCircle2 className="size-5 shrink-0 text-primary" />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">추가 공종</p>
                <div className="flex items-center gap-2 text-xs">
                  <button type="button" onClick={selectAllOptional} className="underline underline-offset-2 hover:text-primary">
                    전체 선택
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button type="button" onClick={selectNoneOptional} className="underline underline-offset-2 hover:text-primary">
                    기본 권장 항목만
                  </button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {OPTIONAL_WORK_TYPES.map((w) => {
                  const active = workTypes.has(w.key)
                  return (
                    <button key={w.key} type="button" onClick={() => toggleWorkType(w.key)} aria-pressed={active}
                      className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${active ? "border-primary bg-accent ring-1 ring-primary" : "border-border bg-card hover:border-primary/50"}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{w.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{w.label}</span>
                          <span className="text-xs text-muted-foreground">{w.desc}</span>
                        </div>
                      </div>
                      {active && <CheckCircle2 className="size-5 shrink-0 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">💡</span>
              공사 시간대
            </CardTitle>
            <CardDescription>야간 공사는 노무비 할증이 발생합니다.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {CONSTRUCTION_TIMES.map((t) => {
                const selected = constructionTime === t.value
                const mod = pricing.timeModifiers[t.value]
                return (
                  <button key={t.value} type="button" onClick={() => setConstructionTime(t.value)} aria-pressed={selected}
                    className={`flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors ${selected ? "border-primary bg-accent ring-1 ring-primary" : "border-border bg-card hover:border-primary/50"}`}>
                    <span className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <span>{t.icon}</span>
                        {t.label}
                      </span>
                      <span className={`text-xs font-medium ${selected ? "text-primary" : "text-muted-foreground"}`}>
                        {mod > 0 ? `+${Math.round(mod * 100)}%` : "기준"}
                      </span>
                    </span>
                    <span className="text-xs leading-relaxed text-muted-foreground">{t.desc}</span>
                  </button>
                )
              })}
            </div>
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-bold leading-relaxed text-amber-700 dark:text-amber-400">
              💡 건물 내 다른 입주사가 있는 경우, 소음·분진 공사는 야간/주말 진행이 일반적입니다. 이 경우 부분 야간 이상을 선택하세요.
            </p>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">📋</span>
              연락처
            </CardTitle>
            <CardDescription>이메일과 정보를 입력하고 아래 버튼을 누르면 상세 견적서가 바로 화면에 나타납니다.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="companyName">회사명</Label>
                <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="(주)회사명" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="position">직급 / 직책</Label>
                <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="대리" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">연락처</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
            </div>

            <button type="button" onClick={() => setConsent((c) => !c)}
              className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-3 text-left">
              <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border ${consent ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                {consent && <CheckCircle2 className="size-4" />}
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">개인정보 수집 및 이용에 동의합니다. (필수)</span>
                <br />
                수집 항목: 회사명, 직급, 이메일, 전화번호 / 목적: 견적서 발송 및 상담 / 보유: 3년
              </span>
            </button>

            {errorMsg && <p className="rounded-md bg-destructive/10 p-2.5 text-sm text-destructive">{errorMsg}</p>}
          </CardContent>
        </Card>
      )}

      {stepError && <p className="rounded-md bg-destructive/10 p-2.5 text-sm text-destructive">{stepError}</p>}

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={goPrev} disabled={step === 0}>
          <ArrowLeft className="size-4" />
          이전
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={goNext}>
            다음 단계
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button type="button" onClick={handleFinalSubmit} disabled={submitting}>
            {submitting ? "생성 중..." : "📊 견적서 받기"}
          </Button>
        )}
      </div>
    </div>
  )
}

function RoomGroup({
  number,
  title,
  items,
  rooms,
  onChange,
}: {
  number: number
  title: string
  items: ReadonlyArray<{ key: string; icon: string; label: string; desc: string }>
  rooms: RoomComposition
  onChange: (key: keyof RoomComposition, delta: number) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-xs text-background">
          {number}
        </span>
        {title}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">{r.icon}</span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{r.label}</span>
                <span className="text-xs text-muted-foreground">{r.desc}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => onChange(r.key as keyof RoomComposition, -1)}
                className="flex size-7 items-center justify-center rounded-md border border-border text-sm hover:bg-muted">−</button>
              <span className="w-5 text-center text-sm font-semibold">{rooms[r.key as keyof RoomComposition] as number}</span>
              <button type="button" onClick={() => onChange(r.key as keyof RoomComposition, 1)}
                className="flex size-7 items-center justify-center rounded-md border border-border text-sm hover:bg-muted">+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

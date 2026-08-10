import type { PricingConfig } from "@/lib/pricing"
import type { RoomComposition } from "@/app/estimate/actions"

export const BRAND = "#145ce6"

export const FINISH_GRADES = [
  { value: "초급", dot: "🟡", label: "초급 마감", desc: "노출천정 도장·LVT 바닥·합판도어·기본 칸막이" },
  { value: "중급", dot: "🔵", label: "중급 마감", desc: "석고천정·LVT+카펫·유리파티션·방염벽지" },
  { value: "고급", dot: "🟣", label: "고급 마감", desc: "목모보드/바리솔·특수도장·디자인조명" },
  { value: "프리미엄", dot: "🔴", label: "프리미엄 마감", desc: "전 공정 최고급·대리석·바리솔 전체" },
] as const

export const RECOMMENDED_WORK_TYPES = [
  { key: "dryWall", icon: "🧱", label: "건식벽체", desc: "경량칸막이·단열재·석고보드" },
  { key: "glassWall", icon: "🪟", label: "유리벽체", desc: "10T 강화유리+ST'L 프레임" },
  { key: "paintWall", icon: "🎨", label: "수벽공사", desc: "석고+도장 마감 벽체" },
  { key: "electrical", icon: "⚡", label: "전기공사", desc: "전등·전열·소방전기·동력" },
  { key: "mechanical", icon: "🚿", label: "설비공사", desc: "소화배관·공조덕트·위생배관" },
  { key: "signage", icon: "🔖", label: "실명 사인", desc: "실명·메인로고·라운지사인" },
] as const

export const OPTIONAL_WORK_TYPES = [
  { key: "demolition", icon: "🔨", label: "철거공사", desc: "기존 마감재 철거 (리모델링 시)" },
  { key: "acoustic", icon: "🔇", label: "흡음공사", desc: "실별 소음이 서로 방해되지 않도록 흡음 마감" },
  { key: "hvac", icon: "❄️", label: "냉난방기공사", desc: "시스템에어컨 실내외기+배관" },
  { key: "network", icon: "📡", label: "통신공사", desc: "CAT-6 케이블링·무선AP·패치패널" },
  { key: "av", icon: "📺", label: "영상장비 및 AV", desc: "모니터·화상회의·음향" },
  { key: "furniture", icon: "🪑", label: "사무가구 구매", desc: "책상·의자·스토리지" },
  { key: "serverRoomBuild", icon: "🗄️", label: "서버실 구축", desc: "랙·항온항습·전용 배선 등 IT 인프라 구축" },
  { key: "customStorage", icon: "🧰", label: "현장 맞춤 제작수납가구", desc: "공간에 맞춰 현장에서 제작하는 붙박이 수납가구" },
] as const

export const EXECUTIVE_ROOMS = [
  { key: "executive", icon: "👔", label: "대표이사실 / 임원실", desc: "독립 공간으로 별도 설계 (개수만큼 추가)" },
] as const

export const MEETING_ROOMS = [
  { key: "meetingLarge", icon: "🏛️", label: "대회의실", desc: "15~20인, ~35㎡, 폴딩도어 포함" },
  { key: "meetingMid", icon: "🤝", label: "중회의실", desc: "6~12인, ~13㎡" },
  { key: "meetingSmall", icon: "💬", label: "소회의실", desc: "2~5인, ~10㎡" },
] as const

export const SMALL_ROOMS = [
  { key: "phoneBooth", icon: "🚪", label: "1인 작업실 / 폰부스", desc: "~4㎡ 소형 독립공간" },
  { key: "storage", icon: "📦", label: "창고", desc: "~12㎡ 기준" },
] as const

export const ROOM_COUNTERS = [...EXECUTIVE_ROOMS, ...MEETING_ROOMS, ...SMALL_ROOMS]

export const ROOM_TOGGLES = [
  { key: "lounge", icon: "☕", label: "라운지 / 캔틴", desc: "휴게+미팅 복합 공간" },
  { key: "studio", icon: "🎙️", label: "스튜디오 / 촬영실", desc: "LED·라운드벽체 특수 마감" },
  { key: "oaRoom", icon: "📦", label: "OA실 / 탕비실", desc: "싱크대·상부장 제작가구" },
  { key: "serverRoom", icon: "🖥️", label: "서버룸", desc: "항온항습·청정소화 별도" },
] as const

export const won = new Intl.NumberFormat("ko-KR")

export function roundToTenThousand(value: number) {
  return Math.round(value / 10_000) * 10_000
}

export function numberToKoreanWon(num: number) {
  if (num <= 0) return "0원정"
  const eok = Math.floor(num / 100_000_000)
  const man = Math.floor((num % 100_000_000) / 10_000)
  const rest = num % 10_000
  const parts: string[] = []
  if (eok > 0) parts.push(`${won.format(eok)}억`)
  if (man > 0) parts.push(`${won.format(man)}만`)
  if (rest > 0) parts.push(`${won.format(rest)}`)
  return `일금 ${parts.join(" ")}원정`
}

export type EstimateContext = {
  areaSqm: number
  employees: number
  buildingGrade: string
  constructionTime: string
  rooms: RoomComposition
  workTypes: Set<string>
}

export function computeEstimateForGrade(gradeValue: string, ctx: EstimateContext, pricing: PricingConfig) {
  const finishMod = pricing.finishGradeModifiers[gradeValue as keyof PricingConfig["finishGradeModifiers"]] ?? 1
  const buildingMod =
    pricing.buildingGradeModifiers[ctx.buildingGrade as keyof PricingConfig["buildingGradeModifiers"]] ?? 0
  const timeMod = pricing.timeModifiers[ctx.constructionTime as keyof PricingConfig["timeModifiers"]] ?? 0

  const finishBase = ctx.areaSqm * pricing.finishPricePerSqm * finishMod
  const buildingAdj = finishBase * buildingMod

  const roomsCost =
    ROOM_COUNTERS.reduce(
      (sum, r) =>
        sum +
        (ctx.rooms[r.key as keyof RoomComposition] as number) *
          pricing.roomPrices[r.key as keyof PricingConfig["roomPrices"]],
      0
    ) +
    ROOM_TOGGLES.reduce(
      (sum, r) =>
        sum +
        ((ctx.rooms[r.key as keyof RoomComposition] as boolean)
          ? pricing.roomPrices[r.key as keyof PricingConfig["roomPrices"]]
          : 0),
      0
    )

  let optionalCost = 0
  if (ctx.workTypes.has("demolition")) optionalCost += ctx.areaSqm * pricing.optionalWork.demolitionPerSqm
  if (ctx.workTypes.has("acoustic")) optionalCost += ctx.areaSqm * pricing.optionalWork.acousticPerSqm
  if (ctx.workTypes.has("hvac")) optionalCost += ctx.areaSqm * pricing.optionalWork.hvacPerSqm
  if (ctx.workTypes.has("network")) optionalCost += ctx.areaSqm * pricing.optionalWork.networkPerSqm
  if (ctx.workTypes.has("av")) optionalCost += pricing.optionalWork.avFlat
  if (ctx.workTypes.has("furniture")) optionalCost += ctx.employees * pricing.optionalWork.furniturePerEmployee
  if (ctx.workTypes.has("serverRoomBuild")) optionalCost += pricing.optionalWork.serverRoomBuildFlat
  if (ctx.workTypes.has("customStorage")) optionalCost += ctx.areaSqm * pricing.optionalWork.customStoragePerSqm

  const subtotal = finishBase + buildingAdj + roomsCost + optionalCost
  const timeSurcharge = subtotal * timeMod
  const total = roundToTenThousand(subtotal + timeSurcharge)

  const cats = [
    { label: "마감 공사 (기본)", value: finishBase + buildingAdj },
    { label: "공간 구성", value: roomsCost },
    { label: "추가 공종", value: optionalCost },
    { label: "공사 시간대 할증", value: timeSurcharge },
  ].filter((c) => c.value > 0)
  const catSum = cats.reduce((s, c) => s + c.value, 0) || 1
  const topCategories = cats
    .map((c) => ({ ...c, pct: (c.value / catSum) * 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)

  return {
    grade: gradeValue,
    total,
    breakdown: { finishBase, buildingAdj, roomsCost, optionalCost, timeSurcharge },
    topCategories,
  }
}

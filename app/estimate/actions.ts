"use server"

import { createClient } from "@/lib/supabase/server"

export type RoomComposition = {
  executive: number
  meetingLarge: number
  meetingMid: number
  meetingSmall: number
  lounge: boolean
  studio: boolean
  oaRoom: boolean
  serverRoom: boolean
  phoneBooth: number
  storage: number
}

export type EstimateSubmission = {
  pyeong: number
  area_sqm: number
  employee_count: number
  building_grade: "A" | "B" | "C"
  construction_type: "신규" | "리모델링"
  finish_grade: "초급" | "중급" | "고급" | "프리미엄"
  construction_time: "주간" | "부분야간" | "전면야간" | "주말야간"
  included_work_types: string[]
  room_composition: RoomComposition
  cost_rate_pct: number
  estimated_price: number
  company_name: string
  position: string
  contact_phone: string
  contact_email: string
  privacy_consent: boolean
}

export async function submitEstimate(input: EstimateSubmission) {
  const supabase = await createClient()

  const { error } = await supabase.from("estimate_requests").insert({
    pyeong: input.pyeong,
    area_sqm: input.area_sqm,
    employee_count: input.employee_count,
    building_grade: input.building_grade,
    construction_type: input.construction_type,
    finish_grade: input.finish_grade,
    construction_time: input.construction_time,
    included_work_types: input.included_work_types,
    room_composition: input.room_composition,
    cost_rate_pct: input.cost_rate_pct,
    estimated_price: input.estimated_price,
    contact_name: input.company_name || null,
    position: input.position || null,
    contact_phone: input.contact_phone || null,
    contact_email: input.contact_email || null,
    privacy_consent: input.privacy_consent,
  })

  if (error) {
    return { ok: false as const, error: error.message }
  }

  return { ok: true as const }
}

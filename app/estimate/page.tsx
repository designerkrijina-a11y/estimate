import { EstimateWizard } from "@/components/estimate-wizard"
import { createClient } from "@/lib/supabase/server"
import { DEFAULT_PRICING, mergePricing } from "@/lib/pricing"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "오피스 인테리어 견적 계산기",
  description: "5단계로 공간 정보, 마감등급, 공종을 선택하면 상세 견적서를 확인할 수 있습니다.",
}

export default async function EstimatePage() {
  const supabase = await createClient()
  const { data } = await supabase.from("pricing_config").select("config").eq("id", 1).single()
  const pricing = data?.config ? mergePricing(data.config) : DEFAULT_PRICING

  return (
    <main className="min-h-screen bg-background text-foreground print:min-h-0">
      <header className="border-b border-border bg-muted/60 py-14 text-center print:hidden">
        <div className="mx-auto max-w-2xl px-4">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-wide text-primary">
            <img src="/ajd-logo.png" alt="아정당인테리어" className="h-4 w-auto" />
            <span>· 오피스 인테리어</span>
          </p>
          <h1 className="mt-3 text-pretty text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            1:1 맞춤 견적으로
            <br className="md:hidden" /> 예산 낭비 없이 설계해드립니다
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            공간 정보와 시공 조건을 단계별로 입력하면 상세 견적서를 바로 확인할 수 있습니다. 정확한 금액은 현장 조사
            후 확정됩니다.
          </p>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-10 print:py-2 md:px-8">
        <div className="hidden text-center print:mb-6 print:block print:gap-0.5">
          <p className="text-[10px] font-semibold leading-snug text-primary">오피스 인테리어 견적 계산기</p>
        </div>
        <EstimateWizard pricing={pricing} />
      </div>
    </main>
  )
}

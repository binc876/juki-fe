import { Check } from "lucide-react"

const steps = ["Bayar Pelatihan", "Daftar Pelatihan", "Submit Jurnal", "Ikut Pelatihan", "Review Artikel", "Penerbitan LOA"]

export default function StageTracker({ 
  stepStatus, currentStep, onClickStep 
}: { 
  stepStatus: Record<number, string> 
  currentStep: number
  onClickStep: (step: number) => void
}) {

  return (
    <div className="w-full overflow-x-auto">
    <div className="flex items-center justify-between gap-2 mb-8 min-w-[600px] sm:min-w-full">
      {steps.map((label, idx) => {
        const step = idx + 1
        const status = stepStatus[step]
        const isClickable = status === "done" || status === "active"
        const isLast = step === steps.length

        const lineColor = stepStatus[step + 1] === "done" || stepStatus[step] === "done"
          ? "bg-[#5C7B78]"
          : "bg-[#D9D9D9]"

        return (
          <div 
            key={label} 
            onClick={() => isClickable && onClickStep(step)}
            className={`flex-1 flex flex-col items-center relative group gap-2 ${isClickable ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
          >
            <div className={`w-8 h-8 rounded-full flex z-10 items-center justify-center font-semibold text-sm
              ${status === 'done' ? 'bg-[#5C7B78]' :
                status === 'active' ? 'bg-[#D15651]' :
                'bg-[#D9D9D9]'}`}>
              {status === 'done' ? (<Check className="w-6 h-6 text-white"/>) : step}
            </div>
            <div className={`mt-1 text-sm text-center whitespace-nowrap ${currentStep === step ? "font-bold text-white" : "text-gray-100"}`}>{label}</div>
            {!isLast && (
            <div className={`absolute top-4 w-full h-1 ${lineColor} z-0`} style={{ left: "50%", right: "-50%" }} />
            )}
          </div>
        )
      })}
    </div>
    </div>
  )
}

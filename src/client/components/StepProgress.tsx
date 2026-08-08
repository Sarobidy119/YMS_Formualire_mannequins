interface StepProgressProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
}

export function StepProgress({ currentStep, totalSteps, stepLabels }: StepProgressProps) {
  const pct = (currentStep / totalSteps) * 100
  return (
    <div className="mb-6">
      <div className="mb-2 flex justify-between text-xs text-gray-500">
        <span>Étape {currentStep} / {totalSteps}</span>
        <span>{stepLabels[currentStep - 1]}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-yms-600 transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

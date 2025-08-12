export default function Stepper({ step, total, onPrev, onNext }: { step: number; total: number; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-md font-semibold text-gray-900">{`Step ${step} / ${total}`}</h4>
      <div className="space-x-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-3 py-2 text-sm rounded-md border text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          disabled={step <= 1}
        >Back</button>
        <button
          type="button"
          onClick={onNext}
          className="px-3 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
        >Next</button>
      </div>
    </div>
  )
}



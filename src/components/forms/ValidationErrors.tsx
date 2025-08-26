import { AlertCircle } from 'lucide-react'

interface ValidationErrorsProps {
  errors: string[]
  className?: string
}

export default function ValidationErrors({ errors, className = '' }: ValidationErrorsProps) {
  if (errors.length === 0) {
    return null
  }

  return (
    <div className={`p-4 bg-red-50 border border-red-200 rounded-md ${className}`}>
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-red-400" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Please fix the following errors:
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <ul className="list-disc pl-5 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

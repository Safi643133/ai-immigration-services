import ValidationErrors from './ValidationErrors'

interface FormStepProps {
  title: string
  children: React.ReactNode
  validationErrors: string[]
  className?: string
}

export default function FormStep({ title, children, validationErrors, className = '' }: FormStepProps) {
  return (
    <div className={className}>
      <h5 className="text-sm font-medium text-gray-900 mb-3">{title}</h5>
      {children}
      
      <ValidationErrors errors={validationErrors} className="mt-4" />
    </div>
  )
}

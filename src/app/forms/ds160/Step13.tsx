import type { StepProps } from './types'

export default function Step13({ formData, onChange }: StepProps) {
  const get = (key: string) => formData[key] || ''
  const set = (key: string, val: any) => onChange(key, val)
  const yesNo = ['Yes', 'No']

  const hasCommunicableDisease = (get('security_background1.communicable_disease') || '').toString().toLowerCase() === 'yes'
  const hasMentalOrPhysicalDisorder = (get('security_background1.mental_or_physical_disorder') || '').toString().toLowerCase() === 'yes'
  const isDrugAbuserOrAddict = (get('security_background1.drug_abuser_or_addict') || '').toString().toLowerCase() === 'yes'

  return (
    <div className="space-y-8">
      {/* Communicable disease */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Do you have a communicable disease of public health significance? (Communicable diseases of public significance include chancroid, gonorrhea, granuloma inguinale, infectious leprosy, lymphogranuloma venereum, infectious stage syphilis, active tuberculosis, and other diseases as determined by the Department of Health and Human Services.)
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input
                type="radio"
                name="communicable_disease"
                className="mr-2"
                checked={get('security_background1.communicable_disease') === opt}
                onChange={() => set('security_background1.communicable_disease', opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        {hasCommunicableDisease && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea
              rows={3}
              value={get('security_background1.communicable_disease_explain')}
              onChange={(e) => set('security_background1.communicable_disease_explain', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        )}
      </div>

      {/* Mental or physical disorder */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Do you have a mental or physical disorder that poses or is likely to pose a threat to the safety or welfare of yourself or others?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input
                type="radio"
                name="mental_or_physical_disorder"
                className="mr-2"
                checked={get('security_background1.mental_or_physical_disorder') === opt}
                onChange={() => set('security_background1.mental_or_physical_disorder', opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        {hasMentalOrPhysicalDisorder && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea
              rows={3}
              value={get('security_background1.mental_or_physical_disorder_explain')}
              onChange={(e) => set('security_background1.mental_or_physical_disorder_explain', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        )}
      </div>

      {/* Drug abuser/addict */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Are you or have you ever been a drug abuser or addict?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input
                type="radio"
                name="drug_abuser_or_addict"
                className="mr-2"
                checked={get('security_background1.drug_abuser_or_addict') === opt}
                onChange={() => set('security_background1.drug_abuser_or_addict', opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        {isDrugAbuserOrAddict && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea
              rows={3}
              value={get('security_background1.drug_abuser_or_addict_explain')}
              onChange={(e) => set('security_background1.drug_abuser_or_addict_explain', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        )}
      </div>
    </div>
  )
}



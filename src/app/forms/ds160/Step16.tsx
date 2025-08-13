import type { StepProps } from './types'

export default function Step16({ formData, onChange }: StepProps) {
  const get = (key: string) => formData[key] || ''
  const set = (key: string, val: any) => onChange(key, val)
  const yesNo = ['Yes', 'No']

  const q1 = (get('security_background4.subject_of_removal_or_deportation_hearing') || '').toString().toLowerCase() === 'yes'
  const q2 = (get('security_background4.immigration_benefit_by_fraud_or_misrepresentation') || '').toString().toLowerCase() === 'yes'
  const q3 = (get('security_background4.failed_to_attend_hearing_last_five_years') || '').toString().toLowerCase() === 'yes'
  const q4 = (get('security_background4.unlawfully_present_or_visa_violation') || '').toString().toLowerCase() === 'yes'
  const q5 = (get('security_background4.removed_or_deported_from_any_country') || '').toString().toLowerCase() === 'yes'

  return (
    <div className="space-y-8">
      {/* Removal or deportation hearing */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you ever been the subject of a removal or deportation hearing?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="subject_of_removal_or_deportation_hearing" className="mr-2" checked={get('security_background4.subject_of_removal_or_deportation_hearing') === opt} onChange={() => set('security_background4.subject_of_removal_or_deportation_hearing', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background4.subject_of_removal_or_deportation_hearing_explain')} onChange={(e) => set('security_background4.subject_of_removal_or_deportation_hearing_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>

      {/* Fraud or misrepresentation for immigration benefit */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you ever sought to obtain or assist others to obtain a visa, entry into the United States, or any other United States immigration benefit by fraud or willful misrepresentation or other unlawful means?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="immigration_benefit_by_fraud_or_misrepresentation" className="mr-2" checked={get('security_background4.immigration_benefit_by_fraud_or_misrepresentation') === opt} onChange={() => set('security_background4.immigration_benefit_by_fraud_or_misrepresentation', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q2 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background4.immigration_benefit_by_fraud_or_misrepresentation_explain')} onChange={(e) => set('security_background4.immigration_benefit_by_fraud_or_misrepresentation_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>

      {/* Failed to attend hearing last five years */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you failed to attend a hearing on removability or inadmissibility within the last five years?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="failed_to_attend_hearing_last_five_years" className="mr-2" checked={get('security_background4.failed_to_attend_hearing_last_five_years') === opt} onChange={() => set('security_background4.failed_to_attend_hearing_last_five_years', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q3 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background4.failed_to_attend_hearing_last_five_years_explain')} onChange={(e) => set('security_background4.failed_to_attend_hearing_last_five_years_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>

      {/* Unlawfully present or visa violation */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you ever been unlawfully present, overstayed the amount of time granted by an immigration official or otherwise violated the terms of a U.S. visa?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="unlawfully_present_or_visa_violation" className="mr-2" checked={get('security_background4.unlawfully_present_or_visa_violation') === opt} onChange={() => set('security_background4.unlawfully_present_or_visa_violation', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q4 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background4.unlawfully_present_or_visa_violation_explain')} onChange={(e) => set('security_background4.unlawfully_present_or_visa_violation_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>

      {/* Removed or deported from any country */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you ever been removed or deported from any country?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="removed_or_deported_from_any_country" className="mr-2" checked={get('security_background4.removed_or_deported_from_any_country') === opt} onChange={() => set('security_background4.removed_or_deported_from_any_country', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q5 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background4.removed_or_deported_from_any_country_explain')} onChange={(e) => set('security_background4.removed_or_deported_from_any_country_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation'/>
          </div>
        )}
      </div>
    </div>
  )
}



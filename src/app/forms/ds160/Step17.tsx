import type { StepProps } from './types'

export default function Step17({ formData, onChange }: StepProps) {
  const get = (key: string) => formData[key] || ''
  const set = (key: string, val: any) => onChange(key, val)
  const yesNo = ['Yes', 'No']

  const q1 = (get('security_background5.withheld_child_custody') || '').toString().toLowerCase() === 'yes'
  const q2 = (get('security_background5.voted_in_us_violation') || '').toString().toLowerCase() === 'yes'
  const q3 = (get('security_background5.renounced_citizenship_to_avoid_tax') || '').toString().toLowerCase() === 'yes'
  const q4 = (get('security_background5.former_j_visitor_not_fulfilled_2yr') || '').toString().toLowerCase() === 'yes'
  const q5 = (get('security_background5.public_school_f_status_without_reimbursing') || '').toString().toLowerCase() === 'yes'

  return (
    <div className="space-y-8">
      {/* Withheld custody */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you ever withheld custody of a U.S. citizen child outside the United States from a person granted legal custody by a U.S. court?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="withheld_child_custody" className="mr-2" checked={get('security_background5.withheld_child_custody') === opt} onChange={() => set('security_background5.withheld_child_custody', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background5.withheld_child_custody_explain')} onChange={(e) => set('security_background5.withheld_child_custody_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>

      {/* Voted in US in violation */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you voted in the United States in violation of any law or regulation?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="voted_in_us_violation" className="mr-2" checked={get('security_background5.voted_in_us_violation') === opt} onChange={() => set('security_background5.voted_in_us_violation', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q2 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background5.voted_in_us_violation_explain')} onChange={(e) => set('security_background5.voted_in_us_violation_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>

      {/* Renounced citizenship to avoid taxation */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you ever renounced United States citizenship for the purposes of avoiding taxation?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="renounced_citizenship_to_avoid_tax" className="mr-2" checked={get('security_background5.renounced_citizenship_to_avoid_tax') === opt} onChange={() => set('security_background5.renounced_citizenship_to_avoid_tax', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q3 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background5.renounced_citizenship_to_avoid_tax_explain')} onChange={(e) => set('security_background5.renounced_citizenship_to_avoid_tax_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>

      {/* Former J visitor not fulfilled 2-year */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Are you a former exchange visitor (J) who has not yet fulfilled the two-year foreign residence requirement?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="former_j_visitor_not_fulfilled_2yr" className="mr-2" checked={get('security_background5.former_j_visitor_not_fulfilled_2yr') === opt} onChange={() => set('security_background5.former_j_visitor_not_fulfilled_2yr', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q4 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background5.former_j_visitor_not_fulfilled_2yr_explain')} onChange={(e) => set('security_background5.former_j_visitor_not_fulfilled_2yr_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>

      {/* Attended public school on F without reimbursing */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you attended a public elementary school on student (F) status or a public secondary school after November 30, 1996 without reimbursing the school?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="public_school_f_status_without_reimbursing" className="mr-2" checked={get('security_background5.public_school_f_status_without_reimbursing') === opt} onChange={() => set('security_background5.public_school_f_status_without_reimbursing', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q5 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background5.public_school_f_status_without_reimbursing_explain')} onChange={(e) => set('security_background5.public_school_f_status_without_reimbursing_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>
    </div>
  )
}



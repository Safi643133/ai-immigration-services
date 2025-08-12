import type { StepProps } from './types'

export default function Step14({ formData, onChange }: StepProps) {
  const get = (key: string) => formData[key] || ''
  const set = (key: string, val: any) => onChange(key, val)
  const yesNo = ['Yes', 'No']

  const q1 = (get('security_background2.arrested_or_convicted') || '').toString().toLowerCase() === 'yes'
  const q2 = (get('security_background2.controlled_substances_violation') || '').toString().toLowerCase() === 'yes'
  const q3 = (get('security_background2.prostitution_or_vice') || '').toString().toLowerCase() === 'yes'
  const q4 = (get('security_background2.money_laundering') || '').toString().toLowerCase() === 'yes'
  const q5 = (get('security_background2.human_trafficking_committed_or_conspired') || '').toString().toLowerCase() === 'yes'
  const q6 = (get('security_background2.human_trafficking_aided_abetted') || '').toString().toLowerCase() === 'yes'
  const q7 = (get('security_background2.human_trafficking_family_benefited') || '').toString().toLowerCase() === 'yes'

  return (
    <div className="space-y-8">
      {/* Arrested or convicted */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you ever been arrested or convicted for any offense or crime, even though subject of a pardon, amnesty, or other similar action?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="arrested_or_convicted" className="mr-2" checked={get('security_background2.arrested_or_convicted') === opt} onChange={() => set('security_background2.arrested_or_convicted', opt)} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        {q1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background2.arrested_or_convicted_explain')} onChange={(e) => set('security_background2.arrested_or_convicted_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
        )}
      </div>

      {/* Controlled substances */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you ever violated, or engaged in a conspiracy to violate, any law relating to controlled substances?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="controlled_substances_violation" className="mr-2" checked={get('security_background2.controlled_substances_violation') === opt} onChange={() => set('security_background2.controlled_substances_violation', opt)} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        {q2 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background2.controlled_substances_violation_explain')} onChange={(e) => set('security_background2.controlled_substances_violation_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
        )}
      </div>

      {/* Prostitution or vice */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Are you coming to the United States to engage in prostitution or unlawful commercialized vice or have you been engaged in prostitution or procuring prostitutes within the past 10 years?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="prostitution_or_vice" className="mr-2" checked={get('security_background2.prostitution_or_vice') === opt} onChange={() => set('security_background2.prostitution_or_vice', opt)} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        {q3 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background2.prostitution_or_vice_explain')} onChange={(e) => set('security_background2.prostitution_or_vice_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
        )}
      </div>

      {/* Money laundering */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you ever been involved in, or do you seek to engage in, money laundering?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="money_laundering" className="mr-2" checked={get('security_background2.money_laundering') === opt} onChange={() => set('security_background2.money_laundering', opt)} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        {q4 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background2.money_laundering_explain')} onChange={(e) => set('security_background2.money_laundering_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
        )}
      </div>

      {/* Human trafficking - committed or conspired */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you ever committed or conspired to commit a human trafficking offense in the United States or outside the United States?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="human_trafficking_committed_or_conspired" className="mr-2" checked={get('security_background2.human_trafficking_committed_or_conspired') === opt} onChange={() => set('security_background2.human_trafficking_committed_or_conspired', opt)} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        {q5 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background2.human_trafficking_committed_or_conspired_explain')} onChange={(e) => set('security_background2.human_trafficking_committed_or_conspired_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
        )}
      </div>

      {/* Human trafficking - aided/abetted */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you ever knowingly aided, abetted, assisted or colluded with an individual who has committed, or conspired to commit a severe human trafficking offense in the United States or outside the United States?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="human_trafficking_aided_abetted" className="mr-2" checked={get('security_background2.human_trafficking_aided_abetted') === opt} onChange={() => set('security_background2.human_trafficking_aided_abetted', opt)} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        {q6 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background2.human_trafficking_aided_abetted_explain')} onChange={(e) => set('security_background2.human_trafficking_aided_abetted_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
        )}
      </div>

      {/* Human trafficking - family benefited */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Are you the spouse, son, or daughter of an individual who has committed or conspired to commit a human trafficking offense in the United States or outside the United States and have you within the last five years, knowingly benefited from the trafficking activities?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="human_trafficking_family_benefited" className="mr-2" checked={get('security_background2.human_trafficking_family_benefited') === opt} onChange={() => set('security_background2.human_trafficking_family_benefited', opt)} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        {q7 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background2.human_trafficking_family_benefited_explain')} onChange={(e) => set('security_background2.human_trafficking_family_benefited_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
        )}
      </div>
    </div>
  )
}



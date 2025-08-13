import type { StepProps } from './types'

export default function Step15({ formData, onChange }: StepProps) {
  const get = (key: string) => formData[key] || ''
  const set = (key: string, val: any) => onChange(key, val)
  const yesNo = ['Yes', 'No']

  const q1 = (get('security_background3.espionage_or_illegal_activity') || '').toString().toLowerCase() === 'yes'
  const q2 = (get('security_background3.terrorist_activities') || '').toString().toLowerCase() === 'yes'
  const q3 = (get('security_background3.support_to_terrorists') || '').toString().toLowerCase() === 'yes'
  const q4 = (get('security_background3.member_of_terrorist_org') || '').toString().toLowerCase() === 'yes'
  const q5 = (get('security_background3.family_engaged_in_terrorism_last_five_years') || '').toString().toLowerCase() === 'yes'
  const q6 = (get('security_background3.genocide_involvement') || '').toString().toLowerCase() === 'yes'
  const q7 = (get('security_background3.torture_involvement') || '').toString().toLowerCase() === 'yes'
  const q8 = (get('security_background3.violence_killings_involvement') || '').toString().toLowerCase() === 'yes'
  const q9 = (get('security_background3.child_soldiers_involvement') || '').toString().toLowerCase() === 'yes'
  const q10 = (get('security_background3.religious_freedom_violations') || '').toString().toLowerCase() === 'yes'
  const q11 = (get('security_background3.population_control_forced_abortion_sterilization') || '').toString().toLowerCase() === 'yes'
  const q12 = (get('security_background3.coercive_transplantation') || '').toString().toLowerCase() === 'yes'

  return (
    <div className="space-y-8">
      {/* Espionage / illegal activity */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Do you seek to engage in espionage, sabotage, export control violations, or any other illegal activity while in the United States?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="espionage_or_illegal_activity" className="mr-2" checked={get('security_background3.espionage_or_illegal_activity') === opt} onChange={() => set('security_background3.espionage_or_illegal_activity', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background3.espionage_or_illegal_activity_explain')} onChange={(e) => set('security_background3.espionage_or_illegal_activity_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>

      {/* Terrorist activities */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Do you seek to engage in terrorist activities while in the United States or have you ever engaged in terrorist activities?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="terrorist_activities" className="mr-2" checked={get('security_background3.terrorist_activities') === opt} onChange={() => set('security_background3.terrorist_activities', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q2 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background3.terrorist_activities_explain')} onChange={(e) => set('security_background3.terrorist_activities_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>

      {/* Support to terrorists */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you ever or do you intend to provide financial assistance or other support to terrorists or terrorist organizations?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="support_to_terrorists" className="mr-2" checked={get('security_background3.support_to_terrorists') === opt} onChange={() => set('security_background3.support_to_terrorists', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q3 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background3.support_to_terrorists_explain')} onChange={(e) => set('security_background3.support_to_terrorists_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>

      {/* Member of terrorist org */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Are you a member or representative of a terrorist organization?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="member_of_terrorist_org" className="mr-2" checked={get('security_background3.member_of_terrorist_org') === opt} onChange={() => set('security_background3.member_of_terrorist_org', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q4 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background3.member_of_terrorist_org_explain')} onChange={(e) => set('security_background3.member_of_terrorist_org_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>

      {/* Family engaged in terrorism within last five years */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Are you the spouse, son, or daughter of an individual who has engaged in terrorist activity, including providing financial assistance or other support to terrorists or terrorist organizations, in the last five years?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="family_engaged_in_terrorism_last_five_years" className="mr-2" checked={get('security_background3.family_engaged_in_terrorism_last_five_years') === opt} onChange={() => set('security_background3.family_engaged_in_terrorism_last_five_years', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q5 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background3.family_engaged_in_terrorism_last_five_years_explain')} onChange={(e) => set('security_background3.family_engaged_in_terrorism_last_five_years_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>

      {/* Genocide */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you ever ordered, incited, committed, assisted, or otherwise participated in genocide?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="genocide_involvement" className="mr-2" checked={get('security_background3.genocide_involvement') === opt} onChange={() => set('security_background3.genocide_involvement', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q6 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background3.genocide_involvement_explain')} onChange={(e) => set('security_background3.genocide_involvement_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>

      {/* Torture */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you ever committed, ordered, incited, assisted, or otherwise participated in torture?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="torture_involvement" className="mr-2" checked={get('security_background3.torture_involvement') === opt} onChange={() => set('security_background3.torture_involvement', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q7 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background3.torture_involvement_explain')} onChange={(e) => set('security_background3.torture_involvement_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>

      {/* Extrajudicial/political killings or other acts of violence */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you committed, ordered, incited, assisted, or otherwise participated in extrajudicial killings, political killings, or other acts of violence?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="violence_killings_involvement" className="mr-2" checked={get('security_background3.violence_killings_involvement') === opt} onChange={() => set('security_background3.violence_killings_involvement', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q8 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background3.violence_killings_involvement_explain')} onChange={(e) => set('security_background3.violence_killings_involvement_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>

      {/* Child soldiers */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you ever engaged in the recruitment or the use of child soldiers?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="child_soldiers_involvement" className="mr-2" checked={get('security_background3.child_soldiers_involvement') === opt} onChange={() => set('security_background3.child_soldiers_involvement', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q9 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background3.child_soldiers_involvement_explain')} onChange={(e) => set('security_background3.child_soldiers_involvement_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>

      {/* Severe violations of religious freedom */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you, while serving as a government official, been responsible for or directly carried out, at any time, particularly severe violations of religious freedom?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="religious_freedom_violations" className="mr-2" checked={get('security_background3.religious_freedom_violations') === opt} onChange={() => set('security_background3.religious_freedom_violations', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q10 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background3.religious_freedom_violations_explain')} onChange={(e) => set('security_background3.religious_freedom_violations_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>

      {/* Forced abortion/sterilization */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you ever been directly involved in the establishment or enforcement of population controls forcing a woman to undergo an abortion against her free choice or a man or a woman to undergo sterilization against his or her free will?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="population_control_forced_abortion_sterilization" className="mr-2" checked={get('security_background3.population_control_forced_abortion_sterilization') === opt} onChange={() => set('security_background3.population_control_forced_abortion_sterilization', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q11 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background3.population_control_forced_abortion_sterilization_explain')} onChange={(e) => set('security_background3.population_control_forced_abortion_sterilization_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>

      {/* Coercive transplantation */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Have you ever been directly involved in the coercive transplantation of human organs or bodily tissue?
        </label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="coercive_transplantation" className="mr-2" checked={get('security_background3.coercive_transplantation') === opt} onChange={() => set('security_background3.coercive_transplantation', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {q12 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea rows={3} value={get('security_background3.coercive_transplantation_explain')} onChange={(e) => set('security_background3.coercive_transplantation_explain', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder='Enter explanation' />
          </div>
        )}
      </div>
    </div>
  )
}



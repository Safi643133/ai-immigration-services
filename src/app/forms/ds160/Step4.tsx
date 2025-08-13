import type { StepProps } from './types'

export default function Step4({ formData, onChange }: StepProps) {
  const get = (key: string) => formData[key] || ''
  const set = (key: string, val: any) => onChange(key, val)
  const yesNo = ['Yes', 'No']

  const travelingWithOthers = (get('traveling_companions.traveling_with_others') || '').toString().toLowerCase() === 'yes'
  const travelingAsGroup = (get('traveling_companions.traveling_as_group') || '').toString().toLowerCase() === 'yes'
  const setUpper = (key: string, val: string) => set(key, (val || '').toUpperCase())

  const relationships = [
    'PARENT', 'SPOUSE', 'CHILD', 'OTHER RELATIVE', 'FRIEND', 'BUSINESS ASSOCIATE', 'OTHER'
  ]

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Are there other persons traveling with you?</label>
        <div className="mt-2 flex items-center space-x-6">
          {yesNo.map((opt) => (
            <label key={opt} className="inline-flex items-center">
              <input
                type="radio"
                name="traveling_with_others"
                className="mr-2"
                checked={get('traveling_companions.traveling_with_others') === opt}
                onChange={() => set('traveling_companions.traveling_with_others', opt)}
              />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
      </div>

      {travelingWithOthers && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Are you traveling as part of a group or organization?</label>
            <div className="mt-2 flex items-center space-x-6">
              {yesNo.map((opt) => (
                <label key={opt} className="inline-flex items-center">
                  <input
                    type="radio"
                    name="traveling_as_group"
                    className="mr-2"
                    checked={get('traveling_companions.traveling_as_group') === opt}
                    onChange={() => set('traveling_companions.traveling_as_group', opt)}
                  />
                  <span className='text-black'>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {travelingAsGroup ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">Enter the name of the group you are traveling with</label>
              <input
                type="text"
                value={get('traveling_companions.group_name')}
                onChange={(e) => set('traveling_companions.group_name', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder='Enter group name'
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Surnames of the person traveling with you</label>
                <input
                  type="text"
                  value={get('traveling_companions.companion_surnames')}
                  onChange={(e) => setUpper('traveling_companions.companion_surnames', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm uppercase"
                  placeholder='Enter surnames'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Given names of the person traveling with you</label>
                <input
                  type="text"
                  value={get('traveling_companions.companion_given_names')}
                  onChange={(e) => setUpper('traveling_companions.companion_given_names', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm uppercase"
                  placeholder='Enter given names'
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Relationship to you</label>
                <select
                  value={get('traveling_companions.companion_relationship')}
                  onChange={(e) => set('traveling_companions.companion_relationship', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select</option>
                  {relationships.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}



import type { StepProps } from './types'

export default function Step9({ formData, onChange }: StepProps) {
  const get = (key: string) => formData[key] || ''
  const set = (key: string, val: any) => onChange(key, val)
  const yesNo = ['Yes', 'No']

  const fatherInUS = (get('family_info.father_in_us') || '').toString().toLowerCase() === 'yes'
  const motherInUS = (get('family_info.mother_in_us') || '').toString().toLowerCase() === 'yes'
  const immediateRelativesUS = (get('family_info.immediate_relatives_us') || '').toString().toLowerCase() === 'yes'

  const fatherSurnameNA = get('family_info.father_surnames_na') === true || get('family_info.father_surnames') === 'N/A'
  const fatherGivenNA = get('family_info.father_given_names_na') === true || get('family_info.father_given_names') === 'N/A'
  const fatherDobNA = get('family_info.father_date_of_birth_na') === true || get('family_info.father_date_of_birth') === 'N/A'

  const motherSurnameNA = get('family_info.mother_surnames_na') === true || get('family_info.mother_surnames') === 'N/A'
  const motherGivenNA = get('family_info.mother_given_names_na') === true || get('family_info.mother_given_names') === 'N/A'
  const motherDobNA = get('family_info.mother_date_of_birth_na') === true || get('family_info.mother_date_of_birth') === 'N/A'

  const statusOptions = ['U.S. CITIZEN', 'U.S. LEGAL PERMANENT RESIDENT (LPR)', 'NONIMMIGRANT', "OTHER/I DON'T KNOW"]
  const relOptions = ['SPOUSE', 'FIANCÈ/FIANCÈE', 'CHILD', 'SIBLING']

  return (
    <div className="space-y-8">
      {/* Father */}
      <div className="space-y-4">
        <h6 className="text-sm font-medium text-gray-900">Father's Full Name and Date of Birth</h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Surnames</label>
            <div className="flex items-center space-x-3 mt-1">
              <input
                type="text"
                value={fatherSurnameNA ? 'N/A' : get('family_info.father_surnames')}
                onChange={(e) => set('family_info.father_surnames', e.target.value)}
                className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                disabled={fatherSurnameNA}
              />
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={fatherSurnameNA}
                  onChange={(e) => {
                    if (e.target.checked) {
                      set('family_info.father_surnames_na', true)
                      set('family_info.father_surnames', 'N/A')
                    } else {
                      set('family_info.father_surnames_na', false)
                      if (get('family_info.father_surnames') === 'N/A') set('family_info.father_surnames', '')
                    }
                  }}
                />
                Do not know
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Given Names</label>
            <div className="flex items-center space-x-3 mt-1">
              <input
                type="text"
                value={fatherGivenNA ? 'N/A' : get('family_info.father_given_names')}
                onChange={(e) => set('family_info.father_given_names', e.target.value)}
                className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                disabled={fatherGivenNA}
              />
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={fatherGivenNA}
                  onChange={(e) => {
                    if (e.target.checked) {
                      set('family_info.father_given_names_na', true)
                      set('family_info.father_given_names', 'N/A')
                    } else {
                      set('family_info.father_given_names_na', false)
                      if (get('family_info.father_given_names') === 'N/A') set('family_info.father_given_names', '')
                    }
                  }}
                />
                Do not know
              </label>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <div className="flex items-center space-x-3 mt-1">
              <input
                type="date"
                value={fatherDobNA ? '' : get('family_info.father_date_of_birth')}
                onChange={(e) => set('family_info.father_date_of_birth', e.target.value)}
                className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                disabled={fatherDobNA}
              />
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={fatherDobNA}
                  onChange={(e) => {
                    if (e.target.checked) {
                      set('family_info.father_date_of_birth_na', true)
                      set('family_info.father_date_of_birth', 'N/A')
                    } else {
                      set('family_info.father_date_of_birth_na', false)
                      if (get('family_info.father_date_of_birth') === 'N/A') set('family_info.father_date_of_birth', '')
                    }
                  }}
                />
                Do not know
              </label>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Is your father in the U.S.?</label>
            <div className="mt-1 flex items-center space-x-6">
              {yesNo.map(opt => (
                <label key={opt} className="inline-flex items-center">
                  <input type="radio" name="father_in_us" className="mr-2" checked={get('family_info.father_in_us') === opt} onChange={() => set('family_info.father_in_us', opt)} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            {fatherInUS && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700">Father's Status</label>
                <select
                  value={get('family_info.father_status')}
                  onChange={(e) => set('family_info.father_status', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select status</option>
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mother */}
      <div className="space-y-4">
        <h6 className="text-sm font-medium text-gray-900">Mother's Full Name and Date of Birth</h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Surnames</label>
            <div className="flex items-center space-x-3 mt-1">
              <input
                type="text"
                value={motherSurnameNA ? 'N/A' : get('family_info.mother_surnames')}
                onChange={(e) => set('family_info.mother_surnames', e.target.value)}
                className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                disabled={motherSurnameNA}
              />
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={motherSurnameNA}
                  onChange={(e) => {
                    if (e.target.checked) {
                      set('family_info.mother_surnames_na', true)
                      set('family_info.mother_surnames', 'N/A')
                    } else {
                      set('family_info.mother_surnames_na', false)
                      if (get('family_info.mother_surnames') === 'N/A') set('family_info.mother_surnames', '')
                    }
                  }}
                />
                Do not know
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Given Names</label>
            <div className="flex items-center space-x-3 mt-1">
              <input
                type="text"
                value={motherGivenNA ? 'N/A' : get('family_info.mother_given_names')}
                onChange={(e) => set('family_info.mother_given_names', e.target.value)}
                className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                disabled={motherGivenNA}
              />
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={motherGivenNA}
                  onChange={(e) => {
                    if (e.target.checked) {
                      set('family_info.mother_given_names_na', true)
                      set('family_info.mother_given_names', 'N/A')
                    } else {
                      set('family_info.mother_given_names_na', false)
                      if (get('family_info.mother_given_names') === 'N/A') set('family_info.mother_given_names', '')
                    }
                  }}
                />
                Do not know
              </label>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <div className="flex items-center space-x-3 mt-1">
              <input
                type="date"
                value={motherDobNA ? '' : get('family_info.mother_date_of_birth')}
                onChange={(e) => set('family_info.mother_date_of_birth', e.target.value)}
                className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                disabled={motherDobNA}
              />
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={motherDobNA}
                  onChange={(e) => {
                    if (e.target.checked) {
                      set('family_info.mother_date_of_birth_na', true)
                      set('family_info.mother_date_of_birth', 'N/A')
                    } else {
                      set('family_info.mother_date_of_birth_na', false)
                      if (get('family_info.mother_date_of_birth') === 'N/A') set('family_info.mother_date_of_birth', '')
                    }
                  }}
                />
                Do not know
              </label>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Is your mother in the U.S.?</label>
            <div className="mt-1 flex items-center space-x-6">
              {yesNo.map(opt => (
                <label key={opt} className="inline-flex items-center">
                  <input type="radio" name="mother_in_us" className="mr-2" checked={get('family_info.mother_in_us') === opt} onChange={() => set('family_info.mother_in_us', opt)} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            {motherInUS && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700">Mother's Status</label>
                <select
                  value={get('family_info.mother_status')}
                  onChange={(e) => set('family_info.mother_status', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select status</option>
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Immediate relatives */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Do you have any immediate relatives, not including parents, in the United States?</label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="immediate_relatives_us" className="mr-2" checked={get('family_info.immediate_relatives_us') === opt} onChange={() => set('family_info.immediate_relatives_us', opt)} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        {immediateRelativesUS ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Surnames</label>
              <input
                type="text"
                value={get('family_info.relative_surnames')}
                onChange={(e) => set('family_info.relative_surnames', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Given Names</label>
              <input
                type="text"
                value={get('family_info.relative_given_names')}
                onChange={(e) => set('family_info.relative_given_names', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Relationship To You</label>
              <select
                value={get('family_info.relative_relationship')}
                onChange={(e) => set('family_info.relative_relationship', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select</option>
                {relOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Relative Status</label>
              <select
                value={get('family_info.relative_status')}
                onChange={(e) => set('family_info.relative_status', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select status</option>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700">Do you have any other relatives in the United States?</label>
            <div className="mt-1 flex items-center space-x-6">
              {yesNo.map(opt => (
                <label key={opt} className="inline-flex items-center">
                  <input type="radio" name="other_relatives_us" className="mr-2" checked={get('family_info.other_relatives_us') === opt} onChange={() => set('family_info.other_relatives_us', opt)} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



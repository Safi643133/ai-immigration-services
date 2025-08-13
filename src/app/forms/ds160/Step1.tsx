import { countries } from './countries'
import type { StepProps } from './types'

export default function Step1({ formData, onChange }: StepProps) {
  const get = (key: string) => formData[key] || ''
  const set = (key: string, val: any) => onChange(key, val)
  const yesNo = ['Yes', 'No']

  const otherNamesUsed = (get('personal_info.other_names_used') || '').toString().toLowerCase() === 'yes'
  const telecodeName = (get('personal_info.telecode_name') || '').toString().toLowerCase() === 'yes'
  const fullNameNativeNA = get('personal_info.full_name_native_na') === true || get('personal_info.full_name_native_alphabet') === 'N/A'
  const pobStateNA = get('personal_info.place_of_birth_state_na') === true || get('personal_info.place_of_birth_state') === 'N/A'
  const setUpper = (key: string, val: string) => set(key, (val || '').toUpperCase())

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Surname (Write in capital) <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={get('personal_info.surnames')}
            onChange={(e) => setUpper('personal_info.surnames', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm uppercase"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Given Names (Write in capital) <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={get('personal_info.given_names')}
            onChange={(e) => setUpper('personal_info.given_names', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm uppercase"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Full Name in Native Alphabet</label>
        <div className="flex items-center space-x-3 mt-1">
          <input
            type="text"
            value={fullNameNativeNA ? 'N/A' : get('personal_info.full_name_native_alphabet')}
            onChange={(e) => set('personal_info.full_name_native_alphabet', e.target.value)}
            className="flex-1 rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
            disabled={fullNameNativeNA}
            placeholder="Enter native script name"
          />
          <label className="inline-flex items-center text-sm text-gray-700">
            <input
              type="checkbox"
              className="mr-2"
              checked={fullNameNativeNA}
              onChange={(e) => {
                if (e.target.checked) {
                  set('personal_info.full_name_native_na', true)
                  set('personal_info.full_name_native_alphabet', 'N/A')
                } else {
                  set('personal_info.full_name_native_na', false)
                  if (get('personal_info.full_name_native_alphabet') === 'N/A') {
                    set('personal_info.full_name_native_alphabet', '')
                  }
                }
              }}
            />
            NA (Does Not Apply / Technology Not Available)
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Have you ever used other names?</label>
          <div className="mt-2 flex items-center space-x-6">
            {yesNo.map((opt) => (
              <label key={opt} className="inline-flex items-center">
                <input
                  type="radio"
                  name="other_names_used"
                  className="mr-2 text-black"
                  checked={get('personal_info.other_names_used') === opt}
                  onChange={() => set('personal_info.other_names_used', opt)}
                />
                <span className='text-black'>{opt}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Do you have a telecode that represents your name?</label>
          <div className="mt-2 flex items-center space-x-6">
            {yesNo.map((opt) => (
              <label key={opt} className="inline-flex items-center">
                <input
                  type="radio"
                  name="telecode_name"
                  className="mr-2"
                  checked={get('personal_info.telecode_name') === opt}
                  onChange={() => set('personal_info.telecode_name', opt)}
                />
                <span className='text-black'>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {otherNamesUsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Other Surnames Used</label>
            <input
              type="text"
              value={get('personal_info.other_surnames_used')}
              onChange={(e) => setUpper('personal_info.other_surnames_used', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm uppercase"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Other Given Names Used</label>
            <input
              type="text"
              value={get('personal_info.other_given_names_used')}
              onChange={(e) => setUpper('personal_info.other_given_names_used', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm uppercase"
            />
          </div>
        </div>
      )}

      {telecodeName && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Telecode Surnames</label>
            <input
              type="text"
              value={get('personal_info.telecode_surnames')}
              onChange={(e) => set('personal_info.telecode_surnames', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Telecode Given Names</label>
            <input
              type="text"
              value={get('personal_info.telecode_given_names')}
              onChange={(e) => set('personal_info.telecode_given_names', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Sex <span className="text-red-500">*</span></label>
          <select
            value={get('personal_info.sex')}
            onChange={(e) => set('personal_info.sex', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Marital Status <span className="text-red-500">*</span></label>
          <select
            value={get('personal_info.marital_status')}
            onChange={(e) => set('personal_info.marital_status', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="">Select</option>
            <option value="MARRIED">MARRIED</option>
            <option value="COMMON LAW MARRIAGE">COMMON LAW MARRIAGE</option>
            <option value="CIVIL UNION / DOMESTIC PARTNERSHIP">CIVIL UNION / DOMESTIC PARTNERSHIP</option>
            <option value="SINGLE">SINGLE</option>
            <option value="WIDOWED">WIDOWED</option>
            <option value="DIVORCED">DIVORCED</option>
            <option value="LEGALLY SEPARATED">LEGALLY SEPARATED</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date of Birth <span className="text-red-500">*</span></label>
          <input
            type="date"
            value={get('personal_info.date_of_birth')}
            onChange={(e) => set('personal_info.date_of_birth', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">City of Birth <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={get('personal_info.place_of_birth_city')}
            onChange={(e) => set('personal_info.place_of_birth_city', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">State/Province of Birth</label>
          <div className="flex items-center space-x-3 mt-1">
            <input
              type="text"
              value={pobStateNA ? 'N/A' : get('personal_info.place_of_birth_state')}
              onChange={(e) => set('personal_info.place_of_birth_state', e.target.value)}
              placeholder='Enter state/province'
              className="flex-1 rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              disabled={pobStateNA}
            />
            <label className="inline-flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                className="mr-2"
                checked={pobStateNA}
                onChange={(e) => {
                  if (e.target.checked) {
                    set('personal_info.place_of_birth_state_na', true)
                    set('personal_info.place_of_birth_state', 'N/A')
                  } else {
                    set('personal_info.place_of_birth_state_na', false)
                    if (get('personal_info.place_of_birth_state') === 'N/A') {
                      set('personal_info.place_of_birth_state', '')
                    }
                  }
                }}
              />
              NA (Does Not Apply)
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Country/Region of Birth <span className="text-red-500">*</span></label>
          <select
            value={get('personal_info.place_of_birth_country')}
            onChange={(e) => set('personal_info.place_of_birth_country', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="">Select a country</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}



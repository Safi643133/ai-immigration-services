import type { StepProps } from './types'
import { countries } from './countries'

export default function Step7({ formData, onChange }: StepProps) {
  const get = (key: string) => formData[key] || ''
  const set = (key: string, val: any) => onChange(key, val)
  const yesNo = ['Yes', 'No']

  const passportTypes = ['Regular', 'Official', 'Diplomatic', 'Laizzez Passer', 'Other']

  const bookNumberNA = get('passport_info.passport_book_number_na') === true || get('passport_info.passport_book_number') === 'N/A'
  const expiryNA = get('passport_info.passport_expiry_na') === true || get('passport_info.passport_expiry_date') === 'N/A'

  const lostStolen = (get('passport_info.passport_lost_stolen') || '').toString().toLowerCase() === 'yes'
  const lostNumberNA = get('passport_info.lost_passport_number_na') === true || get('passport_info.lost_passport_number') === 'N/A'

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h6 className="text-sm font-medium text-gray-900">Passport / Travel Document</h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Passport/Travel Document Type</label>
            <select
              value={get('passport_info.passport_type')}
              onChange={(e) => set('passport_info.passport_type', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select</option>
              {passportTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Passport/Travel Document Number</label>
            <input
              type="text"
              value={get('passport_info.passport_number')}
              onChange={(e) => set('passport_info.passport_number', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder='Enter passport number'
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Passport Book Number</label>
          <div className="flex items-center space-x-3 mt-1">
            <input
              type="text"
              value={bookNumberNA ? 'N/A' : get('passport_info.passport_book_number')}
              onChange={(e) => set('passport_info.passport_book_number', e.target.value)}
              className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              disabled={bookNumberNA}
              placeholder='Enter passport book number'
            />
            <label className="inline-flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                className="mr-2"
                checked={bookNumberNA}
                onChange={(e) => {
                  if (e.target.checked) {
                    set('passport_info.passport_book_number_na', true)
                    set('passport_info.passport_book_number', 'N/A')
                  } else {
                    set('passport_info.passport_book_number_na', false)
                    if (get('passport_info.passport_book_number') === 'N/A') set('passport_info.passport_book_number', '')
                  }
                }}
              />
              NA (Does not apply)
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Country/Authority that Issued Passport/Travel Document</label>
          <select
            value={get('passport_info.passport_issuing_country')}
            onChange={(e) => set('passport_info.passport_issuing_country', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select a country</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h6 className="text-sm font-medium text-gray-900">Where was the Passport/Travel Document Issued?</h6>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              value={get('passport_info.passport_issued_city')}
              onChange={(e) => set('passport_info.passport_issued_city', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder='Enter city'
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">State/Province (if shown on passport)</label>
            <input
              type="text"
              value={get('passport_info.passport_issued_state')}
              onChange={(e) => set('passport_info.passport_issued_state', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder='Enter state/province'
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Country/Region</label>
            <select
              value={get('passport_info.passport_issued_country')}
              onChange={(e) => set('passport_info.passport_issued_country', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select a country</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Issuance Date</label>
            <input
              type="date"
              value={get('passport_info.passport_issue_date')}
              onChange={(e) => set('passport_info.passport_issue_date', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder='Enter issuance date'
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Expiration Date</label>
            <div className="flex items-center space-x-3 mt-1">
              <input
                type="date"
                value={expiryNA ? '' : get('passport_info.passport_expiry_date')}
                onChange={(e) => set('passport_info.passport_expiry_date', e.target.value)}
                className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                disabled={expiryNA}
                placeholder='Enter expiration date'
              />
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={expiryNA}
                  onChange={(e) => {
                    if (e.target.checked) {
                      set('passport_info.passport_expiry_na', true)
                      set('passport_info.passport_expiry_date', 'N/A')
                    } else {
                      set('passport_info.passport_expiry_na', false)
                      if (get('passport_info.passport_expiry_date') === 'N/A') set('passport_info.passport_expiry_date', '')
                    }
                  }}
                />
                NA (Does not apply)
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Have you ever lost a passport or had one stolen?</label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="passport_lost_stolen" className="mr-2" checked={get('passport_info.passport_lost_stolen') === opt} onChange={() => set('passport_info.passport_lost_stolen', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
        {lostStolen && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Passport/Travel Document Number</label>
                <div className="flex items-center space-x-3 mt-1">
                  <input
                    type="text"
                    value={lostNumberNA ? 'N/A' : get('passport_info.lost_passport_number')}
                    onChange={(e) => set('passport_info.lost_passport_number', e.target.value)}
                    className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                    disabled={lostNumberNA}
                    placeholder='Enter passport number'
                  />
                  <label className="inline-flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={lostNumberNA}
                      onChange={(e) => {
                        if (e.target.checked) {
                          set('passport_info.lost_passport_number_na', true)
                          set('passport_info.lost_passport_number', 'N/A')
                        } else {
                          set('passport_info.lost_passport_number_na', false)
                          if (get('passport_info.lost_passport_number') === 'N/A') set('passport_info.lost_passport_number', '')
                        }
                      }}
                    />
                    NA (Do not know)
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country/Authority that Issued Passport/Travel Document</label>
                <select
                  value={get('passport_info.lost_passport_country')}
                  onChange={(e) => set('passport_info.lost_passport_country', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select a country</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Explain the Circumstances</label>
              <textarea
                rows={3}
                value={get('passport_info.lost_passport_explanation')}
                onChange={(e) => set('passport_info.lost_passport_explanation', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder='Enter explanation'
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



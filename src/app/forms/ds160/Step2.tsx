import { countries } from './countries'
import type { StepProps } from './types'

export default function Step2({ formData, onChange }: StepProps) {
  const get = (key: string) => formData[key] || ''
  const set = (key: string, val: any) => onChange(key, val)
  const yesNo = ['Yes', 'No']

  const otherNationalities = (get('personal_info.other_nationalities') || '').toString().toLowerCase() === 'yes'
  const otherNatPassport = (get('personal_info.other_nationality_passport') || '').toString().toLowerCase() === 'yes'
  const isPROtherCountry = (get('personal_info.permanent_resident_other_country') || '').toString().toLowerCase() === 'yes'

  const prNAChecked = get('personal_info.permanent_resident_country_na') === true || get('personal_info.permanent_resident_country') === 'N/A'
  const ssnNAChecked = get('personal_info.us_ssn_na') === true || get('personal_info.us_social_security_number') === 'N/A'
  const itinNAChecked = get('personal_info.us_itin_na') === true || get('personal_info.us_taxpayer_id_number') === 'N/A'

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Country/Region of Origin (Nationality) <span className="text-red-500">*</span></label>
        <select
          value={get('personal_info.nationality')}
          onChange={(e) => set('personal_info.nationality', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          <option value="">Select a country</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Do you hold or have you held any other nationality?</label>
          <div className="mt-2 flex items-center space-x-6">
            {yesNo.map((opt) => (
              <label key={opt} className="inline-flex items-center">
                <input
                  type="radio"
                  name="other_nationalities"
                  className="mr-2"
                  checked={get('personal_info.other_nationalities') === opt}
                  onChange={() => set('personal_info.other_nationalities', opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {otherNationalities && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Other Country/Region of Origin (Nationality)</label>
            <select
              value={get('personal_info.other_nationality_country')}
              onChange={(e) => set('personal_info.other_nationality_country', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select a country</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Do you have a passport from this nationality?</label>
            <div className="mt-2 flex items-center space-x-6">
              {yesNo.map((opt) => (
                <label key={opt} className="inline-flex items-center">
                  <input
                    type="radio"
                    name="other_nationality_passport"
                    className="mr-2"
                    checked={get('personal_info.other_nationality_passport') === opt}
                    onChange={() => set('personal_info.other_nationality_passport', opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {otherNatPassport && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Passport Number</label>
              <input
                type="text"
                value={get('personal_info.other_nationality_passport_number')}
                onChange={(e) => set('personal_info.other_nationality_passport_number', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Are you a permanent resident of a country/region other than your nationality?</label>
          <div className="mt-2 flex items-center space-x-6">
            {yesNo.map((opt) => (
              <label key={opt} className="inline-flex items-center">
                <input
                  type="radio"
                  name="permanent_resident_other_country"
                  className="mr-2"
                  checked={get('personal_info.permanent_resident_other_country') === opt}
                  onChange={() => set('personal_info.permanent_resident_other_country', opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {isPROtherCountry && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Country/Region of Permanent Residence</label>
            <select
              value={get('personal_info.permanent_resident_country')}
              onChange={(e) => set('personal_info.permanent_resident_country', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select a country</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Country/Region of Permanent Residence</label>
        <div className="flex items-center space-x-3 mt-1">
          <select
            value={prNAChecked ? 'N/A' : get('personal_info.permanent_resident_country')}
            onChange={(e) => set('personal_info.permanent_resident_country', e.target.value)}
            className="flex-1 rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
            disabled={prNAChecked}
          >
            <option value="">Select a country</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <label className="inline-flex items-center text-sm text-gray-700">
            <input
              type="checkbox"
              className="mr-2"
              checked={prNAChecked}
              onChange={(e) => {
                if (e.target.checked) {
                  set('personal_info.permanent_resident_country_na', true)
                  set('personal_info.permanent_resident_country', 'N/A')
                } else {
                  set('personal_info.permanent_resident_country_na', false)
                  if (get('personal_info.permanent_resident_country') === 'N/A') {
                    set('personal_info.permanent_resident_country', '')
                  }
                }
              }}
            />
            NA (Does Not Apply)
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">U.S. Social Security Number</label>
          <div className="flex items-center space-x-3 mt-1">
            <input
              type="text"
              value={ssnNAChecked ? 'N/A' : get('personal_info.us_social_security_number')}
              onChange={(e) => set('personal_info.us_social_security_number', e.target.value)}
              className="flex-1 rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              disabled={ssnNAChecked}
              placeholder="XXX-XX-XXXX"
            />
            <label className="inline-flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                className="mr-2"
                checked={ssnNAChecked}
                onChange={(e) => {
                  if (e.target.checked) {
                    set('personal_info.us_ssn_na', true)
                    set('personal_info.us_social_security_number', 'N/A')
                  } else {
                    set('personal_info.us_ssn_na', false)
                    if (get('personal_info.us_social_security_number') === 'N/A') {
                      set('personal_info.us_social_security_number', '')
                    }
                  }
                }}
              />
              NA (Does Not Apply)
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">U.S. Taxpayer ID Number</label>
          <div className="flex items-center space-x-3 mt-1">
            <input
              type="text"
              value={itinNAChecked ? 'N/A' : get('personal_info.us_taxpayer_id_number')}
              onChange={(e) => set('personal_info.us_taxpayer_id_number', e.target.value)}
              className="flex-1 rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={itinNAChecked}
              placeholder="ITIN"
            />
            <label className="inline-flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                className="mr-2"
                checked={itinNAChecked}
                onChange={(e) => {
                  if (e.target.checked) {
                    set('personal_info.us_itin_na', true)
                    set('personal_info.us_taxpayer_id_number', 'N/A')
                  } else {
                    set('personal_info.us_itin_na', false)
                    if (get('personal_info.us_taxpayer_id_number') === 'N/A') {
                      set('personal_info.us_taxpayer_id_number', '')
                    }
                  }
                }}
              />
              NA (Does Not Apply)
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}



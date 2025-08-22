import { countries } from './countries'
import type { StepProps } from './types'

export default function Step2({ formData, onChange }: StepProps) {
  const get = (key: string) => formData[key] || ''
  const set = (key: string, val: any) => onChange(key, val)
  const yesNo = ['Yes', 'No']

  const otherNationalities = (get('personal_info.other_nationalities') || '').toString().toLowerCase() === 'yes'
  const isPROtherCountry = (get('personal_info.permanent_resident_other_country') || '').toString().toLowerCase() === 'yes'

  const ssnNAChecked = get('personal_info.us_ssn_na') === true || get('personal_info.us_social_security_number') === 'N/A'
  const itinNAChecked = get('personal_info.us_itin_na') === true || get('personal_info.us_taxpayer_id_number') === 'N/A'
  const ninNAChecked = get('personal_info.national_identification_number_na') === true || get('personal_info.national_identification_number') === 'N/A'

  // Manage dynamic list of other nationalities
  const natList = Array.isArray(formData['personal_info.other_nationalities_list'])
    ? (formData['personal_info.other_nationalities_list'] as Array<any>)
    : []

  const addNationality = () => {
    const next = [...natList, { country: '', has_passport: '', passport_number: '' }]
    set('personal_info.other_nationalities_list', next)
  }

  const updateNationality = (index: number, field: string, value: any) => {
    const next = natList.map((item: any, i: number) => (i === index ? { ...item, [field]: value } : item))
    set('personal_info.other_nationalities_list', next)
  }

  const removeNationality = (index: number) => {
    const next = natList.filter((_: any, i: number) => i !== index)
    set('personal_info.other_nationalities_list', next)
  }

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
                  onChange={() => {
                    set('personal_info.other_nationalities', opt)
                    if (opt === 'Yes') {
                      const existing = Array.isArray(formData['personal_info.other_nationalities_list'])
                        ? (formData['personal_info.other_nationalities_list'] as Array<any>)
                        : []
                      if (existing.length === 0) {
                        set('personal_info.other_nationalities_list', [
                          { country: '', has_passport: '', passport_number: '' }
                        ])
                      }
                    } else {
                      set('personal_info.other_nationalities_list', [])
                    }
                  }}
                />
                <span className='text-black'>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {otherNationalities && (
        <div className="space-y-4">
          {natList.map((entry, idx) => (
            <div key={idx} className="border rounded-md p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-800">Other Nationality #{idx + 1}</h4>
                {natList.length > 1 && (
                  <button
                    type="button"
                    className="text-red-600 text-sm"
                    onClick={() => removeNationality(idx)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Other Country/Region of Origin (Nationality)</label>
                <select
                  value={entry.country}
                  onChange={(e) => updateNationality(idx, 'country', e.target.value)}
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
                        name={`other_nationality_passport_${idx}`}
                        className="mr-2"
                        checked={entry.has_passport === opt}
                        onChange={() => updateNationality(idx, 'has_passport', opt)}
                      />
                      <span className='text-black'>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {entry.has_passport === 'Yes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Passport Number</label>
                  <input
                    type="text"
                    value={entry.passport_number}
                    onChange={(e) => updateNationality(idx, 'passport_number', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder='Enter passport number'
                  />
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addNationality}
            className="text-indigo-600 text-sm"
          >
            + Add Another Nationality
          </button>
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
                <span className='text-black'>{opt}</span>
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
        <label className="block text-sm font-medium text-gray-700">National Identification Number</label>
        <div className="flex items-center space-x-3 mt-1">
          <input
            type="text"
            value={ninNAChecked ? 'N/A' : get('personal_info.national_identification_number')}
            onChange={(e) => set('personal_info.national_identification_number', e.target.value)}
            className="flex-1 rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
            disabled={ninNAChecked}
            placeholder="Enter National ID Number"
          />
          <label className="inline-flex items-center text-sm text-gray-700">
            <input
              type="checkbox"
              className="mr-2"
              checked={ninNAChecked}
              onChange={(e) => {
                if (e.target.checked) {
                  set('personal_info.national_identification_number_na', true)
                  set('personal_info.national_identification_number', 'N/A')
                } else {
                  set('personal_info.national_identification_number_na', false)
                  if (get('personal_info.national_identification_number') === 'N/A') {
                    set('personal_info.national_identification_number', '')
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
          <div className="flex items-center space-x-2 mt-1">
            <input
              type="text"
              maxLength={3}
              value={ssnNAChecked ? '' : get('personal_info.us_social_security_number_1') || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 3)
                set('personal_info.us_social_security_number_1', value)
                // Auto-advance to next field if 3 digits entered
                if (value.length === 3) {
                  const nextField = e.target.parentElement?.nextElementSibling?.querySelector('input')
                  if (nextField) nextField.focus()
                }
              }}
              className="w-16 rounded-md border-gray-300 p-2 text-center text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              disabled={ssnNAChecked}
              placeholder="XXX"
            />
            <span className="text-gray-500">-</span>
            <input
              type="text"
              maxLength={2}
              value={ssnNAChecked ? '' : get('personal_info.us_social_security_number_2') || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 2)
                set('personal_info.us_social_security_number_2', value)
                // Auto-advance to next field if 2 digits entered
                if (value.length === 2) {
                  const nextField = e.target.parentElement?.nextElementSibling?.querySelector('input')
                  if (nextField) nextField.focus()
                }
              }}
              className="w-12 rounded-md border-gray-300 p-2 text-center text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              disabled={ssnNAChecked}
              placeholder="XX"
            />
            <span className="text-gray-500">-</span>
            <input
              type="text"
              maxLength={4}
              value={ssnNAChecked ? '' : get('personal_info.us_social_security_number_3') || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                set('personal_info.us_social_security_number_3', value)
              }}
              className="w-20 rounded-md border-gray-300 p-2 text-center text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              disabled={ssnNAChecked}
              placeholder="XXXX"
            />
            <label className="inline-flex items-center text-sm text-gray-700 ml-2">
              <input
                type="checkbox"
                className="mr-2"
                checked={ssnNAChecked}
                onChange={(e) => {
                  if (e.target.checked) {
                    set('personal_info.us_ssn_na', true)
                    set('personal_info.us_social_security_number_1', '')
                    set('personal_info.us_social_security_number_2', '')
                    set('personal_info.us_social_security_number_3', '')
                  } else {
                    set('personal_info.us_ssn_na', false)
                  }
                }}
              />
              Does Not Apply
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



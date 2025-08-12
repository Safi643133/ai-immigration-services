import type { StepProps } from './types'
import { countries } from './countries'

export default function Step10({ formData, onChange }: StepProps) {
  const get = (key: string) => formData[key] || ''
  const set = (key: string, val: any) => onChange(key, val)

  const occupationOptions = [
    'AGRICULTURE', 'ARTIST/PERFORMER', 'BUSINESS', 'COMMUNICATIONS', 'COMPUTER SCIENCE', 'CULINARY/FOOD SERVICES',
    'EDUCATION', 'ENGINEERING', 'GOVERNMENT', 'HOMEMAKER', 'LEGAL PROFESSION', 'MEDICAL/HEALTH', 'MILITARY',
    'NATURAL SCIENCE', 'NOT EMPLOYED', 'PHYSICAL SCIENCES', 'RELIGIOUS VOCATION', 'RESEARCH', 'RETIRED',
    'SOCIAL SCIENCE', 'STUDENT', 'OTHER'
  ]

  const stateNA = get('present_work_education.employer_state_na') === true || get('present_work_education.employer_state') === 'N/A'
  const postalNA = get('present_work_education.employer_postal_na') === true || get('present_work_education.employer_postal_code') === 'N/A'
  const incomeNA = get('present_work_education.monthly_income_na') === true || get('present_work_education.monthly_income') === 'N/A'

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Primary Occupation</label>
        <select
          value={get('present_work_education.primary_occupation')}
          onChange={(e) => set('present_work_education.primary_occupation', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Select</option>
          {occupationOptions.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Present Employer or School Name</label>
        <input
          type="text"
          value={get('present_work_education.employer_school_name')}
          onChange={(e) => set('present_work_education.employer_school_name', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="space-y-4">
        <h6 className="text-sm font-medium text-gray-900">Present Employer or School Address</h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Street Address (Line 1)</label>
            <input
              type="text"
              value={get('present_work_education.employer_address_line1')}
              onChange={(e) => set('present_work_education.employer_address_line1', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Street Address (Line 2)</label>
            <input
              type="text"
              value={get('present_work_education.employer_address_line2')}
              onChange={(e) => set('present_work_education.employer_address_line2', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              value={get('present_work_education.employer_city')}
              onChange={(e) => set('present_work_education.employer_city', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">State/Province</label>
            <div className="flex items-center space-x-3 mt-1">
              <input
                type="text"
                value={stateNA ? 'N/A' : get('present_work_education.employer_state')}
                onChange={(e) => set('present_work_education.employer_state', e.target.value)}
                className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                disabled={stateNA}
              />
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={stateNA}
                  onChange={(e) => {
                    if (e.target.checked) {
                      set('present_work_education.employer_state_na', true)
                      set('present_work_education.employer_state', 'N/A')
                    } else {
                      set('present_work_education.employer_state_na', false)
                      if (get('present_work_education.employer_state') === 'N/A') set('present_work_education.employer_state', '')
                    }
                  }}
                />
                NA (Does not apply)
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Postal Zone / ZIP Code</label>
            <div className="flex items-center space-x-3 mt-1">
              <input
                type="text"
                value={postalNA ? 'N/A' : get('present_work_education.employer_postal_code')}
                onChange={(e) => set('present_work_education.employer_postal_code', e.target.value)}
                className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                disabled={postalNA}
              />
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={postalNA}
                  onChange={(e) => {
                    if (e.target.checked) {
                      set('present_work_education.employer_postal_na', true)
                      set('present_work_education.employer_postal_code', 'N/A')
                    } else {
                      set('present_work_education.employer_postal_na', false)
                      if (get('present_work_education.employer_postal_code') === 'N/A') set('present_work_education.employer_postal_code', '')
                    }
                  }}
                />
                NA (Does not apply)
              </label>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Country / Region</label>
          <select
            value={get('present_work_education.employer_country')}
            onChange={(e) => set('present_work_education.employer_country', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select a country</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              value={get('present_work_education.employer_phone')}
              onChange={(e) => set('present_work_education.employer_phone', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={get('present_work_education.start_date')}
              onChange={(e) => set('present_work_education.start_date', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Monthly Income in Local Currency (if employed)</label>
            <div className="flex items-center space-x-3 mt-1">
              <input
                type="text"
                value={incomeNA ? 'N/A' : get('present_work_education.monthly_income')}
                onChange={(e) => set('present_work_education.monthly_income', e.target.value)}
                className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                disabled={incomeNA}
              />
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={incomeNA}
                  onChange={(e) => {
                    if (e.target.checked) {
                      set('present_work_education.monthly_income_na', true)
                      set('present_work_education.monthly_income', 'N/A')
                    } else {
                      set('present_work_education.monthly_income_na', false)
                      if (get('present_work_education.monthly_income') === 'N/A') set('present_work_education.monthly_income', '')
                    }
                  }}
                />
                NA (Does not apply)
              </label>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Briefly describe your duties</label>
          <textarea
            rows={3}
            value={get('present_work_education.job_duties')}
            onChange={(e) => set('present_work_education.job_duties', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>
    </div>
  )
}



import type { StepProps } from './types'
import { countries } from './countries'

export default function Step11({ formData, onChange }: StepProps) {
  const get = (key: string) => formData[key] || ''
  const set = (key: string, val: any) => onChange(key, val)
  const yesNo = ['Yes', 'No']

  const previouslyEmployed = (get('previous_work_education.previously_employed') || '').toString().toLowerCase() === 'yes'
  const attendedEducation = (get('previous_work_education.attended_educational_institutions') || '').toString().toLowerCase() === 'yes'

  const prevStateNA = get('previous_work_education.previous_employer_state_na') === true || get('previous_work_education.previous_employer_state') === 'N/A'
  const prevPostalNA = get('previous_work_education.previous_employer_postal_na') === true || get('previous_work_education.previous_employer_postal_code') === 'N/A'
  const supSurnameNA = get('previous_work_education.previous_supervisor_surname_na') === true || get('previous_work_education.previous_supervisor_surname') === 'N/A'
  const supGivenNA = get('previous_work_education.previous_supervisor_given_names_na') === true || get('previous_work_education.previous_supervisor_given_names') === 'N/A'

  const eduStateNA = get('previous_work_education.educational_state_na') === true || get('previous_work_education.educational_state') === 'N/A'
  const eduPostalNA = get('previous_work_education.educational_postal_na') === true || get('previous_work_education.educational_postal_code') === 'N/A'

  return (
    <div className="space-y-8">
      {/* Previous Employment */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Were you previously employed?</label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="previously_employed" className="mr-2" checked={get('previous_work_education.previously_employed') === opt} onChange={() => set('previous_work_education.previously_employed', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>

        {previouslyEmployed && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Employer Name</label>
              <input
                type="text"
                value={get('previous_work_education.previous_employer_name')}
                onChange={(e) => set('previous_work_education.previous_employer_name', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder='Enter employer name'
              />
            </div>

            <h6 className="text-sm font-medium text-gray-900">Employer Address</h6>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employer Street Address (Line 1)</label>
                <input
                  type="text"
                  value={get('previous_work_education.previous_employer_address_line1')}
                  onChange={(e) => set('previous_work_education.previous_employer_address_line1', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder='Enter address line 1'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Employer Street Address (Line 2)</label>
                <input
                  type="text"
                  value={get('previous_work_education.previous_employer_address_line2')}
                  onChange={(e) => set('previous_work_education.previous_employer_address_line2', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder='Enter address line 2'
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">City/Town</label>
                <input
                  type="text"
                  value={get('previous_work_education.previous_employer_city')}
                  onChange={(e) => set('previous_work_education.previous_employer_city', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder='Enter city'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State/Province</label>
                <div className="flex items-center space-x-3 mt-1">
                  <input
                    type="text"
                    value={prevStateNA ? 'N/A' : get('previous_work_education.previous_employer_state')}
                    onChange={(e) => set('previous_work_education.previous_employer_state', e.target.value)}
                    className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                    disabled={prevStateNA}
                    placeholder='Enter state/province'
                  />
                  <label className="inline-flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={prevStateNA}
                      onChange={(e) => {
                        if (e.target.checked) {
                          set('previous_work_education.previous_employer_state_na', true)
                          set('previous_work_education.previous_employer_state', 'N/A')
                        } else {
                          set('previous_work_education.previous_employer_state_na', false)
                          if (get('previous_work_education.previous_employer_state') === 'N/A') set('previous_work_education.previous_employer_state', '')
                        }
                      }}
                    />
                    NA (Does not apply)
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Postal Zone/ZIP Code</label>
                <div className="flex items-center space-x-3 mt-1">
                  <input
                    type="text"
                    value={prevPostalNA ? 'N/A' : get('previous_work_education.previous_employer_postal_code')}
                    onChange={(e) => set('previous_work_education.previous_employer_postal_code', e.target.value)}
                    className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                    disabled={prevPostalNA}
                    placeholder='Enter zip code'
                  />
                  <label className="inline-flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={prevPostalNA}
                      onChange={(e) => {
                        if (e.target.checked) {
                          set('previous_work_education.previous_employer_postal_na', true)
                          set('previous_work_education.previous_employer_postal_code', 'N/A')
                        } else {
                          set('previous_work_education.previous_employer_postal_na', false)
                          if (get('previous_work_education.previous_employer_postal_code') === 'N/A') set('previous_work_education.previous_employer_postal_code', '')
                        }
                      }}
                    />
                    NA (Does not apply)
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <select
                value={get('previous_work_education.previous_employer_country')}
                onChange={(e) => set('previous_work_education.previous_employer_country', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select a country</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employer Telephone Number</label>
                <input
                  type="tel"
                  value={get('previous_work_education.previous_employer_phone')}
                  onChange={(e) => set('previous_work_education.previous_employer_phone', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder='Enter phone number'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Job Title</label>
                <input
                  type="text"
                  value={get('previous_work_education.previous_job_title')}
                  onChange={(e) => set('previous_work_education.previous_job_title', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder='Enter job title'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Supervisor's Surname</label>
                <div className="flex items-center space-x-3 mt-1">
                  <input
                    type="text"
                    value={supSurnameNA ? 'N/A' : get('previous_work_education.previous_supervisor_surname')}
                    onChange={(e) => set('previous_work_education.previous_supervisor_surname', e.target.value)}
                    className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                    disabled={supSurnameNA}
                    placeholder='Enter surname'
                  />
                  <label className="inline-flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={supSurnameNA}
                      onChange={(e) => {
                        if (e.target.checked) {
                          set('previous_work_education.previous_supervisor_surname_na', true)
                          set('previous_work_education.previous_supervisor_surname', 'N/A')
                        } else {
                          set('previous_work_education.previous_supervisor_surname_na', false)
                          if (get('previous_work_education.previous_supervisor_surname') === 'N/A') set('previous_work_education.previous_supervisor_surname', '')
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
                <label className="block text-sm font-medium text-gray-700">Supervisor's Given Names</label>
                <div className="flex items-center space-x-3 mt-1">
                  <input
                    type="text"
                    value={supGivenNA ? 'N/A' : get('previous_work_education.previous_supervisor_given_names')}
                    onChange={(e) => set('previous_work_education.previous_supervisor_given_names', e.target.value)}
                    className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                    disabled={supGivenNA}
                    placeholder='Enter given names'
                  />
                  <label className="inline-flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={supGivenNA}
                      onChange={(e) => {
                        if (e.target.checked) {
                          set('previous_work_education.previous_supervisor_given_names_na', true)
                          set('previous_work_education.previous_supervisor_given_names', 'N/A')
                        } else {
                          set('previous_work_education.previous_supervisor_given_names_na', false)
                          if (get('previous_work_education.previous_supervisor_given_names') === 'N/A') set('previous_work_education.previous_supervisor_given_names', '')
                        }
                      }}
                    />
                    Do not know
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Employment Date From</label>
                <input
                  type="date"
                  value={get('previous_work_education.previous_employment_from')}
                  onChange={(e) => set('previous_work_education.previous_employment_from', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder='Enter date of birth'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Employment Date To</label>
                <input
                  type="date"
                  value={get('previous_work_education.previous_employment_to')}
                  onChange={(e) => set('previous_work_education.previous_employment_to', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder='Enter date of birth'
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Briefly describe your duties</label>
              <textarea
                rows={3}
                value={get('previous_work_education.previous_job_duties')}
                onChange={(e) => set('previous_work_education.previous_job_duties', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder='Enter duties'
              />
            </div>
          </div>
        )}
      </div>

      {/* Education */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Have you attended any educational institutions at a secondary level or above?</label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="attended_educational_institutions" className="mr-2" checked={get('previous_work_education.attended_educational_institutions') === opt} onChange={() => set('previous_work_education.attended_educational_institutions', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>

        {attendedEducation && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name of Institution</label>
              <input
                type="text"
                value={get('previous_work_education.educational_institution_name')}
                onChange={(e) => set('previous_work_education.educational_institution_name', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder='Enter institution name'
              />
            </div>
            <h6 className="text-sm font-medium text-gray-900">Address</h6>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Street Address (Line 1)</label>
                <input
                  type="text"
                  value={get('previous_work_education.educational_address_line1')}
                  onChange={(e) => set('previous_work_education.educational_address_line1', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder='Enter address line 1'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Street Address (Line 2)</label>
                <input
                  type="text"
                  value={get('previous_work_education.educational_address_line2')}
                  onChange={(e) => set('previous_work_education.educational_address_line2', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder='Enter address line 2'
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  value={get('previous_work_education.educational_city')}
                  onChange={(e) => set('previous_work_education.educational_city', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder='Enter city'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State/Province</label>
                <div className="flex items-center space-x-3 mt-1">
                  <input
                    type="text"
                    value={eduStateNA ? 'N/A' : get('previous_work_education.educational_state')}
                    onChange={(e) => set('previous_work_education.educational_state', e.target.value)}
                    className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                    disabled={eduStateNA}
                    placeholder='Enter state/province'
                  />
                  <label className="inline-flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={eduStateNA}
                      onChange={(e) => {
                        if (e.target.checked) {
                          set('previous_work_education.educational_state_na', true)
                          set('previous_work_education.educational_state', 'N/A')
                        } else {
                          set('previous_work_education.educational_state_na', false)
                          if (get('previous_work_education.educational_state') === 'N/A') set('previous_work_education.educational_state', '')
                        }
                      }}
                    />
                    NA (Does not apply)
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Postal Zone/ZIP Code</label>
                <div className="flex items-center space-x-3 mt-1">
                  <input
                    type="text"
                    value={eduPostalNA ? 'N/A' : get('previous_work_education.educational_postal_code')}
                    onChange={(e) => set('previous_work_education.educational_postal_code', e.target.value)}
                    className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                    disabled={eduPostalNA}
                    placeholder='Enter zip code'
                  />
                  <label className="inline-flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={eduPostalNA}
                      onChange={(e) => {
                        if (e.target.checked) {
                          set('previous_work_education.educational_postal_na', true)
                          set('previous_work_education.educational_postal_code', 'N/A')
                        } else {
                          set('previous_work_education.educational_postal_na', false)
                          if (get('previous_work_education.educational_postal_code') === 'N/A') set('previous_work_education.educational_postal_code', '')
                        }
                      }}
                    />
                    NA (Does not apply)
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <select
                value={get('previous_work_education.educational_country')}
                onChange={(e) => set('previous_work_education.educational_country', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select a country</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Course of Study</label>
                <input
                  type="text"
                  value={get('previous_work_education.course_of_study')}
                  onChange={(e) => set('previous_work_education.course_of_study', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder='Enter course of study'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Attendance From</label>
                <input
                  type="date"
                  value={get('previous_work_education.educational_attendance_from')}
                  onChange={(e) => set('previous_work_education.educational_attendance_from', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder='Enter date of birth'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Attendance To</label>
                <input
                  type="date"
                  value={get('previous_work_education.educational_attendance_to')}
                  onChange={(e) => set('previous_work_education.educational_attendance_to', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder='Enter date of birth'
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



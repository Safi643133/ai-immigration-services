import type { StepProps } from './types'
import { usStates } from './states'

export default function Step8({ formData, onChange }: StepProps) {
  const get = (key: string) => formData[key] || ''
  const set = (key: string, val: any) => onChange(key, val)
  const yesNo = ['Yes', 'No']

  const hasIndividual = (get('us_contact.has_individual') || '').toString().toLowerCase() === 'yes'
  const emailNA = get('us_contact.contact_email_na') === true || get('us_contact.contact_email') === 'N/A'

  const relationships = [
    'RELATIVE', 'SPOUSE', 'FRIEND', 'BUSINESS ASSOCIATE', 'EMPLOYER', 'SCHOOL OFFICIAL', 'U.S. PETITIONER', 'OTHER'
  ]

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Do you have a specific individual as your U.S. Point of Contact?</label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input type="radio" name="us_contact_has_individual" className="mr-2" checked={get('us_contact.has_individual') === opt} onChange={() => set('us_contact.has_individual', opt)} />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
      </div>

      {hasIndividual ? (
        <div className="space-y-4">
          <h6 className="text-sm font-medium text-gray-900">Contact Person</h6>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Surnames</label>
              <input
                type="text"
                value={get('us_contact.contact_surnames')}
                onChange={(e) => set('us_contact.contact_surnames', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder='Enter surnames'
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Given Names</label>
              <input
                type="text"
                value={get('us_contact.contact_given_names')}
                onChange={(e) => set('us_contact.contact_given_names', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder='Enter given names'
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Relationship To You</label>
            <select
              value={get('us_contact.contact_relationship')}
              onChange={(e) => set('us_contact.contact_relationship', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select</option>
              {relationships.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h6 className="text-sm font-medium text-gray-900">Contact Organization</h6>
          <div>
            <label className="block text-sm font-medium text-gray-700">Organization Name</label>
            <input
              type="text"
              value={get('us_contact.contact_organization')}
              onChange={(e) => set('us_contact.contact_organization', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder='Enter organization name'
              />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Relationship To You</label>
            <select
              value={get('us_contact.contact_relationship')}
              onChange={(e) => set('us_contact.contact_relationship', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select</option>
              {relationships.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Address and Phone Number of Point of Contact */}
      <div className="space-y-4">
        <h6 className="text-sm font-medium text-gray-900">Address and Phone Number of Point of Contact</h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">U.S. Street Address (Line 1)</label>
            <input
              type="text"
              value={get('us_contact.contact_address_line1')}
              onChange={(e) => set('us_contact.contact_address_line1', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder='Enter address line 1'
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">U.S. Street Address (Line 2)</label>
            <input
              type="text"
              value={get('us_contact.contact_address_line2')}
              onChange={(e) => set('us_contact.contact_address_line2', e.target.value)}
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
              value={get('us_contact.contact_city')}
              onChange={(e) => set('us_contact.contact_city', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder='Enter city'
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <select
              value={get('us_contact.contact_state')}
              onChange={(e) => set('us_contact.contact_state', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select a state</option>
              {usStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ZIP Code (if known)</label>
            <input
              type="text"
              value={get('us_contact.contact_zip')}
              onChange={(e) => set('us_contact.contact_zip', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder='Enter zip code'
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              value={get('us_contact.contact_phone')}
              onChange={(e) => set('us_contact.contact_phone', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder='Enter phone number'
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <div className="flex items-center space-x-3 mt-1">
              <input
                type="email"
                value={emailNA ? 'N/A' : get('us_contact.contact_email')}
                onChange={(e) => set('us_contact.contact_email', e.target.value)}
                className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                disabled={emailNA}
                placeholder='Enter Email'
              />
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={emailNA}
                  onChange={(e) => {
                    if (e.target.checked) {
                      set('us_contact.contact_email_na', true)
                      set('us_contact.contact_email', 'N/A')
                    } else {
                      set('us_contact.contact_email_na', false)
                      if (get('us_contact.contact_email') === 'N/A') set('us_contact.contact_email', '')
                    }
                  }}
                />
                NA (Does not apply)
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



import type { StepProps } from './types'
import { visaClassOptions, specifyMap } from './visaOptions'
import { usStates } from './states'

export default function Step3({ formData, onChange }: StepProps) {
  const get = (key: string) => formData[key] || ''
  const set = (key: string, val: any) => onChange(key, val)

  const selectedClass = get('travel_info.purpose_of_trip')
  const specifyOptions = specifyMap[selectedClass] || []
  const yesNo = ['Yes', 'No']
  const hasSpecificPlans = (get('travel_info.specific_travel_plans') || '').toString().toLowerCase() === 'yes'
  const lengthUnits = ['Day(s)', 'Week(s)', 'Month(s)', 'Year(s)']

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Purpose of Trip to the U.S. <span className="text-red-500">*</span></label>
        <select
          value={selectedClass}
          onChange={(e) => {
            set('travel_info.purpose_of_trip', e.target.value)
            set('travel_info.purpose_specify', '')
          }}
          className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          <option value="">Select a visa class</option>
          {visaClassOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {specifyOptions.length > 0 ? (
        <div>
          <label className="block text-sm font-medium text-gray-700">Specify Visa <span className="text-red-500">*</span></label>
          <select
            value={get('travel_info.purpose_specify')}
            onChange={(e) => set('travel_info.purpose_specify', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-4 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            {specifyOptions.map((opt) => (
              <option key={opt} value={opt === 'PLEASE SELECT' ? '' : opt}>{opt}</option>
            ))}
          </select>
        </div>
      ) : selectedClass ? (
        <div className="text-sm text-gray-600">Specify Visa options for this class will be added next.</div>
      ) : null}

      <div>
        <label className="block text-sm font-medium text-gray-700">Have you made specific travel plans?</label>
        <div className="mt-2 flex items-center space-x-6">
          {yesNo.map((opt) => (
            <label key={opt} className="inline-flex items-center">
              <input
                type="radio"
                name="specific_travel_plans"
                className="mr-2"
                checked={get('travel_info.specific_travel_plans') === opt}
                onChange={() => set('travel_info.specific_travel_plans', opt)}
              />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>
      </div>

      {hasSpecificPlans ? (
        <div className="space-y-4">
          <h6 className="text-sm font-medium text-gray-900">Travel Plans</h6>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Arrival Date</label>
              <input
                type="date"
                value={get('travel_info.arrival_date')}
                onChange={(e) => set('travel_info.arrival_date', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Arrival Flight (if known)</label>
              <input
                type="text"
                value={get('travel_info.arrival_flight')}
                onChange={(e) => set('travel_info.arrival_flight', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="AA123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Arrival City</label>
              <input
                type="text"
                value={get('travel_info.arrival_city')}
                onChange={(e) => set('travel_info.arrival_city', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder='Enter arrival city'
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Departure Date</label>
              <input
                type="date"
                value={get('travel_info.departure_date')}
                onChange={(e) => set('travel_info.departure_date', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Departure Flight (if known)</label>
              <input
                type="text"
                value={get('travel_info.departure_flight')}
                onChange={(e) => set('travel_info.departure_flight', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="AA124"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Departure City</label>
              <input
                type="text"
                value={get('travel_info.departure_city')}
                onChange={(e) => set('travel_info.departure_city', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder='Enter departure city'
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={get('travel_info.location')}
              onChange={(e) => set('travel_info.location', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder='Enter location'
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h6 className="text-sm font-medium text-gray-900">Arrival Plans</h6>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Arrival Date</label>
              <input
                type="date"
                value={get('travel_info.arrival_date')}
                onChange={(e) => set('travel_info.arrival_date', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="md:col-span-2 grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Intended length of stay</label>
                <input
                  type="number"
                  min={1}
                  value={get('travel_info.length_of_stay_value')}
                  onChange={(e) => set('travel_info.length_of_stay_value', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder='Enter length of stay'
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Unit</label>
                <select
                  value={get('travel_info.length_of_stay_unit')}
                  onChange={(e) => set('travel_info.length_of_stay_unit', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select unit</option>
                  {lengthUnits.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h6 className="text-sm font-medium text-gray-900">Address where you will stay in the U.S.</h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
            <input
              type="text"
              value={get('travel_info.us_stay_address_line1')}
              onChange={(e) => set('travel_info.us_stay_address_line1', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder='Enter address line 1'
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
            <input
              type="text"
              value={get('travel_info.us_stay_address_line2')}
              onChange={(e) => set('travel_info.us_stay_address_line2', e.target.value)}
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
              value={get('travel_info.us_stay_city')}
              onChange={(e) => set('travel_info.us_stay_city', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder='Enter city'
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <select
              value={get('travel_info.us_stay_state')}
              onChange={(e) => set('travel_info.us_stay_state', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select a state</option>
              {usStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Zip Code</label>
            <input
              type="text"
              value={get('travel_info.us_stay_zip')}
              onChange={(e) => set('travel_info.us_stay_zip', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder='Enter zip code'
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Person/Entity Paying for Your Trip</label>
          <select
            value={get('travel_info.trip_payer')}
            onChange={(e) => set('travel_info.trip_payer', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select</option>
            <option value="Self">Self</option>
            <option value="Other Person">Other Person</option>
            <option value="Present Employer">Present Employer</option>
            <option value="Employer in the U.S">Employer in the U.S</option>
            <option value="Other Company/Organization">Other Company/Organization</option>
          </select>
        </div>
      </div>
    </div>
  )
}



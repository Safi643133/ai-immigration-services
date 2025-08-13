import type { StepProps } from './types'
import { usStates } from './states'

export default function Step5({ formData, onChange }: StepProps) {
  const get = (key: string) => formData[key] || ''
  const set = (key: string, val: any) => onChange(key, val)
  const yesNo = ['Yes', 'No']

  const beenInUS = (get('us_history.been_in_us') || '').toString().toLowerCase() === 'yes'
  const hasUSDL = (get('us_history.us_driver_license') || '').toString().toLowerCase() === 'yes'
  const heldUSVisa = (get('us_history.previous_us_visa') || '').toString().toLowerCase() === 'yes'
  const visaLostStolen = (get('us_history.visa_lost_stolen') || '').toString().toLowerCase() === 'yes'
  const visaCancelled = (get('us_history.visa_cancelled') || '').toString().toLowerCase() === 'yes'
  const visaRefused = (get('us_history.visa_refused') || '').toString().toLowerCase() === 'yes'
  const estaDenied = (get('us_history.esta_denied') || '').toString().toLowerCase() === 'yes'
  const immigrantPetition = (get('us_history.immigrant_petition') || '').toString().toLowerCase() === 'yes'

  const dlUnknown = get('us_history.driver_license_unknown') === true || get('us_history.driver_license_number') === 'N/A'
  const visaNumUnknown = get('us_history.last_visa_number_unknown') === true || get('us_history.last_visa_number') === 'N/A'

  const lengthUnits = ['Less than 24 hours', 'Day(s)', 'Week(s)', 'Month(s)', 'Year(s)']

  return (
    <div className="space-y-8">
      {/* Have you ever been in the U.S.? */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Have you ever been in the U.S.?</label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map((opt) => (
            <label key={opt} className="inline-flex items-center">
              <input
                type="radio"
                name="been_in_us"
                className="mr-2"
                checked={get('us_history.been_in_us') === opt}
                onChange={() => set('us_history.been_in_us', opt)}
              />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>

        {beenInUS && (
          <div className="space-y-4">
            <h6 className="text-sm font-medium text-gray-900">Previous U.S. Visits</h6>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date Arrived</label>
                <input
                  type="date"
                  value={get('us_history.last_visit_date')}
                  onChange={(e) => set('us_history.last_visit_date', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="md:col-span-2 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Length of stay (value)</label>
                  <input
                    type="number"
                    min={0}
                    value={get('us_history.last_visit_length_value')}
                    onChange={(e) => set('us_history.last_visit_length_value', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <select
                    value={get('us_history.last_visit_length_unit')}
                    onChange={(e) => set('us_history.last_visit_length_unit', e.target.value)}
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
      </div>

      {/* U.S. Driver's License (only if been in U.S.) */}
      {beenInUS && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Do you or did you ever hold a U.S. Driver's License?</label>
          <div className="mt-1 flex items-center space-x-6">
            {yesNo.map((opt) => (
              <label key={opt} className="inline-flex items-center">
                <input
                  type="radio"
                  name="us_driver_license"
                  className="mr-2"
                  checked={get('us_history.us_driver_license') === opt}
                  onChange={() => set('us_history.us_driver_license', opt)}
                />
                <span className='text-black'>{opt}</span>
              </label>
            ))}
          </div>

          {hasUSDL && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Driver's License Number</label>
                <div className="flex items-center space-x-3 mt-1">
                  <input
                    type="text"
                    value={dlUnknown ? 'N/A' : get('us_history.driver_license_number')}
                    onChange={(e) => set('us_history.driver_license_number', e.target.value)}
                    className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                    disabled={dlUnknown}
                  />
                  <label className="inline-flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={dlUnknown}
                      onChange={(e) => {
                        if (e.target.checked) {
                          set('us_history.driver_license_unknown', true)
                          set('us_history.driver_license_number', 'N/A')
                        } else {
                          set('us_history.driver_license_unknown', false)
                          if (get('us_history.driver_license_number') === 'N/A') {
                            set('us_history.driver_license_number', '')
                          }
                        }
                      }}
                    />
                    Do not know
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State of Driver's License</label>
                <select
                  value={get('us_history.driver_license_state')}
                  onChange={(e) => set('us_history.driver_license_state', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select a state</option>
                  {usStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Previous U.S. Visa */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Have you ever been issued a U.S. Visa?</label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map((opt) => (
            <label key={opt} className="inline-flex items-center">
              <input
                type="radio"
                name="previous_us_visa"
                className="mr-2"
                checked={get('us_history.previous_us_visa') === opt}
                onChange={() => set('us_history.previous_us_visa', opt)}
              />
              <span className='text-black'>{opt}</span>
            </label>
          ))}
        </div>

        {heldUSVisa && (
          <div className="space-y-4">
            <h6 className="text-sm font-medium text-gray-900">Previous U.S. Visa</h6>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date Last Visa Was Issued</label>
                <input
                  type="date"
                  value={get('us_history.last_visa_issued_date')}
                  onChange={(e) => set('us_history.last_visa_issued_date', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Visa Number</label>
                <div className="flex items-center space-x-3 mt-1">
                  <input
                    type="text"
                    value={visaNumUnknown ? 'N/A' : get('us_history.last_visa_number')}
                    onChange={(e) => set('us_history.last_visa_number', e.target.value)}
                    className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                    disabled={visaNumUnknown}
                  />
                  <label className="inline-flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={visaNumUnknown}
                      onChange={(e) => {
                        if (e.target.checked) {
                          set('us_history.last_visa_number_unknown', true)
                          set('us_history.last_visa_number', 'N/A')
                        } else {
                          set('us_history.last_visa_number_unknown', false)
                          if (get('us_history.last_visa_number') === 'N/A') {
                            set('us_history.last_visa_number', '')
                          }
                        }
                      }}
                    />
                    Do not know
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Are you applying for the same type of visa?</label>
                <div className="mt-1 flex items-center space-x-6">
                  {yesNo.map(opt => (
                    <label key={opt} className="inline-flex items-center">
                      <input type="radio" name="same_visa_type" className="mr-2" checked={get('us_history.same_visa_type') === opt} onChange={() => set('us_history.same_visa_type', opt)} />
                      <span className='text-black'>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Are you applying in the same country/location and is it your principal residence?</label>
                <div className="mt-1 flex items-center space-x-6">
                  {yesNo.map(opt => (
                    <label key={opt} className="inline-flex items-center">
                      <input type="radio" name="same_country_application" className="mr-2" checked={get('us_history.same_country_application') === opt} onChange={() => set('us_history.same_country_application', opt)} />
                      <span className='text-black'>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Have you been ten-printed?</label>
              <div className="mt-1 flex items-center space-x-6">
                {yesNo.map(opt => (
                  <label key={opt} className="inline-flex items-center">
                    <input type="radio" name="ten_printed" className="mr-2" checked={get('us_history.ten_printed') === opt} onChange={() => set('us_history.ten_printed', opt)} />
                    <span className='text-black'>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Has your U.S. Visa ever been lost or stolen?</label>
              <div className="mt-1 flex items-center space-x-6">
                {yesNo.map(opt => (
                  <label key={opt} className="inline-flex items-center">
                    <input type="radio" name="visa_lost_stolen" className="mr-2" checked={get('us_history.visa_lost_stolen') === opt} onChange={() => set('us_history.visa_lost_stolen', opt)} />
                    <span className='text-black'>{opt}</span>
                  </label>
                ))}
              </div>
              {visaLostStolen && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Year lost or stolen</label>
                    <input
                      type="text"
                      value={get('us_history.visa_lost_year')}
                      onChange={(e) => set('us_history.visa_lost_year', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder='Enter year'
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Explain</label>
                    <textarea
                      rows={3}
                      value={get('us_history.visa_lost_explanation')}
                      onChange={(e) => set('us_history.visa_lost_explanation', e.target.value)}
                      placeholder='Enter explanation'
                      className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Has your U.S. Visa ever been cancelled or revoked?</label>
              <div className="mt-1 flex items-center space-x-6">
                {yesNo.map(opt => (
                  <label key={opt} className="inline-flex items-center">
                    <input type="radio" name="visa_cancelled" className="mr-2" checked={get('us_history.visa_cancelled') === opt} onChange={() => set('us_history.visa_cancelled', opt)} />
                    <span className='text-black'>{opt}</span>
                  </label>
                ))}
              </div>
              {visaCancelled && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700">Explain why</label>
                  <textarea
                    rows={3}
                    value={get('us_history.visa_cancelled_explanation')}
                    onChange={(e) => set('us_history.visa_cancelled_explanation', e.target.value)}
                    placeholder='Enter explanation'
                    className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Refusals / ESTA / Immigrant Petition */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Have you ever been refused a U.S. Visa, refused admission to the U.S., or withdrawn your application at the port of entry?</label>
          <div className="mt-1 flex items-center space-x-6">
            {yesNo.map(opt => (
              <label key={opt} className="inline-flex items-center">
                <input type="radio" name="visa_refused" className="mr-2" checked={get('us_history.visa_refused') === opt} onChange={() => set('us_history.visa_refused', opt)} />
                <span className='text-black'>{opt}</span>
              </label>
            ))}
          </div>
          {visaRefused && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700">Explain</label>
              <textarea
                rows={3}
                value={get('us_history.visa_refused_explanation')}
                onChange={(e) => set('us_history.visa_refused_explanation', e.target.value)}
                placeholder='Enter explanation'
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm placeholder:text-gray-400"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Have you ever been denied travel authorization through ESTA?</label>
          <div className="mt-1 flex items-center space-x-6">
            {yesNo.map(opt => (
              <label key={opt} className="inline-flex items-center">
                <input type="radio" name="esta_denied" className="mr-2" checked={get('us_history.esta_denied') === opt} onChange={() => set('us_history.esta_denied', opt)} />
                <span className='text-black'>{opt}</span>
              </label>
            ))}
          </div>
          {estaDenied && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700">Explain</label>
              <textarea
                rows={3}
                value={get('us_history.esta_denied_explanation')}
                onChange={(e) => set('us_history.esta_denied_explanation', e.target.value)}
                placeholder='Enter explanation'
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Has anyone ever filed an immigrant petition on your behalf with USCIS?</label>
          <div className="mt-1 flex items-center space-x-6">
            {yesNo.map(opt => (
              <label key={opt} className="inline-flex items-center">
                <input type="radio" name="immigrant_petition" className="mr-2" checked={get('us_history.immigrant_petition') === opt} onChange={() => set('us_history.immigrant_petition', opt)} />
                <span className='text-black'>{opt}</span>
              </label>
            ))}
          </div>
          {immigrantPetition && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700">Explain the circumstances of the petition</label>
              <textarea
                rows={3}
                value={get('us_history.immigrant_petition_explanation')}
                onChange={(e) => set('us_history.immigrant_petition_explanation', e.target.value)}
                placeholder='Enter explanation'
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



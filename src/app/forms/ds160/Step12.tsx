import type { StepProps } from './types'
import { countries } from './countries'

export default function Step12({ formData, onChange }: StepProps) {
  const get = (key: string) => formData[key] || ''
  const set = (key: string, val: any) => onChange(key, val)
  const yesNo = ['Yes', 'No']

  const belongClan = (get('additional_occupation.belong_clan_tribe') || '').toString().toLowerCase() === 'yes'
  const traveled = (get('additional_occupation.traveled_last_five_years') || '').toString().toLowerCase() === 'yes'
  const belongedOrg = (get('additional_occupation.belonged_professional_org') || '').toString().toLowerCase() === 'yes'
  const specializedSkills = (get('additional_occupation.specialized_skills_training') || '').toString().toLowerCase() === 'yes'
  const servedMilitary = (get('additional_occupation.served_military') || '').toString().toLowerCase() === 'yes'
  const involvedParamilitary = (get('additional_occupation.involved_paramilitary') || '').toString().toLowerCase() === 'yes'

  return (
    <div className="space-y-8">
      {/* Clan or Tribe */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Do you belong to a clan or tribe?</label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input
                type="radio"
                name="belong_clan_tribe"
                className="mr-2"
                checked={get('additional_occupation.belong_clan_tribe') === opt}
                onChange={() => set('additional_occupation.belong_clan_tribe', opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>

        {belongClan && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Clan or tribe name</label>
            <input
              type="text"
              value={get('additional_occupation.clan_tribe_name')}
              onChange={(e) => set('additional_occupation.clan_tribe_name', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        )}
      </div>

      {/* Language */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Language Name</label>
        <input
          type="text"
          value={get('additional_occupation.language_name')}
          onChange={(e) => set('additional_occupation.language_name', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      {/* Travel last five years */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Have you traveled to any countries/regions within the last five years?</label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input
                type="radio"
                name="traveled_last_five_years"
                className="mr-2"
                checked={get('additional_occupation.traveled_last_five_years') === opt}
                onChange={() => set('additional_occupation.traveled_last_five_years', opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>

        {traveled && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Country/Region</label>
            <select
              value={get('additional_occupation.traveled_country_region')}
              onChange={(e) => set('additional_occupation.traveled_country_region', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select a country</option>
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Professional/Social/Charitable org */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Have you belonged to, contributed to, or worked for any professional, social, or charitable organization?</label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input
                type="radio"
                name="belonged_professional_org"
                className="mr-2"
                checked={get('additional_occupation.belonged_professional_org') === opt}
                onChange={() => set('additional_occupation.belonged_professional_org', opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>

        {belongedOrg && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Organization Name</label>
            <input
              type="text"
              value={get('additional_occupation.professional_org_name')}
              onChange={(e) => set('additional_occupation.professional_org_name', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        )}
      </div>

      {/* Specialized skills/training */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Do you have any specialized skills or training, such as firearms, explosives, nuclear, biological, or chemical experience?</label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input
                type="radio"
                name="specialized_skills_training"
                className="mr-2"
                checked={get('additional_occupation.specialized_skills_training') === opt}
                onChange={() => set('additional_occupation.specialized_skills_training', opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>

        {specializedSkills && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea
              rows={3}
              value={get('additional_occupation.specialized_skills_explain')}
              onChange={(e) => set('additional_occupation.specialized_skills_explain', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        )}
      </div>

      {/* Military Service */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Have you ever served in the military?</label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input
                type="radio"
                name="served_military"
                className="mr-2"
                checked={get('additional_occupation.served_military') === opt}
                onChange={() => set('additional_occupation.served_military', opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>

        {servedMilitary && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name of Country/Region</label>
              <select
                value={get('additional_occupation.military_country_region')}
                onChange={(e) => set('additional_occupation.military_country_region', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select a country</option>
                {countries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Branch of Service</label>
                <input
                  type="text"
                  value={get('additional_occupation.military_branch')}
                  onChange={(e) => set('additional_occupation.military_branch', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rank/Position</label>
                <input
                  type="text"
                  value={get('additional_occupation.military_rank_position')}
                  onChange={(e) => set('additional_occupation.military_rank_position', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Military Specialty</label>
                <input
                  type="text"
                  value={get('additional_occupation.military_specialty')}
                  onChange={(e) => set('additional_occupation.military_specialty', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Service From</label>
                <input
                  type="date"
                  value={get('additional_occupation.military_service_from')}
                  onChange={(e) => set('additional_occupation.military_service_from', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Service To</label>
                <input
                  type="date"
                  value={get('additional_occupation.military_service_to')}
                  onChange={(e) => set('additional_occupation.military_service_to', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Paramilitary involvement */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Have you ever served in, been a member of, or been involved with a paramilitary unit, vigilante unit, rebel group, guerrilla group, or insurgent organization?</label>
        <div className="mt-1 flex items-center space-x-6">
          {yesNo.map(opt => (
            <label key={opt} className="inline-flex items-center">
              <input
                type="radio"
                name="involved_paramilitary"
                className="mr-2"
                checked={get('additional_occupation.involved_paramilitary') === opt}
                onChange={() => set('additional_occupation.involved_paramilitary', opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>

        {involvedParamilitary && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Explain</label>
            <textarea
              rows={3}
              value={get('additional_occupation.involved_paramilitary_explain')}
              onChange={(e) => set('additional_occupation.involved_paramilitary_explain', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        )}
      </div>
    </div>
  )
}



import type { StepProps } from './types'
import { countries } from './countries'

export default function Step6({ formData, onChange }: StepProps) {
  const get = (key: string) => formData[key] || ''
  const set = (key: string, val: any) => onChange(key, val)
  const yesNo = ['Yes', 'No']

  // Home address NA flags
  const homeStateNA = get('contact_info.home_state_na') === true || get('contact_info.home_state') === 'N/A'
  const homePostalNA = get('contact_info.home_postal_na') === true || get('contact_info.home_postal_code') === 'N/A'

  // Mailing
  const mailingSame = (get('contact_info.mailing_same_as_home') || '').toString().toLowerCase() === 'yes'
  const mailingStateNA = get('contact_info.mailing_state_na') === true || get('contact_info.mailing_state') === 'N/A'
  const mailingPostalNA = get('contact_info.mailing_postal_na') === true || get('contact_info.mailing_postal_code') === 'N/A'

  // Phones
  const secondaryPhoneNA = get('contact_info.secondary_phone_na') === true || get('contact_info.secondary_phone') === 'N/A'
  const workPhoneNA = get('contact_info.work_phone_na') === true || get('contact_info.work_phone') === 'N/A'
  const otherPhoneNumbers = (get('contact_info.other_phone_numbers') || '').toString().toLowerCase() === 'yes'

  // Emails
  const otherEmails = (get('contact_info.other_email_addresses') || '').toString().toLowerCase() === 'yes'

  // Social
  const socialPresence = (get('contact_info.social_media_presence') || '').toString().toLowerCase() === 'yes'
  const otherWebsites = (get('contact_info.other_websites') || '').toString().toLowerCase() === 'yes'

  const socialProviders = [
    'ASK.FM', 'DOUBAN', 'FACEBOOK', 'FLICKR', 'GOOGLE+', 'INSTAGRAM', 'LINKEDIN', 'MYSPACE', 'PINTEREST',
    'QZONE (QQ)', 'REDDIT', 'SINA WEIBO', 'TENCENT WEIBO', 'TUMBLR', 'TWITTER', 'TWOO', 'VINE', 'VKONTAKTE (VK)',
    'YOUKU', 'YOUTUBE', 'NONE'
  ]

  return (
    <div className="space-y-8">
      {/* Home Address */}
      <div className="space-y-4">
        <h6 className="text-sm font-medium text-gray-900">Home Address</h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Street Address (Line 1)</label>
            <input
              type="text"
              value={get('contact_info.home_address_line1')}
              onChange={(e) => set('contact_info.home_address_line1', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder='Enter address line 1'
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Street Address (Line 2)</label>
            <input
              type="text"
              value={get('contact_info.home_address_line2')}
              onChange={(e) => set('contact_info.home_address_line2', e.target.value)}
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
              value={get('contact_info.home_city')}
              onChange={(e) => set('contact_info.home_city', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder='Enter city'
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">State/Province</label>
            <div className="flex items-center space-x-3 mt-1">
              <input
                type="text"
                value={homeStateNA ? 'N/A' : get('contact_info.home_state')}
                onChange={(e) => set('contact_info.home_state', e.target.value)}
                className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                disabled={homeStateNA}
                placeholder='Enter state/province'
              />
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={homeStateNA}
                  onChange={(e) => {
                    if (e.target.checked) {
                      set('contact_info.home_state_na', true)
                      set('contact_info.home_state', 'N/A')
                    } else {
                      set('contact_info.home_state_na', false)
                      if (get('contact_info.home_state') === 'N/A') set('contact_info.home_state', '')
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
                value={homePostalNA ? 'N/A' : get('contact_info.home_postal_code')}
                onChange={(e) => set('contact_info.home_postal_code', e.target.value)}
                className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                disabled={homePostalNA}
                placeholder='Enter zip code'
              />
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={homePostalNA}
                  onChange={(e) => {
                    if (e.target.checked) {
                      set('contact_info.home_postal_na', true)
                      set('contact_info.home_postal_code', 'N/A')
                    } else {
                      set('contact_info.home_postal_na', false)
                      if (get('contact_info.home_postal_code') === 'N/A') set('contact_info.home_postal_code', '')
                    }
                  }}
                />
                NA (Does not apply)
              </label>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Country/Region</label>
          <select
            value={get('contact_info.home_country')}
            onChange={(e) => set('contact_info.home_country', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select a country</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Mailing Address */}
      <div className="space-y-4">
        <h6 className="text-sm font-medium text-gray-900">Mailing Address</h6>
        <div>
          <label className="block text-sm font-medium text-gray-700">Is your Mailing Address the same as your Home Address?</label>
          <div className="mt-1 flex items-center space-x-6">
            {yesNo.map(opt => (
              <label key={opt} className="inline-flex items-center">
                <input type="radio" name="mailing_same_as_home" className="mr-2" checked={get('contact_info.mailing_same_as_home') === opt} onChange={() => set('contact_info.mailing_same_as_home', opt)} />
                <span className='text-black'>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {mailingSame === false && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Street Address (Line 1)</label>
                <input
                  type="text"
                  value={get('contact_info.mailing_address_line1')}
                  onChange={(e) => set('contact_info.mailing_address_line1', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder='Enter address line 1'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Street Address (Line 2)</label>
                <input
                  type="text"
                  value={get('contact_info.mailing_address_line2')}
                  onChange={(e) => set('contact_info.mailing_address_line2', e.target.value)}
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
                  value={get('contact_info.mailing_city')}
                  onChange={(e) => set('contact_info.mailing_city', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder='Enter city'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State/Province</label>
                <div className="flex items-center space-x-3 mt-1">
                  <input
                    type="text"
                    value={mailingStateNA ? 'N/A' : get('contact_info.mailing_state')}
                    onChange={(e) => set('contact_info.mailing_state', e.target.value)}
                    className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                    disabled={mailingStateNA}
                    placeholder='Enter state/province'
                  />
                  <label className="inline-flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={mailingStateNA}
                      onChange={(e) => {
                        if (e.target.checked) {
                          set('contact_info.mailing_state_na', true)
                          set('contact_info.mailing_state', 'N/A')
                        } else {
                          set('contact_info.mailing_state_na', false)
                          if (get('contact_info.mailing_state') === 'N/A') set('contact_info.mailing_state', '')
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
                    value={mailingPostalNA ? 'N/A' : get('contact_info.mailing_postal_code')}
                    onChange={(e) => set('contact_info.mailing_postal_code', e.target.value)}
                    className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                    disabled={mailingPostalNA}
                    placeholder='Enter zip code'
                  />
                  <label className="inline-flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={mailingPostalNA}
                      onChange={(e) => {
                        if (e.target.checked) {
                          set('contact_info.mailing_postal_na', true)
                          set('contact_info.mailing_postal_code', 'N/A')
                        } else {
                          set('contact_info.mailing_postal_na', false)
                          if (get('contact_info.mailing_postal_code') === 'N/A') set('contact_info.mailing_postal_code', '')
                        }
                      }}
                    />
                    NA (Does not apply)
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country/Region</label>
              <select
                value={get('contact_info.mailing_country')}
                onChange={(e) => set('contact_info.mailing_country', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select a country</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-4">
        <h6 className="text-sm font-medium text-gray-900">Phone</h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Primary Phone Number</label>
            <input
              type="tel"
              value={get('contact_info.primary_phone')}
              onChange={(e) => set('contact_info.primary_phone', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder='Enter phone number'
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Secondary Phone Number</label>
            <div className="flex items-center space-x-3 mt-1">
              <input
                type="tel"
                value={secondaryPhoneNA ? 'N/A' : get('contact_info.secondary_phone')}
                onChange={(e) => set('contact_info.secondary_phone', e.target.value)}
                className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                disabled={secondaryPhoneNA}
                placeholder='Enter phone number'
                />
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={secondaryPhoneNA}
                  onChange={(e) => {
                    if (e.target.checked) {
                      set('contact_info.secondary_phone_na', true)
                      set('contact_info.secondary_phone', 'N/A')
                    } else {
                      set('contact_info.secondary_phone_na', false)
                      if (get('contact_info.secondary_phone') === 'N/A') set('contact_info.secondary_phone', '')
                    }
                  }}
                />
                NA (Does not apply)
              </label>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Work Phone Number</label>
            <div className="flex items-center space-x-3 mt-1">
              <input
                type="tel"
                value={workPhoneNA ? 'N/A' : get('contact_info.work_phone')}
                onChange={(e) => set('contact_info.work_phone', e.target.value)}
                className="flex-1 rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                disabled={workPhoneNA}
                placeholder='Enter phone number'
              />
              <label className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={workPhoneNA}
                  onChange={(e) => {
                    if (e.target.checked) {
                      set('contact_info.work_phone_na', true)
                      set('contact_info.work_phone', 'N/A')
                    } else {
                      set('contact_info.work_phone_na', false)
                      if (get('contact_info.work_phone') === 'N/A') set('contact_info.work_phone', '')
                    }
                  }}
                />
                NA (Does not apply)
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Have you used any other phone numbers in the last five years?</label>
            <div className="mt-1 flex items-center space-x-6">
              {yesNo.map(opt => (
                <label key={opt} className="inline-flex items-center">
                  <input type="radio" name="other_phone_numbers" className="mr-2" checked={get('contact_info.other_phone_numbers') === opt} onChange={() => set('contact_info.other_phone_numbers', opt)} />
                  <span className='text-black'>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        {otherPhoneNumbers && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Additional Phone Number</label>
            <input
              type="tel"
              value={get('contact_info.additional_phone')}
              onChange={(e) => set('contact_info.additional_phone', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder='Enter phone number'
            />
          </div>
        )}
      </div>

      {/* Email */}
      <div className="space-y-4">
        <h6 className="text-sm font-medium text-gray-900">Email Address</h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              value={get('contact_info.email_address')}
              onChange={(e) => set('contact_info.email_address', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Have you used any other email addresses in the last five years?</label>
            <div className="mt-1 flex items-center space-x-6">
              {yesNo.map(opt => (
                <label key={opt} className="inline-flex items-center">
                  <input type="radio" name="other_email_addresses" className="mr-2" checked={get('contact_info.other_email_addresses') === opt} onChange={() => set('contact_info.other_email_addresses', opt)} />
                  <span className='text-black'>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        {otherEmails && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Additional Email Address</label>
            <input
              type="email"
              value={get('contact_info.additional_email')}
              onChange={(e) => set('contact_info.additional_email', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder='Enter email address'
            />
          </div>
        )}
      </div>

      {/* Social Media */}
      <div className="space-y-4">
        <h6 className="text-sm font-medium text-gray-900">Social Media</h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Social Media Provider/Platform</label>
            <select
              value={get('contact_info.social_media_platform')}
              onChange={(e) => set('contact_info.social_media_platform', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select</option>
              {socialProviders.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Social Media Identifier</label>
            <input
              type="text"
              value={get('contact_info.social_media_identifier')}
              onChange={(e) => set('contact_info.social_media_identifier', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder='Enter identifier'
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Do you wish to provide information about other websites/apps used in last five years?</label>
          <div className="mt-1 flex items-center space-x-6">
            {yesNo.map(opt => (
              <label key={opt} className="inline-flex items-center">
                <input type="radio" name="other_websites" className="mr-2" checked={get('contact_info.other_websites') === opt} onChange={() => set('contact_info.other_websites', opt)} />
                <span className='text-black'>{opt}</span>
              </label>
            ))}
          </div>
        </div>
        {otherWebsites && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Additional Social Media Platform</label>
              <input
                type="text"
                placeholder='Enter platform'
                value={get('contact_info.additional_social_platform')}
                onChange={(e) => set('contact_info.additional_social_platform', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Additional Social Media Handle</label>
              <input
                type="text"
                value={get('contact_info.additional_social_handle')}
                onChange={(e) => set('contact_info.additional_social_handle', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder='Enter handle'
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



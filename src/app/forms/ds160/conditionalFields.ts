export interface ConditionalField {
  key: string
  label: string
  type: 'text' | 'select' | 'tel' | 'email' | 'radio' | 'date' | 'date_split'
  required?: boolean
  optional?: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
}

export interface ConditionalFieldGroup {
  title: string
  fields: ConditionalField[]
}

export const conditionalFieldMap: Record<string, ConditionalFieldGroup> = {
  // A1 visa types - Mission/Organization Information
  'AMBASSADOR OR PUBLIC MINISTER (A1)': {
    title: 'Mission/Organization Information',
    fields: [
      {
        key: 'travel_info.sponsoring_mission_organization',
        label: 'Sponsoring Mission/Organization',
        type: 'text',
        required: true,
        placeholder: 'Enter sponsoring mission/organization'
      },
      {
        key: 'travel_info.contact_surnames',
        label: 'Contact Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter contact surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Contact Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter contact given names'
      },
      {
        key: 'travel_info.mission_address_line1',
        label: 'U.S. Address (Line 1)',
        type: 'text',
        required: true,
        placeholder: 'Enter address line 1'
      },
      {
        key: 'travel_info.mission_address_line2',
        label: 'U.S. Address (Line 2)',
        type: 'text',
        required: false,
        placeholder: 'Enter address line 2 (optional)',
        optional: true
      },
      {
        key: 'travel_info.mission_city',
        label: 'City',
        type: 'text',
        required: true,
        placeholder: 'Enter city'
      },
      {
        key: 'travel_info.mission_state',
        label: 'State',
        type: 'select',
        required: true,
        options: [
          { value: '', label: '- Select one -' },
          { value: 'AL', label: 'ALABAMA' },
          { value: 'AK', label: 'ALASKA' },
          { value: 'AS', label: 'AMERICAN SAMOA' },
          { value: 'AZ', label: 'ARIZONA' },
          { value: 'AR', label: 'ARKANSAS' },
          { value: 'CA', label: 'CALIFORNIA' },
          { value: 'CO', label: 'COLORADO' },
          { value: 'CT', label: 'CONNECTICUT' },
          { value: 'DE', label: 'DELAWARE' },
          { value: 'DC', label: 'DISTRICT OF COLUMBIA' },
          { value: 'FL', label: 'FLORIDA' },
          { value: 'GA', label: 'GEORGIA' },
          { value: 'GU', label: 'GUAM' },
          { value: 'HI', label: 'HAWAII' },
          { value: 'ID', label: 'IDAHO' },
          { value: 'IL', label: 'ILLINOIS' },
          { value: 'IN', label: 'INDIANA' },
          { value: 'IA', label: 'IOWA' },
          { value: 'KS', label: 'KANSAS' },
          { value: 'KY', label: 'KENTUCKY' },
          { value: 'LA', label: 'LOUISIANA' },
          { value: 'ME', label: 'MAINE' },
          { value: 'MD', label: 'MARYLAND' },
          { value: 'MA', label: 'MASSACHUSETTS' },
          { value: 'MI', label: 'MICHIGAN' },
          { value: 'MN', label: 'MINNESOTA' },
          { value: 'MS', label: 'MISSISSIPPI' },
          { value: 'MO', label: 'MISSOURI' },
          { value: 'MT', label: 'MONTANA' },
          { value: 'NE', label: 'NEBRASKA' },
          { value: 'NV', label: 'NEVADA' },
          { value: 'NH', label: 'NEW HAMPSHIRE' },
          { value: 'NJ', label: 'NEW JERSEY' },
          { value: 'NM', label: 'NEW MEXICO' },
          { value: 'NY', label: 'NEW YORK' },
          { value: 'NC', label: 'NORTH CAROLINA' },
          { value: 'ND', label: 'NORTH DAKOTA' },
          { value: 'MP', label: 'NORTHERN MARIANA ISLANDS' },
          { value: 'OH', label: 'OHIO' },
          { value: 'OK', label: 'OKLAHOMA' },
          { value: 'OR', label: 'OREGON' },
          { value: 'PA', label: 'PENNSYLVANIA' },
          { value: 'PR', label: 'PUERTO RICO' },
          { value: 'RI', label: 'RHODE ISLAND' },
          { value: 'SC', label: 'SOUTH CAROLINA' },
          { value: 'SD', label: 'SOUTH DAKOTA' },
          { value: 'TN', label: 'TENNESSEE' },
          { value: 'TX', label: 'TEXAS' },
          { value: 'UT', label: 'UTAH' },
          { value: 'VT', label: 'VERMONT' },
          { value: 'VI', label: 'VIRGIN ISLANDS' },
          { value: 'VA', label: 'VIRGINIA' },
          { value: 'WA', label: 'WASHINGTON' },
          { value: 'WV', label: 'WEST VIRGINIA' },
          { value: 'WI', label: 'WISCONSIN' },
          { value: 'WY', label: 'WYOMING' }
        ]
      },
      {
        key: 'travel_info.mission_zip',
        label: 'Zip Code',
        type: 'text',
        required: true,
        placeholder: 'e.g., 12345 or 12345-1234'
      },
      {
        key: 'travel_info.mission_phone',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      }
    ]
  },

  'CAREER DIPLOMAT/CONSULAR OFFICER (A1)': {
    title: 'Mission/Organization Information',
    fields: [
      {
        key: 'travel_info.sponsoring_mission_organization',
        label: 'Sponsoring Mission/Organization',
        type: 'text',
        required: true,
        placeholder: 'Enter sponsoring mission/organization'
      },
      {
        key: 'travel_info.contact_surnames',
        label: 'Contact Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter contact surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Contact Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter contact given names'
      },
      {
        key: 'travel_info.mission_address_line1',
        label: 'U.S. Address (Line 1)',
        type: 'text',
        required: true,
        placeholder: 'Enter address line 1'
      },
      {
        key: 'travel_info.mission_address_line2',
        label: 'U.S. Address (Line 2)',
        type: 'text',
        required: false,
        placeholder: 'Enter address line 2 (optional)',
        optional: true
      },
      {
        key: 'travel_info.mission_city',
        label: 'City',
        type: 'text',
        required: true,
        placeholder: 'Enter city'
      },
      {
        key: 'travel_info.mission_state',
        label: 'State',
        type: 'select',
        required: true,
        options: [
          { value: '', label: '- Select one -' },
          { value: 'AL', label: 'ALABAMA' },
          { value: 'AK', label: 'ALASKA' },
          { value: 'AS', label: 'AMERICAN SAMOA' },
          { value: 'AZ', label: 'ARIZONA' },
          { value: 'AR', label: 'ARKANSAS' },
          { value: 'CA', label: 'CALIFORNIA' },
          { value: 'CO', label: 'COLORADO' },
          { value: 'CT', label: 'CONNECTICUT' },
          { value: 'DE', label: 'DELAWARE' },
          { value: 'DC', label: 'DISTRICT OF COLUMBIA' },
          { value: 'FL', label: 'FLORIDA' },
          { value: 'GA', label: 'GEORGIA' },
          { value: 'GU', label: 'GUAM' },
          { value: 'HI', label: 'HAWAII' },
          { value: 'ID', label: 'IDAHO' },
          { value: 'IL', label: 'ILLINOIS' },
          { value: 'IN', label: 'INDIANA' },
          { value: 'IA', label: 'IOWA' },
          { value: 'KS', label: 'KANSAS' },
          { value: 'KY', label: 'KENTUCKY' },
          { value: 'LA', label: 'LOUISIANA' },
          { value: 'ME', label: 'MAINE' },
          { value: 'MD', label: 'MARYLAND' },
          { value: 'MA', label: 'MASSACHUSETTS' },
          { value: 'MI', label: 'MICHIGAN' },
          { value: 'MN', label: 'MINNESOTA' },
          { value: 'MS', label: 'MISSISSIPPI' },
          { value: 'MO', label: 'MISSOURI' },
          { value: 'MT', label: 'MONTANA' },
          { value: 'NE', label: 'NEBRASKA' },
          { value: 'NV', label: 'NEVADA' },
          { value: 'NH', label: 'NEW HAMPSHIRE' },
          { value: 'NJ', label: 'NEW JERSEY' },
          { value: 'NM', label: 'NEW MEXICO' },
          { value: 'NY', label: 'NEW YORK' },
          { value: 'NC', label: 'NORTH CAROLINA' },
          { value: 'ND', label: 'NORTH DAKOTA' },
          { value: 'MP', label: 'NORTHERN MARIANA ISLANDS' },
          { value: 'OH', label: 'OHIO' },
          { value: 'OK', label: 'OKLAHOMA' },
          { value: 'OR', label: 'OREGON' },
          { value: 'PA', label: 'PENNSYLVANIA' },
          { value: 'PR', label: 'PUERTO RICO' },
          { value: 'RI', label: 'RHODE ISLAND' },
          { value: 'SC', label: 'SOUTH CAROLINA' },
          { value: 'SD', label: 'SOUTH DAKOTA' },
          { value: 'TN', label: 'TENNESSEE' },
          { value: 'TX', label: 'TEXAS' },
          { value: 'UT', label: 'UTAH' },
          { value: 'VT', label: 'VERMONT' },
          { value: 'VI', label: 'VIRGIN ISLANDS' },
          { value: 'VA', label: 'VIRGINIA' },
          { value: 'WA', label: 'WASHINGTON' },
          { value: 'WV', label: 'WEST VIRGINIA' },
          { value: 'WI', label: 'WISCONSIN' },
          { value: 'WY', label: 'WYOMING' }
        ]
      },
      {
        key: 'travel_info.mission_zip',
        label: 'Zip Code',
        type: 'text',
        required: true,
        placeholder: 'e.g., 12345 or 12345-1234'
      },
      {
        key: 'travel_info.mission_phone',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      }
    ]
  },

  // A1 visa types - Contact Information (simplified)
  'CHILD OF AN A1 (A1)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF AN A1 (A1)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'CHILD OF AN A2 (A2)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF AN A2 (A2)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'CHILD OF AN A3 (A3)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF AN A3 (A3)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'FOREIGN OFFICIAL/EMPLOYEE (A2)': {
    title: 'Mission/Organization Information',
    fields: [
      {
        key: 'travel_info.sponsoring_mission_organization',
        label: 'Sponsoring Mission/Organization',
        type: 'text',
        required: true,
        placeholder: 'Enter sponsoring mission/organization'
      },
      {
        key: 'travel_info.contact_surnames',
        label: 'Contact Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter contact surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Contact Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter contact given names'
      },
      {
        key: 'travel_info.mission_address_line1',
        label: 'U.S. Address (Line 1)',
        type: 'text',
        required: true,
        placeholder: 'Enter address line 1'
      },
      {
        key: 'travel_info.mission_address_line2',
        label: 'U.S. Address (Line 2)',
        type: 'text',
        required: false,
        placeholder: 'Enter address line 2 (optional)',
        optional: true
      },
      {
        key: 'travel_info.mission_city',
        label: 'City',
        type: 'text',
        required: true,
        placeholder: 'Enter city'
      },
      {
        key: 'travel_info.mission_state',
        label: 'State',
        type: 'select',
        required: true,
        options: [
          { value: '', label: '- Select one -' },
          { value: 'AL', label: 'ALABAMA' },
          { value: 'AK', label: 'ALASKA' },
          { value: 'AS', label: 'AMERICAN SAMOA' },
          { value: 'AZ', label: 'ARIZONA' },
          { value: 'AR', label: 'ARKANSAS' },
          { value: 'CA', label: 'CALIFORNIA' },
          { value: 'CO', label: 'COLORADO' },
          { value: 'CT', label: 'CONNECTICUT' },
          { value: 'DE', label: 'DELAWARE' },
          { value: 'DC', label: 'DISTRICT OF COLUMBIA' },
          { value: 'FL', label: 'FLORIDA' },
          { value: 'GA', label: 'GEORGIA' },
          { value: 'GU', label: 'GUAM' },
          { value: 'HI', label: 'HAWAII' },
          { value: 'ID', label: 'IDAHO' },
          { value: 'IL', label: 'ILLINOIS' },
          { value: 'IN', label: 'INDIANA' },
          { value: 'IA', label: 'IOWA' },
          { value: 'KS', label: 'KANSAS' },
          { value: 'KY', label: 'KENTUCKY' },
          { value: 'LA', label: 'LOUISIANA' },
          { value: 'ME', label: 'MAINE' },
          { value: 'MD', label: 'MARYLAND' },
          { value: 'MA', label: 'MASSACHUSETTS' },
          { value: 'MI', label: 'MICHIGAN' },
          { value: 'MN', label: 'MINNESOTA' },
          { value: 'MS', label: 'MISSISSIPPI' },
          { value: 'MO', label: 'MISSOURI' },
          { value: 'MT', label: 'MONTANA' },
          { value: 'NE', label: 'NEBRASKA' },
          { value: 'NV', label: 'NEVADA' },
          { value: 'NH', label: 'NEW HAMPSHIRE' },
          { value: 'NJ', label: 'NEW JERSEY' },
          { value: 'NM', label: 'NEW MEXICO' },
          { value: 'NY', label: 'NEW YORK' },
          { value: 'NC', label: 'NORTH CAROLINA' },
          { value: 'ND', label: 'NORTH DAKOTA' },
          { value: 'MP', label: 'NORTHERN MARIANA ISLANDS' },
          { value: 'OH', label: 'OHIO' },
          { value: 'OK', label: 'OKLAHOMA' },
          { value: 'OR', label: 'OREGON' },
          { value: 'PA', label: 'PENNSYLVANIA' },
          { value: 'PR', label: 'PUERTO RICO' },
          { value: 'RI', label: 'RHODE ISLAND' },
          { value: 'SC', label: 'SOUTH CAROLINA' },
          { value: 'SD', label: 'SOUTH DAKOTA' },
          { value: 'TN', label: 'TENNESSEE' },
          { value: 'TX', label: 'TEXAS' },
          { value: 'UT', label: 'UTAH' },
          { value: 'VT', label: 'VERMONT' },
          { value: 'VI', label: 'VIRGIN ISLANDS' },
          { value: 'VA', label: 'VIRGINIA' },
          { value: 'WA', label: 'WASHINGTON' },
          { value: 'WV', label: 'WEST VIRGINIA' },
          { value: 'WI', label: 'WISCONSIN' },
          { value: 'WY', label: 'WYOMING' }
        ]
      },
      {
        key: 'travel_info.mission_zip',
        label: 'Zip Code',
        type: 'text',
        required: true,
        placeholder: 'e.g., 12345 or 12345-1234'
      },
      {
        key: 'travel_info.mission_phone',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      }
    ]
  },

  'PERSONAL EMP. OF AN A1 OR A2 (A3)': {
    title: 'Mission/Organization Information',
    fields: [
      {
        key: 'travel_info.sponsoring_mission_organization',
        label: 'Sponsoring Mission/Organization',
        type: 'text',
        required: true,
        placeholder: 'Enter sponsoring mission/organization'
      },
      {
        key: 'travel_info.contact_surnames',
        label: 'Contact Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter contact surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Contact Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter contact given names'
      },
      {
        key: 'travel_info.mission_address_line1',
        label: 'U.S. Address (Line 1)',
        type: 'text',
        required: true,
        placeholder: 'Enter address line 1'
      },
      {
        key: 'travel_info.mission_address_line2',
        label: 'U.S. Address (Line 2)',
        type: 'text',
        required: false,
        placeholder: 'Enter address line 2 (optional)',
        optional: true
      },
      {
        key: 'travel_info.mission_city',
        label: 'City',
        type: 'text',
        required: true,
        placeholder: 'Enter city'
      },
      {
        key: 'travel_info.mission_state',
        label: 'State',
        type: 'select',
        required: true,
        options: [
          { value: '', label: '- Select one -' },
          { value: 'AL', label: 'ALABAMA' },
          { value: 'AK', label: 'ALASKA' },
          { value: 'AS', label: 'AMERICAN SAMOA' },
          { value: 'AZ', label: 'ARIZONA' },
          { value: 'AR', label: 'ARKANSAS' },
          { value: 'CA', label: 'CALIFORNIA' },
          { value: 'CO', label: 'COLORADO' },
          { value: 'CT', label: 'CONNECTICUT' },
          { value: 'DE', label: 'DELAWARE' },
          { value: 'DC', label: 'DISTRICT OF COLUMBIA' },
          { value: 'FL', label: 'FLORIDA' },
          { value: 'GA', label: 'GEORGIA' },
          { value: 'GU', label: 'GUAM' },
          { value: 'HI', label: 'HAWAII' },
          { value: 'ID', label: 'IDAHO' },
          { value: 'IL', label: 'ILLINOIS' },
          { value: 'IN', label: 'INDIANA' },
          { value: 'IA', label: 'IOWA' },
          { value: 'KS', label: 'KANSAS' },
          { value: 'KY', label: 'KENTUCKY' },
          { value: 'LA', label: 'LOUISIANA' },
          { value: 'ME', label: 'MAINE' },
          { value: 'MD', label: 'MARYLAND' },
          { value: 'MA', label: 'MASSACHUSETTS' },
          { value: 'MI', label: 'MICHIGAN' },
          { value: 'MN', label: 'MINNESOTA' },
          { value: 'MS', label: 'MISSISSIPPI' },
          { value: 'MO', label: 'MISSOURI' },
          { value: 'MT', label: 'MONTANA' },
          { value: 'NE', label: 'NEBRASKA' },
          { value: 'NV', label: 'NEVADA' },
          { value: 'NH', label: 'NEW HAMPSHIRE' },
          { value: 'NJ', label: 'NEW JERSEY' },
          { value: 'NM', label: 'NEW MEXICO' },
          { value: 'NY', label: 'NEW YORK' },
          { value: 'NC', label: 'NORTH CAROLINA' },
          { value: 'ND', label: 'NORTH DAKOTA' },
          { value: 'MP', label: 'NORTHERN MARIANA ISLANDS' },
          { value: 'OH', label: 'OHIO' },
          { value: 'OK', label: 'OKLAHOMA' },
          { value: 'OR', label: 'OREGON' },
          { value: 'PA', label: 'PENNSYLVANIA' },
          { value: 'PR', label: 'PUERTO RICO' },
          { value: 'RI', label: 'RHODE ISLAND' },
          { value: 'SC', label: 'SOUTH CAROLINA' },
          { value: 'SD', label: 'SOUTH DAKOTA' },
          { value: 'TN', label: 'TENNESSEE' },
          { value: 'TX', label: 'TEXAS' },
          { value: 'UT', label: 'UTAH' },
          { value: 'VT', label: 'VERMONT' },
          { value: 'VA', label: 'VIRGINIA' },
          { value: 'WA', label: 'WASHINGTON' },
          { value: 'WV', label: 'WEST VIRGINIA' },
          { value: 'WI', label: 'WISCONSIN' },
          { value: 'WY', label: 'WYOMING' }
        ]
      },
      {
        key: 'travel_info.mission_zip',
        label: 'Zip Code',
        type: 'text',
        required: true,
        placeholder: 'e.g., 12345 or 12345-1234'
      },
      {
        key: 'travel_info.mission_phone',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      }
    ]
  },

  'CHILD OF A C3 (C3)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF A C3 (C3)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'CNMI TEMPORARY WORKER (CW1)': {
    title: 'Application Information',
    fields: [
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'CNMI LONG TERM INVESTOR (E2C)': {
    title: 'Application Information',
    fields: [
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'CHILD OF CW1 (CW2)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'SPOUSE OF CW1 (CW2)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'CREWMEMBER (D)': {
    title: '',
    fields: []
  },

  'LIGHTERING CREWMEMBER (D3)': {
    title: '',
    fields: []
  },

  'CHILD OF AN E1 (E1)': {
    title: 'Contact and Company Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.principal_company_name',
        label: 'Principal Applicant\'s Company Name',
        type: 'text',
        required: true,
        placeholder: 'Enter company name'
      }
    ]
  },

  'SPOUSE OF AN E1 (E1)': {
    title: 'Contact and Company Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.principal_company_name',
        label: 'Principal Applicant\'s Company Name',
        type: 'text',
        required: true,
        placeholder: 'Enter company name'
      }
    ]
  },

  'CHILD OF AN E2 (E2)': {
    title: 'Contact and Company Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.principal_company_name',
        label: 'Principal Applicant\'s Company Name',
        type: 'text',
        required: true,
        placeholder: 'Enter company name'
      }
    ]
  },

  'SPOUSE OF AN E2 (E2)': {
    title: 'Contact and Company Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.principal_company_name',
        label: 'Principal Applicant\'s Company Name',
        type: 'text',
        required: true,
        placeholder: 'Enter company name'
      }
    ]
  },

  'EXECUTIVE/MGR/ESSENTIAL EMP (E1)': {
    title: 'Visa Information',
    fields: [
      {
        key: 'travel_info.principal_visa_issued',
        label: 'Has the principal Treaty Trader/Investor already been issued a visa?',
        type: 'radio',
        required: true,
        options: [
          { value: 'Yes', label: 'Yes' },
          { value: 'No', label: 'No' }
        ]
      }
    ]
  },

  'EXECUTIVE/MGR/ESSENTIAL EMP (E2)': {
    title: 'Visa Information',
    fields: [
      {
        key: 'travel_info.principal_visa_issued',
        label: 'Has the principal Treaty Trader/Investor already been issued a visa?',
        type: 'radio',
        required: true,
        options: [
          { value: 'Yes', label: 'Yes' },
          { value: 'No', label: 'No' }
        ]
      }
    ]
  },

  'EXECUTIVE/MGR/ESSENTIAL EMP (E1) - YES': {
    title: 'Principal Applicant Information',
    fields: [
      {
        key: 'travel_info.principal_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.principal_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.principal_date_of_birth',
        label: 'Principal Applicant Date of Birth',
        type: 'date',
        required: true
      }
    ]
  },

  'EXECUTIVE/MGR/ESSENTIAL EMP (E2) - YES': {
    title: 'Principal Applicant Information',
    fields: [
      {
        key: 'travel_info.principal_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.principal_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.principal_date_of_birth',
        label: 'Principal Applicant Date of Birth',
        type: 'date',
        required: true
      }
    ]
  },

  'CHILD OF AN E3 (E3D)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF AN E3 (E3D)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'CHILD OF AN F1 (F2)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF AN F1 (F2)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'CHILD OF A G1 (G1)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF A G1 (G1)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'CHILD OF A G2 (G2)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF A G2 (G2)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'CHILD OF A G3 (G3)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF A G3 (G3)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'CHILD OF AN G4 (G4)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF A G4 (G4)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'CHILD OF A G5 (G5)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF A G5 (G5)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'PRINCIPAL REPRESENTATIVE (G1)': {
    title: 'Mission/Organization Information',
    fields: [
      {
        key: 'travel_info.sponsoring_mission_organization',
        label: 'Sponsoring Mission/Organization',
        type: 'text',
        required: true,
        placeholder: 'Enter sponsoring mission/organization'
      },
      {
        key: 'travel_info.contact_surnames',
        label: 'Contact Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter contact surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Contact Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter contact given names'
      },
      {
        key: 'travel_info.us_address_line1',
        label: 'U.S. Address (Line 1)',
        type: 'text',
        required: true,
        placeholder: 'Enter U.S. address line 1'
      },
      {
        key: 'travel_info.us_address_line2',
        label: 'U.S. Address (Line 2)',
        type: 'text',
        required: false,
        optional: true,
        placeholder: 'Enter U.S. address line 2 (optional)'
      },
      {
        key: 'travel_info.us_city',
        label: 'City',
        type: 'text',
        required: true,
        placeholder: 'Enter city'
      },
      {
        key: 'travel_info.us_state',
        label: 'State',
        type: 'select',
        required: true,
        options: [
          { value: 'AL', label: 'Alabama' },
          { value: 'AK', label: 'Alaska' },
          { value: 'AZ', label: 'Arizona' },
          { value: 'AR', label: 'Arkansas' },
          { value: 'CA', label: 'California' },
          { value: 'CO', label: 'Colorado' },
          { value: 'CT', label: 'Connecticut' },
          { value: 'DE', label: 'Delaware' },
          { value: 'FL', label: 'Florida' },
          { value: 'GA', label: 'Georgia' },
          { value: 'HI', label: 'Hawaii' },
          { value: 'ID', label: 'Idaho' },
          { value: 'IL', label: 'Illinois' },
          { value: 'IN', label: 'Indiana' },
          { value: 'IA', label: 'Iowa' },
          { value: 'KS', label: 'Kansas' },
          { value: 'KY', label: 'Kentucky' },
          { value: 'LA', label: 'Louisiana' },
          { value: 'ME', label: 'Maine' },
          { value: 'MD', label: 'Maryland' },
          { value: 'MA', label: 'Massachusetts' },
          { value: 'MI', label: 'Michigan' },
          { value: 'MN', label: 'Minnesota' },
          { value: 'MS', label: 'Mississippi' },
          { value: 'MO', label: 'Missouri' },
          { value: 'MT', label: 'Montana' },
          { value: 'NE', label: 'Nebraska' },
          { value: 'NV', label: 'Nevada' },
          { value: 'NH', label: 'New Hampshire' },
          { value: 'NJ', label: 'New Jersey' },
          { value: 'NM', label: 'New Mexico' },
          { value: 'NY', label: 'New York' },
          { value: 'NC', label: 'North Carolina' },
          { value: 'ND', label: 'North Dakota' },
          { value: 'OH', label: 'Ohio' },
          { value: 'OK', label: 'Oklahoma' },
          { value: 'OR', label: 'Oregon' },
          { value: 'PA', label: 'Pennsylvania' },
          { value: 'RI', label: 'Rhode Island' },
          { value: 'SC', label: 'South Carolina' },
          { value: 'SD', label: 'South Dakota' },
          { value: 'TN', label: 'Tennessee' },
          { value: 'TX', label: 'Texas' },
          { value: 'UT', label: 'Utah' },
          { value: 'VT', label: 'Vermont' },
          { value: 'VA', label: 'Virginia' },
          { value: 'WA', label: 'Washington' },
          { value: 'WV', label: 'West Virginia' },
          { value: 'WI', label: 'Wisconsin' },
          { value: 'WY', label: 'Wyoming' }
        ]
      },
      {
        key: 'travel_info.us_zip_code',
        label: 'Zip Code',
        type: 'text',
        required: true,
        placeholder: '12345 or 12345-1234'
      },
      {
        key: 'travel_info.phone_number',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      }
    ]
  },

  'STAFF OF PRINCIPAL REPRESENTATIVE (G1)': {
    title: 'Mission/Organization Information',
    fields: [
      {
        key: 'travel_info.sponsoring_mission_organization',
        label: 'Sponsoring Mission/Organization',
        type: 'text',
        required: true,
        placeholder: 'Enter sponsoring mission/organization'
      },
      {
        key: 'travel_info.contact_surnames',
        label: 'Contact Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter contact surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Contact Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter contact given names'
      },
      {
        key: 'travel_info.us_address_line1',
        label: 'U.S. Address (Line 1)',
        type: 'text',
        required: true,
        placeholder: 'Enter U.S. address line 1'
      },
      {
        key: 'travel_info.us_address_line2',
        label: 'U.S. Address (Line 2)',
        type: 'text',
        required: false,
        optional: true,
        placeholder: 'Enter U.S. address line 2 (optional)'
      },
      {
        key: 'travel_info.us_city',
        label: 'City',
        type: 'text',
        required: true,
        placeholder: 'Enter city'
      },
      {
        key: 'travel_info.us_state',
        label: 'State',
        type: 'select',
        required: true,
        options: [
          { value: 'AL', label: 'Alabama' },
          { value: 'AK', label: 'Alaska' },
          { value: 'AZ', label: 'Arizona' },
          { value: 'AR', label: 'Arkansas' },
          { value: 'CA', label: 'California' },
          { value: 'CO', label: 'Colorado' },
          { value: 'CT', label: 'Connecticut' },
          { value: 'DE', label: 'Delaware' },
          { value: 'FL', label: 'Florida' },
          { value: 'GA', label: 'Georgia' },
          { value: 'HI', label: 'Hawaii' },
          { value: 'ID', label: 'Idaho' },
          { value: 'IL', label: 'Illinois' },
          { value: 'IN', label: 'Indiana' },
          { value: 'IA', label: 'Iowa' },
          { value: 'KS', label: 'Kansas' },
          { value: 'KY', label: 'Kentucky' },
          { value: 'LA', label: 'Louisiana' },
          { value: 'ME', label: 'Maine' },
          { value: 'MD', label: 'Maryland' },
          { value: 'MA', label: 'Massachusetts' },
          { value: 'MI', label: 'Michigan' },
          { value: 'MN', label: 'Minnesota' },
          { value: 'MS', label: 'Mississippi' },
          { value: 'MO', label: 'Missouri' },
          { value: 'MT', label: 'Montana' },
          { value: 'NE', label: 'Nebraska' },
          { value: 'NV', label: 'Nevada' },
          { value: 'NH', label: 'New Hampshire' },
          { value: 'NJ', label: 'New Jersey' },
          { value: 'NM', label: 'New Mexico' },
          { value: 'NY', label: 'New York' },
          { value: 'NC', label: 'North Carolina' },
          { value: 'ND', label: 'North Dakota' },
          { value: 'OH', label: 'Ohio' },
          { value: 'OK', label: 'Oklahoma' },
          { value: 'OR', label: 'Oregon' },
          { value: 'PA', label: 'Pennsylvania' },
          { value: 'RI', label: 'Rhode Island' },
          { value: 'SC', label: 'South Carolina' },
          { value: 'SD', label: 'South Dakota' },
          { value: 'TN', label: 'Tennessee' },
          { value: 'TX', label: 'Texas' },
          { value: 'UT', label: 'Utah' },
          { value: 'VT', label: 'Vermont' },
          { value: 'VA', label: 'Virginia' },
          { value: 'WA', label: 'Washington' },
          { value: 'WV', label: 'West Virginia' },
          { value: 'WI', label: 'Wisconsin' },
          { value: 'WY', label: 'Wyoming' }
        ]
      },
      {
        key: 'travel_info.us_zip_code',
        label: 'Zip Code',
        type: 'text',
        required: true,
        placeholder: '12345 or 12345-1234'
      },
      {
        key: 'travel_info.phone_number',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      }
    ]
  },

  'REPRESENTATIVE (G2)': {
    title: 'Mission/Organization Information',
    fields: [
      {
        key: 'travel_info.sponsoring_mission_organization',
        label: 'Sponsoring Mission/Organization',
        type: 'text',
        required: true,
        placeholder: 'Enter sponsoring mission/organization'
      },
      {
        key: 'travel_info.contact_surnames',
        label: 'Contact Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter contact surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Contact Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter contact given names'
      },
      {
        key: 'travel_info.us_address_line1',
        label: 'U.S. Address (Line 1)',
        type: 'text',
        required: true,
        placeholder: 'Enter U.S. address line 1'
      },
      {
        key: 'travel_info.us_address_line2',
        label: 'U.S. Address (Line 2)',
        type: 'text',
        required: false,
        optional: true,
        placeholder: 'Enter U.S. address line 2 (optional)'
      },
      {
        key: 'travel_info.us_city',
        label: 'City',
        type: 'text',
        required: true,
        placeholder: 'Enter city'
      },
      {
        key: 'travel_info.us_state',
        label: 'State',
        type: 'select',
        required: true,
        options: [
          { value: 'AL', label: 'Alabama' },
          { value: 'AK', label: 'Alaska' },
          { value: 'AZ', label: 'Arizona' },
          { value: 'AR', label: 'Arkansas' },
          { value: 'CA', label: 'California' },
          { value: 'CO', label: 'Colorado' },
          { value: 'CT', label: 'Connecticut' },
          { value: 'DE', label: 'Delaware' },
          { value: 'FL', label: 'Florida' },
          { value: 'GA', label: 'Georgia' },
          { value: 'HI', label: 'Hawaii' },
          { value: 'ID', label: 'Idaho' },
          { value: 'IL', label: 'Illinois' },
          { value: 'IN', label: 'Indiana' },
          { value: 'IA', label: 'Iowa' },
          { value: 'KS', label: 'Kansas' },
          { value: 'KY', label: 'Kentucky' },
          { value: 'LA', label: 'Louisiana' },
          { value: 'ME', label: 'Maine' },
          { value: 'MD', label: 'Maryland' },
          { value: 'MA', label: 'Massachusetts' },
          { value: 'MI', label: 'Michigan' },
          { value: 'MN', label: 'Minnesota' },
          { value: 'MS', label: 'Mississippi' },
          { value: 'MO', label: 'Missouri' },
          { value: 'MT', label: 'Montana' },
          { value: 'NE', label: 'Nebraska' },
          { value: 'NV', label: 'Nevada' },
          { value: 'NH', label: 'New Hampshire' },
          { value: 'NJ', label: 'New Jersey' },
          { value: 'NM', label: 'New Mexico' },
          { value: 'NY', label: 'New York' },
          { value: 'NC', label: 'North Carolina' },
          { value: 'ND', label: 'North Dakota' },
          { value: 'OH', label: 'Ohio' },
          { value: 'OK', label: 'Oklahoma' },
          { value: 'OR', label: 'Oregon' },
          { value: 'PA', label: 'Pennsylvania' },
          { value: 'RI', label: 'Rhode Island' },
          { value: 'SC', label: 'South Carolina' },
          { value: 'SD', label: 'South Dakota' },
          { value: 'TN', label: 'Tennessee' },
          { value: 'TX', label: 'Texas' },
          { value: 'UT', label: 'Utah' },
          { value: 'VT', label: 'Vermont' },
          { value: 'VA', label: 'Virginia' },
          { value: 'WA', label: 'Washington' },
          { value: 'WV', label: 'West Virginia' },
          { value: 'WI', label: 'Wisconsin' },
          { value: 'WY', label: 'Wyoming' }
        ]
      },
      {
        key: 'travel_info.us_zip_code',
        label: 'Zip Code',
        type: 'text',
        required: true,
        placeholder: '12345 or 12345-1234'
      },
      {
        key: 'travel_info.phone_number',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      }
    ]
  },

  'NON-RECOGNIZED/-MEMBER COUNTRY REP(G3)': {
    title: 'Mission/Organization Information',
    fields: [
      {
        key: 'travel_info.sponsoring_mission_organization',
        label: 'Sponsoring Mission/Organization',
        type: 'text',
        required: true,
        placeholder: 'Enter sponsoring mission/organization'
      },
      {
        key: 'travel_info.contact_surnames',
        label: 'Contact Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter contact surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Contact Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter contact given names'
      },
      {
        key: 'travel_info.us_address_line1',
        label: 'U.S. Address (Line 1)',
        type: 'text',
        required: true,
        placeholder: 'Enter U.S. address line 1'
      },
      {
        key: 'travel_info.us_address_line2',
        label: 'U.S. Address (Line 2)',
        type: 'text',
        required: false,
        optional: true,
        placeholder: 'Enter U.S. address line 2 (optional)'
      },
      {
        key: 'travel_info.us_city',
        label: 'City',
        type: 'text',
        required: true,
        placeholder: 'Enter city'
      },
      {
        key: 'travel_info.us_state',
        label: 'State',
        type: 'select',
        required: true,
        options: [
          { value: 'AL', label: 'Alabama' },
          { value: 'AK', label: 'Alaska' },
          { value: 'AZ', label: 'Arizona' },
          { value: 'AR', label: 'Arkansas' },
          { value: 'CA', label: 'California' },
          { value: 'CO', label: 'Colorado' },
          { value: 'CT', label: 'Connecticut' },
          { value: 'DE', label: 'Delaware' },
          { value: 'FL', label: 'Florida' },
          { value: 'GA', label: 'Georgia' },
          { value: 'HI', label: 'Hawaii' },
          { value: 'ID', label: 'Idaho' },
          { value: 'IL', label: 'Illinois' },
          { value: 'IN', label: 'Indiana' },
          { value: 'IA', label: 'Iowa' },
          { value: 'KS', label: 'Kansas' },
          { value: 'KY', label: 'Kentucky' },
          { value: 'LA', label: 'Louisiana' },
          { value: 'ME', label: 'Maine' },
          { value: 'MD', label: 'Maryland' },
          { value: 'MA', label: 'Massachusetts' },
          { value: 'MI', label: 'Michigan' },
          { value: 'MN', label: 'Minnesota' },
          { value: 'MS', label: 'Mississippi' },
          { value: 'MO', label: 'Missouri' },
          { value: 'MT', label: 'Montana' },
          { value: 'NE', label: 'Nebraska' },
          { value: 'NV', label: 'Nevada' },
          { value: 'NH', label: 'New Hampshire' },
          { value: 'NJ', label: 'New Jersey' },
          { value: 'NM', label: 'New Mexico' },
          { value: 'NY', label: 'New York' },
          { value: 'NC', label: 'North Carolina' },
          { value: 'ND', label: 'North Dakota' },
          { value: 'OH', label: 'Ohio' },
          { value: 'OK', label: 'Oklahoma' },
          { value: 'OR', label: 'Oregon' },
          { value: 'PA', label: 'Pennsylvania' },
          { value: 'RI', label: 'Rhode Island' },
          { value: 'SC', label: 'South Carolina' },
          { value: 'SD', label: 'South Dakota' },
          { value: 'TN', label: 'Tennessee' },
          { value: 'TX', label: 'Texas' },
          { value: 'UT', label: 'Utah' },
          { value: 'VT', label: 'Vermont' },
          { value: 'VA', label: 'Virginia' },
          { value: 'WA', label: 'Washington' },
          { value: 'WV', label: 'West Virginia' },
          { value: 'WI', label: 'Wisconsin' },
          { value: 'WY', label: 'Wyoming' }
        ]
      },
      {
        key: 'travel_info.us_zip_code',
        label: 'Zip Code',
        type: 'text',
        required: true,
        placeholder: '12345 or 12345-1234'
      },
      {
        key: 'travel_info.phone_number',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      }
    ]
  },

  'INTERNATIONAL ORG. EMPLOYEE (G4)': {
    title: 'Mission/Organization Information',
    fields: [
      {
        key: 'travel_info.sponsoring_mission_organization',
        label: 'Sponsoring Mission/Organization',
        type: 'text',
        required: true,
        placeholder: 'Enter sponsoring mission/organization'
      },
      {
        key: 'travel_info.contact_surnames',
        label: 'Contact Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter contact surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Contact Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter contact given names'
      },
      {
        key: 'travel_info.us_address_line1',
        label: 'U.S. Address (Line 1)',
        type: 'text',
        required: true,
        placeholder: 'Enter U.S. address line 1'
      },
      {
        key: 'travel_info.us_address_line2',
        label: 'U.S. Address (Line 2)',
        type: 'text',
        required: false,
        optional: true,
        placeholder: 'Enter U.S. address line 2 (optional)'
      },
      {
        key: 'travel_info.us_city',
        label: 'City',
        type: 'text',
        required: true,
        placeholder: 'Enter city'
      },
      {
        key: 'travel_info.us_state',
        label: 'State',
        type: 'select',
        required: true,
        options: [
          { value: 'AL', label: 'Alabama' },
          { value: 'AK', label: 'Alaska' },
          { value: 'AZ', label: 'Arizona' },
          { value: 'AR', label: 'Arkansas' },
          { value: 'CA', label: 'California' },
          { value: 'CO', label: 'Colorado' },
          { value: 'CT', label: 'Connecticut' },
          { value: 'DE', label: 'Delaware' },
          { value: 'FL', label: 'Florida' },
          { value: 'GA', label: 'Georgia' },
          { value: 'HI', label: 'Hawaii' },
          { value: 'ID', label: 'Idaho' },
          { value: 'IL', label: 'Illinois' },
          { value: 'IN', label: 'Indiana' },
          { value: 'IA', label: 'Iowa' },
          { value: 'KS', label: 'Kansas' },
          { value: 'KY', label: 'Kentucky' },
          { value: 'LA', label: 'Louisiana' },
          { value: 'ME', label: 'Maine' },
          { value: 'MD', label: 'Maryland' },
          { value: 'MA', label: 'Massachusetts' },
          { value: 'MI', label: 'Michigan' },
          { value: 'MN', label: 'Minnesota' },
          { value: 'MS', label: 'Mississippi' },
          { value: 'MO', label: 'Missouri' },
          { value: 'MT', label: 'Montana' },
          { value: 'NE', label: 'Nebraska' },
          { value: 'NV', label: 'Nevada' },
          { value: 'NH', label: 'New Hampshire' },
          { value: 'NJ', label: 'New Jersey' },
          { value: 'NM', label: 'New Mexico' },
          { value: 'NY', label: 'New York' },
          { value: 'NC', label: 'North Carolina' },
          { value: 'ND', label: 'North Dakota' },
          { value: 'OH', label: 'Ohio' },
          { value: 'OK', label: 'Oklahoma' },
          { value: 'OR', label: 'Oregon' },
          { value: 'PA', label: 'Pennsylvania' },
          { value: 'RI', label: 'Rhode Island' },
          { value: 'SC', label: 'South Carolina' },
          { value: 'SD', label: 'South Dakota' },
          { value: 'TN', label: 'Tennessee' },
          { value: 'TX', label: 'Texas' },
          { value: 'UT', label: 'Utah' },
          { value: 'VT', label: 'Vermont' },
          { value: 'VA', label: 'Virginia' },
          { value: 'WA', label: 'Washington' },
          { value: 'WV', label: 'West Virginia' },
          { value: 'WI', label: 'Wisconsin' },
          { value: 'WY', label: 'Wyoming' }
        ]
      },
      {
        key: 'travel_info.us_zip_code',
        label: 'Zip Code',
        type: 'text',
        required: true,
        placeholder: '12345 or 12345-1234'
      },
      {
        key: 'travel_info.phone_number',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      }
    ]
  },

  'PERSONAL EMP. OF A G1, 2, 3, OR 4 (G5)': {
    title: 'Mission/Organization Information',
    fields: [
      {
        key: 'travel_info.sponsoring_mission_organization',
        label: 'Sponsoring Mission/Organization',
        type: 'text',
        required: true,
        placeholder: 'Enter sponsoring mission/organization'
      },
      {
        key: 'travel_info.contact_surnames',
        label: 'Contact Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter contact surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Contact Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter contact given names'
      },
      {
        key: 'travel_info.us_address_line1',
        label: 'U.S. Address (Line 1)',
        type: 'text',
        required: true,
        placeholder: 'Enter U.S. address line 1'
      },
      {
        key: 'travel_info.us_address_line2',
        label: 'U.S. Address (Line 2)',
        type: 'text',
        required: false,
        optional: true,
        placeholder: 'Enter U.S. address line 2 (optional)'
      },
      {
        key: 'travel_info.us_city',
        label: 'City',
        type: 'text',
        required: true,
        placeholder: 'Enter city'
      },
      {
        key: 'travel_info.us_state',
        label: 'State',
        type: 'select',
        required: true,
        options: [
          { value: 'AL', label: 'Alabama' },
          { value: 'AK', label: 'Alaska' },
          { value: 'AZ', label: 'Arizona' },
          { value: 'AR', label: 'Arkansas' },
          { value: 'CA', label: 'California' },
          { value: 'CO', label: 'Colorado' },
          { value: 'CT', label: 'Connecticut' },
          { value: 'DE', label: 'Delaware' },
          { value: 'FL', label: 'Florida' },
          { value: 'GA', label: 'Georgia' },
          { value: 'HI', label: 'Hawaii' },
          { value: 'ID', label: 'Idaho' },
          { value: 'IL', label: 'Illinois' },
          { value: 'IN', label: 'Indiana' },
          { value: 'IA', label: 'Iowa' },
          { value: 'KS', label: 'Kansas' },
          { value: 'KY', label: 'Kentucky' },
          { value: 'LA', label: 'Louisiana' },
          { value: 'ME', label: 'Maine' },
          { value: 'MD', label: 'Maryland' },
          { value: 'MA', label: 'Massachusetts' },
          { value: 'MI', label: 'Michigan' },
          { value: 'MN', label: 'Minnesota' },
          { value: 'MS', label: 'Mississippi' },
          { value: 'MO', label: 'Missouri' },
          { value: 'MT', label: 'Montana' },
          { value: 'NE', label: 'Nebraska' },
          { value: 'NV', label: 'Nevada' },
          { value: 'NH', label: 'New Hampshire' },
          { value: 'NJ', label: 'New Jersey' },
          { value: 'NM', label: 'New Mexico' },
          { value: 'NY', label: 'New York' },
          { value: 'NC', label: 'North Carolina' },
          { value: 'ND', label: 'North Dakota' },
          { value: 'OH', label: 'Ohio' },
          { value: 'OK', label: 'Oklahoma' },
          { value: 'OR', label: 'Oregon' },
          { value: 'PA', label: 'Pennsylvania' },
          { value: 'RI', label: 'Rhode Island' },
          { value: 'SC', label: 'South Carolina' },
          { value: 'SD', label: 'South Dakota' },
          { value: 'TN', label: 'Tennessee' },
          { value: 'TX', label: 'Texas' },
          { value: 'UT', label: 'Utah' },
          { value: 'VT', label: 'Vermont' },
          { value: 'VA', label: 'Virginia' },
          { value: 'WA', label: 'Washington' },
          { value: 'WV', label: 'West Virginia' },
          { value: 'WI', label: 'Wisconsin' },
          { value: 'WY', label: 'Wyoming' }
        ]
      },
      {
        key: 'travel_info.us_zip_code',
        label: 'Zip Code',
        type: 'text',
        required: true,
        placeholder: '12345 or 12345-1234'
      },
      {
        key: 'travel_info.phone_number',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      }
    ]
  },

  'SPECIALTY OCCUPATION (H1B)': {
    title: 'Application Information',
    fields: [
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'NURSE IN SHORTAGE AREA (H1C)': {
    title: 'Application Information',
    fields: [
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'AGRICULTURAL WORKER (H2A)': {
    title: 'Application Information',
    fields: [
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'NONAGRICULTURAL WORKER (H2B)': {
    title: 'Application Information',
    fields: [
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'TRAINEE (H3)': {
    title: 'Application Information',
    fields: [
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'CHILD OF AN H (H4)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'SPOUSE OF AN H (H4)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'CHILD OF AN I (I)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF AN I (I)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'CHILD OF A J1 (J2)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF A J1 (J2)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'CHILD OF A K1 (K2)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'CHILD OF A K3 (K4)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'FIANCÉ(E) OF A U.S. CITIZEN (K1)': {
    title: 'Application Information',
    fields: [
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'SPOUSE OF A U.S. CITIZEN (K3)': {
    title: 'Application Information',
    fields: [
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'INTRACOMPANY TRANSFEREE (L1)': {
    title: 'Application Information',
    fields: [
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'CHILD OF A L1 (L2)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'SPOUSE OF A L1 (L2)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'CHILD OF M1 (M2)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF M1 (M2)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'CHILD OF A N8 (N9)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'CHILD OF NATO 1 (NATO1)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF NATO1 (NATO1)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'CHILD OF NATO2 (NATO2)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF NATO2 (NATO2)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'CHILD OF NATO3 (NATO3)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF NATO3 (NATO3)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'CHILD OF NATO4 (NATO4)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF NATO4 (NATO4)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'CHILD OF NATO5 (NATO5)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF NATO5 (NATO5)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'CHILD OF NATO6 (NATO6)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF NATO6 (NATO6)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'CHILD OF NATO7 (NATO7)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF NATO7 (NATO7)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'PRINCIPAL REPRESENTATIVE (NATO1)': {
    title: 'Mission/Organization Information',
    fields: [
      {
        key: 'travel_info.sponsoring_mission_organization',
        label: 'Sponsoring Mission/Organization',
        type: 'text',
        required: true,
        placeholder: 'Enter sponsoring mission/organization'
      },
      {
        key: 'travel_info.contact_surnames',
        label: 'Contact Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter contact surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Contact Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter contact given names'
      },
      {
        key: 'travel_info.us_address_line1',
        label: 'U.S. Address (Line 1)',
        type: 'text',
        required: true,
        placeholder: 'Enter U.S. address line 1'
      },
      {
        key: 'travel_info.us_address_line2',
        label: 'U.S. Address (Line 2)',
        type: 'text',
        required: false,
        optional: true,
        placeholder: 'Enter U.S. address line 2 (optional)'
      },
      {
        key: 'travel_info.us_city',
        label: 'City',
        type: 'text',
        required: true,
        placeholder: 'Enter city'
      },
      {
        key: 'travel_info.us_state',
        label: 'State',
        type: 'select',
        required: true,
        options: [
          { value: 'AL', label: 'Alabama' },
          { value: 'AK', label: 'Alaska' },
          { value: 'AZ', label: 'Arizona' },
          { value: 'AR', label: 'Arkansas' },
          { value: 'CA', label: 'California' },
          { value: 'CO', label: 'Colorado' },
          { value: 'CT', label: 'Connecticut' },
          { value: 'DE', label: 'Delaware' },
          { value: 'FL', label: 'Florida' },
          { value: 'GA', label: 'Georgia' },
          { value: 'HI', label: 'Hawaii' },
          { value: 'ID', label: 'Idaho' },
          { value: 'IL', label: 'Illinois' },
          { value: 'IN', label: 'Indiana' },
          { value: 'IA', label: 'Iowa' },
          { value: 'KS', label: 'Kansas' },
          { value: 'KY', label: 'Kentucky' },
          { value: 'LA', label: 'Louisiana' },
          { value: 'ME', label: 'Maine' },
          { value: 'MD', label: 'Maryland' },
          { value: 'MA', label: 'Massachusetts' },
          { value: 'MI', label: 'Michigan' },
          { value: 'MN', label: 'Minnesota' },
          { value: 'MS', label: 'Mississippi' },
          { value: 'MO', label: 'Missouri' },
          { value: 'MT', label: 'Montana' },
          { value: 'NE', label: 'Nebraska' },
          { value: 'NV', label: 'Nevada' },
          { value: 'NH', label: 'New Hampshire' },
          { value: 'NJ', label: 'New Jersey' },
          { value: 'NM', label: 'New Mexico' },
          { value: 'NY', label: 'New York' },
          { value: 'NC', label: 'North Carolina' },
          { value: 'ND', label: 'North Dakota' },
          { value: 'OH', label: 'Ohio' },
          { value: 'OK', label: 'Oklahoma' },
          { value: 'OR', label: 'Oregon' },
          { value: 'PA', label: 'Pennsylvania' },
          { value: 'RI', label: 'Rhode Island' },
          { value: 'SC', label: 'South Carolina' },
          { value: 'SD', label: 'South Dakota' },
          { value: 'TN', label: 'Tennessee' },
          { value: 'TX', label: 'Texas' },
          { value: 'UT', label: 'Utah' },
          { value: 'VT', label: 'Vermont' },
          { value: 'VA', label: 'Virginia' },
          { value: 'WA', label: 'Washington' },
          { value: 'WV', label: 'West Virginia' },
          { value: 'WI', label: 'Wisconsin' },
          { value: 'WY', label: 'Wyoming' }
        ]
      },
      {
        key: 'travel_info.us_zip_code',
        label: 'Zip Code',
        type: 'text',
        required: true,
        placeholder: '12345 or 12345-1234'
      },
      {
        key: 'travel_info.phone_number',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      }
    ]
  },

  'REPRESENTATIVE (NATO2)': {
    title: 'Mission/Organization Information',
    fields: [
      {
        key: 'travel_info.sponsoring_mission_organization',
        label: 'Sponsoring Mission/Organization',
        type: 'text',
        required: true,
        placeholder: 'Enter sponsoring mission/organization'
      },
      {
        key: 'travel_info.contact_surnames',
        label: 'Contact Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter contact surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Contact Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter contact given names'
      },
      {
        key: 'travel_info.us_address_line1',
        label: 'U.S. Address (Line 1)',
        type: 'text',
        required: true,
        placeholder: 'Enter U.S. address line 1'
      },
      {
        key: 'travel_info.us_address_line2',
        label: 'U.S. Address (Line 2)',
        type: 'text',
        required: false,
        optional: true,
        placeholder: 'Enter U.S. address line 2 (optional)'
      },
      {
        key: 'travel_info.us_city',
        label: 'City',
        type: 'text',
        required: true,
        placeholder: 'Enter city'
      },
      {
        key: 'travel_info.us_state',
        label: 'State',
        type: 'select',
        required: true,
        options: [
          { value: 'AL', label: 'Alabama' },
          { value: 'AK', label: 'Alaska' },
          { value: 'AZ', label: 'Arizona' },
          { value: 'AR', label: 'Arkansas' },
          { value: 'CA', label: 'California' },
          { value: 'CO', label: 'Colorado' },
          { value: 'CT', label: 'Connecticut' },
          { value: 'DE', label: 'Delaware' },
          { value: 'FL', label: 'Florida' },
          { value: 'GA', label: 'Georgia' },
          { value: 'HI', label: 'Hawaii' },
          { value: 'ID', label: 'Idaho' },
          { value: 'IL', label: 'Illinois' },
          { value: 'IN', label: 'Indiana' },
          { value: 'IA', label: 'Iowa' },
          { value: 'KS', label: 'Kansas' },
          { value: 'KY', label: 'Kentucky' },
          { value: 'LA', label: 'Louisiana' },
          { value: 'ME', label: 'Maine' },
          { value: 'MD', label: 'Maryland' },
          { value: 'MA', label: 'Massachusetts' },
          { value: 'MI', label: 'Michigan' },
          { value: 'MN', label: 'Minnesota' },
          { value: 'MS', label: 'Mississippi' },
          { value: 'MO', label: 'Missouri' },
          { value: 'MT', label: 'Montana' },
          { value: 'NE', label: 'Nebraska' },
          { value: 'NV', label: 'Nevada' },
          { value: 'NH', label: 'New Hampshire' },
          { value: 'NJ', label: 'New Jersey' },
          { value: 'NM', label: 'New Mexico' },
          { value: 'NY', label: 'New York' },
          { value: 'NC', label: 'North Carolina' },
          { value: 'ND', label: 'North Dakota' },
          { value: 'OH', label: 'Ohio' },
          { value: 'OK', label: 'Oklahoma' },
          { value: 'OR', label: 'Oregon' },
          { value: 'PA', label: 'Pennsylvania' },
          { value: 'RI', label: 'Rhode Island' },
          { value: 'SC', label: 'South Carolina' },
          { value: 'SD', label: 'South Dakota' },
          { value: 'TN', label: 'Tennessee' },
          { value: 'TX', label: 'Texas' },
          { value: 'UT', label: 'Utah' },
          { value: 'VT', label: 'Vermont' },
          { value: 'VA', label: 'Virginia' },
          { value: 'WA', label: 'Washington' },
          { value: 'WV', label: 'West Virginia' },
          { value: 'WI', label: 'Wisconsin' },
          { value: 'WY', label: 'Wyoming' }
        ]
      },
      {
        key: 'travel_info.us_zip_code',
        label: 'Zip Code',
        type: 'text',
        required: true,
        placeholder: '12345 or 12345-1234'
      },
      {
        key: 'travel_info.phone_number',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      }
    ]
  },

  'CLERICAL STAFF (NATO3)': {
    title: 'Mission/Organization Information',
    fields: [
      {
        key: 'travel_info.sponsoring_mission_organization',
        label: 'Sponsoring Mission/Organization',
        type: 'text',
        required: true,
        placeholder: 'Enter sponsoring mission/organization'
      },
      {
        key: 'travel_info.contact_surnames',
        label: 'Contact Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter contact surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Contact Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter contact given names'
      },
      {
        key: 'travel_info.us_address_line1',
        label: 'U.S. Address (Line 1)',
        type: 'text',
        required: true,
        placeholder: 'Enter U.S. address line 1'
      },
      {
        key: 'travel_info.us_address_line2',
        label: 'U.S. Address (Line 2)',
        type: 'text',
        required: false,
        optional: true,
        placeholder: 'Enter U.S. address line 2 (optional)'
      },
      {
        key: 'travel_info.us_city',
        label: 'City',
        type: 'text',
        required: true,
        placeholder: 'Enter city'
      },
      {
        key: 'travel_info.us_state',
        label: 'State',
        type: 'select',
        required: true,
        options: [
          { value: 'AL', label: 'Alabama' },
          { value: 'AK', label: 'Alaska' },
          { value: 'AZ', label: 'Arizona' },
          { value: 'AR', label: 'Arkansas' },
          { value: 'CA', label: 'California' },
          { value: 'CO', label: 'Colorado' },
          { value: 'CT', label: 'Connecticut' },
          { value: 'DE', label: 'Delaware' },
          { value: 'FL', label: 'Florida' },
          { value: 'GA', label: 'Georgia' },
          { value: 'HI', label: 'Hawaii' },
          { value: 'ID', label: 'Idaho' },
          { value: 'IL', label: 'Illinois' },
          { value: 'IN', label: 'Indiana' },
          { value: 'IA', label: 'Iowa' },
          { value: 'KS', label: 'Kansas' },
          { value: 'KY', label: 'Kentucky' },
          { value: 'LA', label: 'Louisiana' },
          { value: 'ME', label: 'Maine' },
          { value: 'MD', label: 'Maryland' },
          { value: 'MA', label: 'Massachusetts' },
          { value: 'MI', label: 'Michigan' },
          { value: 'MN', label: 'Minnesota' },
          { value: 'MS', label: 'Mississippi' },
          { value: 'MO', label: 'Missouri' },
          { value: 'MT', label: 'Montana' },
          { value: 'NE', label: 'Nebraska' },
          { value: 'NV', label: 'Nevada' },
          { value: 'NH', label: 'New Hampshire' },
          { value: 'NJ', label: 'New Jersey' },
          { value: 'NM', label: 'New Mexico' },
          { value: 'NY', label: 'New York' },
          { value: 'NC', label: 'North Carolina' },
          { value: 'ND', label: 'North Dakota' },
          { value: 'OH', label: 'Ohio' },
          { value: 'OK', label: 'Oklahoma' },
          { value: 'OR', label: 'Oregon' },
          { value: 'PA', label: 'Pennsylvania' },
          { value: 'RI', label: 'Rhode Island' },
          { value: 'SC', label: 'South Carolina' },
          { value: 'SD', label: 'South Dakota' },
          { value: 'TN', label: 'Tennessee' },
          { value: 'TX', label: 'Texas' },
          { value: 'UT', label: 'Utah' },
          { value: 'VT', label: 'Vermont' },
          { value: 'VA', label: 'Virginia' },
          { value: 'WA', label: 'Washington' },
          { value: 'WV', label: 'West Virginia' },
          { value: 'WI', label: 'Wisconsin' },
          { value: 'WY', label: 'Wyoming' }
        ]
      },
      {
        key: 'travel_info.us_zip_code',
        label: 'Zip Code',
        type: 'text',
        required: true,
        placeholder: '12345 or 12345-1234'
      },
      {
        key: 'travel_info.phone_number',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      }
    ]
  },

  'OFFICIAL (NATO4)': {
    title: 'Mission/Organization Information',
    fields: [
      {
        key: 'travel_info.sponsoring_mission_organization',
        label: 'Sponsoring Mission/Organization',
        type: 'text',
        required: true,
        placeholder: 'Enter sponsoring mission/organization'
      },
      {
        key: 'travel_info.contact_surnames',
        label: 'Contact Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter contact surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Contact Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter contact given names'
      },
      {
        key: 'travel_info.us_address_line1',
        label: 'U.S. Address (Line 1)',
        type: 'text',
        required: true,
        placeholder: 'Enter U.S. address line 1'
      },
      {
        key: 'travel_info.us_address_line2',
        label: 'U.S. Address (Line 2)',
        type: 'text',
        required: false,
        optional: true,
        placeholder: 'Enter U.S. address line 2 (optional)'
      },
      {
        key: 'travel_info.us_city',
        label: 'City',
        type: 'text',
        required: true,
        placeholder: 'Enter city'
      },
      {
        key: 'travel_info.us_state',
        label: 'State',
        type: 'select',
        required: true,
        options: [
          { value: 'AL', label: 'Alabama' },
          { value: 'AK', label: 'Alaska' },
          { value: 'AZ', label: 'Arizona' },
          { value: 'AR', label: 'Arkansas' },
          { value: 'CA', label: 'California' },
          { value: 'CO', label: 'Colorado' },
          { value: 'CT', label: 'Connecticut' },
          { value: 'DE', label: 'Delaware' },
          { value: 'FL', label: 'Florida' },
          { value: 'GA', label: 'Georgia' },
          { value: 'HI', label: 'Hawaii' },
          { value: 'ID', label: 'Idaho' },
          { value: 'IL', label: 'Illinois' },
          { value: 'IN', label: 'Indiana' },
          { value: 'IA', label: 'Iowa' },
          { value: 'KS', label: 'Kansas' },
          { value: 'KY', label: 'Kentucky' },
          { value: 'LA', label: 'Louisiana' },
          { value: 'ME', label: 'Maine' },
          { value: 'MD', label: 'Maryland' },
          { value: 'MA', label: 'Massachusetts' },
          { value: 'MI', label: 'Michigan' },
          { value: 'MN', label: 'Minnesota' },
          { value: 'MS', label: 'Mississippi' },
          { value: 'MO', label: 'Missouri' },
          { value: 'MT', label: 'Montana' },
          { value: 'NE', label: 'Nebraska' },
          { value: 'NV', label: 'Nevada' },
          { value: 'NH', label: 'New Hampshire' },
          { value: 'NJ', label: 'New Jersey' },
          { value: 'NM', label: 'New Mexico' },
          { value: 'NY', label: 'New York' },
          { value: 'NC', label: 'North Carolina' },
          { value: 'ND', label: 'North Dakota' },
          { value: 'OH', label: 'Ohio' },
          { value: 'OK', label: 'Oklahoma' },
          { value: 'OR', label: 'Oregon' },
          { value: 'PA', label: 'Pennsylvania' },
          { value: 'RI', label: 'Rhode Island' },
          { value: 'SC', label: 'South Carolina' },
          { value: 'SD', label: 'South Dakota' },
          { value: 'TN', label: 'Tennessee' },
          { value: 'TX', label: 'Texas' },
          { value: 'UT', label: 'Utah' },
          { value: 'VT', label: 'Vermont' },
          { value: 'VA', label: 'Virginia' },
          { value: 'WA', label: 'Washington' },
          { value: 'WV', label: 'West Virginia' },
          { value: 'WI', label: 'Wisconsin' },
          { value: 'WY', label: 'Wyoming' }
        ]
      },
      {
        key: 'travel_info.us_zip_code',
        label: 'Zip Code',
        type: 'text',
        required: true,
        placeholder: '12345 or 12345-1234'
      },
      {
        key: 'travel_info.phone_number',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      }
    ]
  },

  'EXPERT (NATO5)': {
    title: 'Mission/Organization Information',
    fields: [
      {
        key: 'travel_info.sponsoring_mission_organization',
        label: 'Sponsoring Mission/Organization',
        type: 'text',
        required: true,
        placeholder: 'Enter sponsoring mission/organization'
      },
      {
        key: 'travel_info.contact_surnames',
        label: 'Contact Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter contact surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Contact Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter contact given names'
      },
      {
        key: 'travel_info.us_address_line1',
        label: 'U.S. Address (Line 1)',
        type: 'text',
        required: true,
        placeholder: 'Enter U.S. address line 1'
      },
      {
        key: 'travel_info.us_address_line2',
        label: 'U.S. Address (Line 2)',
        type: 'text',
        required: false,
        optional: true,
        placeholder: 'Enter U.S. address line 2 (optional)'
      },
      {
        key: 'travel_info.us_city',
        label: 'City',
        type: 'text',
        required: true,
        placeholder: 'Enter city'
      },
      {
        key: 'travel_info.us_state',
        label: 'State',
        type: 'select',
        required: true,
        options: [
          { value: 'AL', label: 'Alabama' },
          { value: 'AK', label: 'Alaska' },
          { value: 'AZ', label: 'Arizona' },
          { value: 'AR', label: 'Arkansas' },
          { value: 'CA', label: 'California' },
          { value: 'CO', label: 'Colorado' },
          { value: 'CT', label: 'Connecticut' },
          { value: 'DE', label: 'Delaware' },
          { value: 'FL', label: 'Florida' },
          { value: 'GA', label: 'Georgia' },
          { value: 'HI', label: 'Hawaii' },
          { value: 'ID', label: 'Idaho' },
          { value: 'IL', label: 'Illinois' },
          { value: 'IN', label: 'Indiana' },
          { value: 'IA', label: 'Iowa' },
          { value: 'KS', label: 'Kansas' },
          { value: 'KY', label: 'Kentucky' },
          { value: 'LA', label: 'Louisiana' },
          { value: 'ME', label: 'Maine' },
          { value: 'MD', label: 'Maryland' },
          { value: 'MA', label: 'Massachusetts' },
          { value: 'MI', label: 'Michigan' },
          { value: 'MN', label: 'Minnesota' },
          { value: 'MS', label: 'Mississippi' },
          { value: 'MO', label: 'Missouri' },
          { value: 'MT', label: 'Montana' },
          { value: 'NE', label: 'Nebraska' },
          { value: 'NV', label: 'Nevada' },
          { value: 'NH', label: 'New Hampshire' },
          { value: 'NJ', label: 'New Jersey' },
          { value: 'NM', label: 'New Mexico' },
          { value: 'NY', label: 'New York' },
          { value: 'NC', label: 'North Carolina' },
          { value: 'ND', label: 'North Dakota' },
          { value: 'OH', label: 'Ohio' },
          { value: 'OK', label: 'Oklahoma' },
          { value: 'OR', label: 'Oregon' },
          { value: 'PA', label: 'Pennsylvania' },
          { value: 'RI', label: 'Rhode Island' },
          { value: 'SC', label: 'South Carolina' },
          { value: 'SD', label: 'South Dakota' },
          { value: 'TN', label: 'Tennessee' },
          { value: 'TX', label: 'Texas' },
          { value: 'UT', label: 'Utah' },
          { value: 'VT', label: 'Vermont' },
          { value: 'VA', label: 'Virginia' },
          { value: 'WA', label: 'Washington' },
          { value: 'WV', label: 'West Virginia' },
          { value: 'WI', label: 'Wisconsin' },
          { value: 'WY', label: 'Wyoming' }
        ]
      },
      {
        key: 'travel_info.us_zip_code',
        label: 'Zip Code',
        type: 'text',
        required: true,
        placeholder: '12345 or 12345-1234'
      },
      {
        key: 'travel_info.phone_number',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      }
    ]
  },

  'CIVILIAN STAFF (NATO6)': {
    title: 'Mission/Organization Information',
    fields: [
      {
        key: 'travel_info.sponsoring_mission_organization',
        label: 'Sponsoring Mission/Organization',
        type: 'text',
        required: true,
        placeholder: 'Enter sponsoring mission/organization'
      },
      {
        key: 'travel_info.contact_surnames',
        label: 'Contact Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter contact surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Contact Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter contact given names'
      },
      {
        key: 'travel_info.us_address_line1',
        label: 'U.S. Address (Line 1)',
        type: 'text',
        required: true,
        placeholder: 'Enter U.S. address line 1'
      },
      {
        key: 'travel_info.us_address_line2',
        label: 'U.S. Address (Line 2)',
        type: 'text',
        required: false,
        optional: true,
        placeholder: 'Enter U.S. address line 2 (optional)'
      },
      {
        key: 'travel_info.us_city',
        label: 'City',
        type: 'text',
        required: true,
        placeholder: 'Enter city'
      },
      {
        key: 'travel_info.us_state',
        label: 'State',
        type: 'select',
        required: true,
        options: [
          { value: 'AL', label: 'Alabama' },
          { value: 'AK', label: 'Alaska' },
          { value: 'AZ', label: 'Arizona' },
          { value: 'AR', label: 'Arkansas' },
          { value: 'CA', label: 'California' },
          { value: 'CO', label: 'Colorado' },
          { value: 'CT', label: 'Connecticut' },
          { value: 'DE', label: 'Delaware' },
          { value: 'FL', label: 'Florida' },
          { value: 'GA', label: 'Georgia' },
          { value: 'HI', label: 'Hawaii' },
          { value: 'ID', label: 'Idaho' },
          { value: 'IL', label: 'Illinois' },
          { value: 'IN', label: 'Indiana' },
          { value: 'IA', label: 'Iowa' },
          { value: 'KS', label: 'Kansas' },
          { value: 'KY', label: 'Kentucky' },
          { value: 'LA', label: 'Louisiana' },
          { value: 'ME', label: 'Maine' },
          { value: 'MD', label: 'Maryland' },
          { value: 'MA', label: 'Massachusetts' },
          { value: 'MI', label: 'Michigan' },
          { value: 'MN', label: 'Minnesota' },
          { value: 'MS', label: 'Mississippi' },
          { value: 'MO', label: 'Missouri' },
          { value: 'MT', label: 'Montana' },
          { value: 'NE', label: 'Nebraska' },
          { value: 'NV', label: 'Nevada' },
          { value: 'NH', label: 'New Hampshire' },
          { value: 'NJ', label: 'New Jersey' },
          { value: 'NM', label: 'New Mexico' },
          { value: 'NY', label: 'New York' },
          { value: 'NC', label: 'North Carolina' },
          { value: 'ND', label: 'North Dakota' },
          { value: 'OH', label: 'Ohio' },
          { value: 'OK', label: 'Oklahoma' },
          { value: 'OR', label: 'Oregon' },
          { value: 'PA', label: 'Pennsylvania' },
          { value: 'RI', label: 'Rhode Island' },
          { value: 'SC', label: 'South Carolina' },
          { value: 'SD', label: 'South Dakota' },
          { value: 'TN', label: 'Tennessee' },
          { value: 'TX', label: 'Texas' },
          { value: 'UT', label: 'Utah' },
          { value: 'VT', label: 'Vermont' },
          { value: 'VA', label: 'Virginia' },
          { value: 'WA', label: 'Washington' },
          { value: 'WV', label: 'West Virginia' },
          { value: 'WI', label: 'Wisconsin' },
          { value: 'WY', label: 'Wyoming' }
        ]
      },
      {
        key: 'travel_info.us_zip_code',
        label: 'Zip Code',
        type: 'text',
        required: true,
        placeholder: '12345 or 12345-1234'
      },
      {
        key: 'travel_info.phone_number',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      }
    ]
  },

  'PERSONAL EMP. OF NATO1-NATO6 (NATO7)': {
    title: 'Mission/Organization Information',
    fields: [
      {
        key: 'travel_info.sponsoring_mission_organization',
        label: 'Sponsoring Mission/Organization',
        type: 'text',
        required: true,
        placeholder: 'Enter sponsoring mission/organization'
      },
      {
        key: 'travel_info.contact_surnames',
        label: 'Contact Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter contact surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Contact Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter contact given names'
      },
      {
        key: 'travel_info.us_address_line1',
        label: 'U.S. Address (Line 1)',
        type: 'text',
        required: true,
        placeholder: 'Enter U.S. address line 1'
      },
      {
        key: 'travel_info.us_address_line2',
        label: 'U.S. Address (Line 2)',
        type: 'text',
        required: false,
        optional: true,
        placeholder: 'Enter U.S. address line 2 (optional)'
      },
      {
        key: 'travel_info.us_city',
        label: 'City',
        type: 'text',
        required: true,
        placeholder: 'Enter city'
      },
      {
        key: 'travel_info.us_state',
        label: 'State',
        type: 'select',
        required: true,
        options: [
          { value: 'AL', label: 'Alabama' },
          { value: 'AK', label: 'Alaska' },
          { value: 'AZ', label: 'Arizona' },
          { value: 'AR', label: 'Arkansas' },
          { value: 'CA', label: 'California' },
          { value: 'CO', label: 'Colorado' },
          { value: 'CT', label: 'Connecticut' },
          { value: 'DE', label: 'Delaware' },
          { value: 'FL', label: 'Florida' },
          { value: 'GA', label: 'Georgia' },
          { value: 'HI', label: 'Hawaii' },
          { value: 'ID', label: 'Idaho' },
          { value: 'IL', label: 'Illinois' },
          { value: 'IN', label: 'Indiana' },
          { value: 'IA', label: 'Iowa' },
          { value: 'KS', label: 'Kansas' },
          { value: 'KY', label: 'Kentucky' },
          { value: 'LA', label: 'Louisiana' },
          { value: 'ME', label: 'Maine' },
          { value: 'MD', label: 'Maryland' },
          { value: 'MA', label: 'Massachusetts' },
          { value: 'MI', label: 'Michigan' },
          { value: 'MN', label: 'Minnesota' },
          { value: 'MS', label: 'Mississippi' },
          { value: 'MO', label: 'Missouri' },
          { value: 'MT', label: 'Montana' },
          { value: 'NE', label: 'Nebraska' },
          { value: 'NV', label: 'Nevada' },
          { value: 'NH', label: 'New Hampshire' },
          { value: 'NJ', label: 'New Jersey' },
          { value: 'NM', label: 'New Mexico' },
          { value: 'NY', label: 'New York' },
          { value: 'NC', label: 'North Carolina' },
          { value: 'ND', label: 'North Dakota' },
          { value: 'OH', label: 'Ohio' },
          { value: 'OK', label: 'Oklahoma' },
          { value: 'OR', label: 'Oregon' },
          { value: 'PA', label: 'Pennsylvania' },
          { value: 'RI', label: 'Rhode Island' },
          { value: 'SC', label: 'South Carolina' },
          { value: 'SD', label: 'South Dakota' },
          { value: 'TN', label: 'Tennessee' },
          { value: 'TX', label: 'Texas' },
          { value: 'UT', label: 'Utah' },
          { value: 'VT', label: 'Vermont' },
          { value: 'VA', label: 'Virginia' },
          { value: 'WA', label: 'Washington' },
          { value: 'WV', label: 'West Virginia' },
          { value: 'WI', label: 'Wisconsin' },
          { value: 'WY', label: 'Wyoming' }
        ]
      },
      {
        key: 'travel_info.us_zip_code',
        label: 'Zip Code',
        type: 'text',
        required: true,
        placeholder: '12345 or 12345-1234'
      },
      {
        key: 'travel_info.phone_number',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      }
    ]
  },

  'EXTRAORDINARY ABILITY (O1)': {
    title: 'Application Information',
    fields: [
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'ALIEN ACCOMPANYING/ASSISTING (O2)': {
    title: 'Application Information',
    fields: [
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'CHILD OF O1 OR O2 (O3)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'SPOUSE OF O1 OR O2 (O3)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'INTERNATIONALLY RECOGNIZED ALIEN (P1)': {
    title: 'Application Information',
    fields: [
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'ARTIST/ENTERTAINER EXCHANGE PROG. (P2)': {
    title: 'Application Information',
    fields: [
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'ARTIST/ENTERTAINER IN CULTURAL PROG. (P3)': {
    title: 'Application Information',
    fields: [
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'CHILD OF P1, P2 OR P3 (P4)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'SPOUSE OF P1, P2 OR P3 (P4)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'RELIGIOUS WORKER (R1)': {
    title: 'Application Information',
    fields: [
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'CHILD OF R1 (R2)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'SPOUSE OF R1 (R2)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'VICTIM OF TRAFFICKING (T1)': {
    title: 'Application Information',
    fields: [
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'SPOUSE OF T1 (T2)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'CHILD OF T1 (T3)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'PARENT OF T1 (T4)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'SIBLING OF T1 (T5)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'ADULT/MINOR CHILD OF A DERIV BEN OF A T1 (T6)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'CHILD OF TN (TD)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'SPOUSE OF TN (TD)': {
    title: 'Contact Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      }
    ]
  },

  'VICTIM OF CRIME (U1)': {
    title: 'Application Information',
    fields: [
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'SPOUSE OF U1 (U2)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'CHILD OF U1 (U3)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'PARENT OF U1 (U4)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  },

  'SIBLING OF U1 (U5)': {
    title: 'Contact and Application Information',
    fields: [
      {
        key: 'travel_info.contact_surnames',
        label: 'Surnames',
        type: 'text',
        required: true,
        placeholder: 'Enter surnames'
      },
      {
        key: 'travel_info.contact_given_names',
        label: 'Given Names',
        type: 'text',
        required: true,
        placeholder: 'Enter given names'
      },
      {
        key: 'travel_info.application_receipt_petition_number',
        label: 'Application Receipt/Petition Number',
        type: 'text',
        required: true,
        placeholder: 'Enter application receipt/petition number'
      }
    ]
  }
}

// Helper function to get conditional fields for a specify option
export const getConditionalFields = (specifyOption: string): ConditionalFieldGroup | null => {
  return conditionalFieldMap[specifyOption] || null
}

// Helper function to get all field keys that should be cleared when purpose/specify changes
export function getConditionalFieldKeys(): string[] {
  return [
    // A type fields
    'travel_info.mission_name',
    'travel_info.organization_name',
    'travel_info.contact_surnames',
    'travel_info.contact_given_names',
    'travel_info.contact_phone',
    'travel_info.contact_email',
    'travel_info.contact_address',
    'travel_info.contact_city',
    'travel_info.contact_state',
    'travel_info.contact_zip',
    'travel_info.contact_country',
    
    // C type fields
    'travel_info.contact_surnames',
    'travel_info.contact_given_names',
    
    // CW type fields
    'travel_info.application_receipt_petition_number',
    'travel_info.contact_surnames',
    'travel_info.contact_given_names',
    
    // E type fields
    'travel_info.principal_company_name',
    'travel_info.principal_visa_issued',
    'travel_info.principal_surnames',
    'travel_info.principal_given_names',
    'travel_info.principal_date_of_birth',
    
    // F type fields
    'travel_info.contact_surnames',
    'travel_info.contact_given_names',
    
    // G type fields
    'travel_info.sponsoring_mission_organization',
    'travel_info.contact_surnames',
    'travel_info.contact_given_names',
    'travel_info.us_address_line1',
    'travel_info.us_address_line2',
    'travel_info.us_city',
    'travel_info.us_state',
    'travel_info.us_zip_code',
    'travel_info.phone_number'
  ]
}

// Validation function for conditional fields
export function validateConditionalFields(specifyOption: string, formData: any): string[] {
  const errors: string[] = []
  const fieldGroup = conditionalFieldMap[specifyOption]
  
  if (!fieldGroup) {
    return errors
  }
  
  // Validate each field in the conditional field group
  fieldGroup.fields.forEach(field => {
    if (field.required) {
      const value = formData[field.key]
      
      // Check if field is empty or only whitespace
      if (!value || (typeof value === 'string' && !value.trim())) {
        errors.push(`${field.label} is required`)
      }
    }
  })
  
  // Special validation for E1/E2 executives with nested conditional fields
  if ((specifyOption === 'EXECUTIVE/MGR/ESSENTIAL EMP (E1)' || specifyOption === 'EXECUTIVE/MGR/ESSENTIAL EMP (E2)') && 
      formData['travel_info.principal_visa_issued'] === 'Yes') {
    
    // Validate principal applicant fields
    if (!formData['travel_info.principal_surnames']?.trim()) {
      errors.push('Principal applicant surnames is required')
    }
    if (!formData['travel_info.principal_given_names']?.trim()) {
      errors.push('Principal applicant given names is required')
    }
    if (!formData['travel_info.principal_date_of_birth']) {
      errors.push('Principal applicant date of birth is required')
    }
  }
  
  return errors
}

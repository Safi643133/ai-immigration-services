/**
 * DS-160 Form Field Mappings
 * 
 * This file contains the mapping between our form data structure
 * and the actual DS-160 form field names and selectors.
 */

export interface ConditionalField {
  fieldName: string;
  selector: string;
  type: 'text' | 'select' | 'radio' | 'checkbox' | 'date' | 'textarea';
  required?: boolean;
}

export interface DateSelectors {
  day: string;
  month: string;
  year: string;
}

export interface ConditionalLogic {
  value: string;
  showFields: ConditionalField[];
}

export interface FormFieldMapping {
  fieldName: string;
  selector: string;
  type: 'text' | 'select' | 'radio' | 'checkbox' | 'date' | 'date_split' | 'textarea';
  required?: boolean;
  validation?: (value: any) => boolean;
  conditional?: ConditionalLogic;
  valueMapping?: Record<string, string>;
  dateSelectors?: DateSelectors;
}

export interface FormSection {
  sectionName: string;
  fields: FormFieldMapping[];
}

export const DS160_FORM_MAPPINGS: FormSection[] = [
  {
    sectionName: 'Personal Information',
    fields: [
      {
        fieldName: 'personal_info.surnames',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SURNAME',
        type: 'text',
        required: true
      },
      {
        fieldName: 'personal_info.given_names',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_GIVEN_NAME',
        type: 'text',
        required: true
      },
      {
        fieldName: 'personal_info.full_name_native_alphabet',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_FULL_NAME_NATIVE',
        type: 'text',
        required: false
      },
      {
        fieldName: 'personal_info.full_name_native_na',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_FULL_NAME_NATIVE_NA',
        type: 'checkbox',
        required: false
      },
      {
        fieldName: 'personal_info.other_names_used',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_rblOtherNames',
        type: 'radio',
        required: true,
        valueMapping: {
          'Yes': 'Y',
          'No': 'N'
        },
        conditional: {
          value: 'Y',
          showFields: [
            {
              fieldName: 'personal_info.other_surnames_used',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_DListAlias_ctl00_tbxSURNAME',
              type: 'text',
              required: false
            },
            {
              fieldName: 'personal_info.other_given_names_used',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_DListAlias_ctl00_tbxGIVEN_NAME',
              type: 'text',
              required: false
            }
          ]
        }
      },
      {
        fieldName: 'personal_info.telecode_name',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_rblTelecodeQuestion',
        type: 'radio',
        required: true,
        valueMapping: {
          'Yes': 'Y',
          'No': 'N'
        },
        conditional: {
          value: 'Y',
          showFields: [
            {
              fieldName: 'personal_info.telecode_surnames',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_TelecodeSURNAME',
              type: 'text',
              required: false
            },
            {
              fieldName: 'personal_info.telecode_given_names',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_TelecodeGIVEN_NAME',
              type: 'text',
              required: false
            }
          ]
        }
      },
      {
        fieldName: 'personal_info.sex',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_GENDER',
        type: 'select',
        required: true,
        valueMapping: {
          'Male': 'M',
          'Female': 'F'
        }
      },
      {
        fieldName: 'personal_info.marital_status',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_MARITAL_STATUS',
        type: 'select',
        required: true,
        valueMapping: {
          'MARRIED': 'M',
          'COMMON LAW MARRIAGE': 'C',
          'CIVIL UNION / DOMESTIC PARTNERSHIP': 'P',
          'SINGLE': 'S',
          'WIDOWED': 'W',
          'DIVORCED': 'D',
          'LEGALLY SEPARATED': 'L',
          'OTHER': 'O'
        }
      },
      {
        fieldName: 'personal_info.date_of_birth',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlDOBDay',
        type: 'date_split',
        required: true,
        dateSelectors: {
          day: '#ctl00_SiteContentPlaceHolder_FormView1_ddlDOBDay',
          month: '#ctl00_SiteContentPlaceHolder_FormView1_ddlDOBMonth',
          year: '#ctl00_SiteContentPlaceHolder_FormView1_tbxDOBYear'
        }
      },
      {
        fieldName: 'personal_info.place_of_birth_city',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_POB_CITY',
        type: 'text',
        required: true
      },
      {
        fieldName: 'personal_info.place_of_birth_state',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_POB_ST_PROVINCE',
        type: 'text',
        required: false
      },
      {
        fieldName: 'personal_info.place_of_birth_state_na',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_POB_ST_PROVINCE_NA',
        type: 'checkbox',
        required: false
      },
      {
        fieldName: 'personal_info.place_of_birth_country',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_POB_CNTRY',
        type: 'select',
        required: true,
        valueMapping: {
          'AFGHANISTAN': 'AFGH',
          'ALBANIA': 'ALB',
          'ALGERIA': 'ALGR',
          'AMERICAN SAMOA': 'ASMO',
          'ANDORRA': 'ANDO',
          'ANGOLA': 'ANGL',
          'ANGUILLA': 'ANGU',
          'ANTIGUA AND BARBUDA': 'ANTI',
          'ARGENTINA': 'ARG',
          'ARMENIA': 'ARM',
          'ARUBA': 'ARB',
          'AT SEA': 'XAS',
          'AUSTRALIA': 'ASTL',
          'AUSTRIA': 'AUST',
          'AZERBAIJAN': 'AZR',
          'BAHAMAS': 'BAMA',
          'BAHRAIN': 'BAHR',
          'BANGLADESH': 'BANG',
          'BARBADOS': 'BRDO',
          'BELARUS': 'BYS',
          'BELGIUM': 'BELG',
          'BELIZE': 'BLZ',
          'BENIN': 'BENN',
          'BERMUDA': 'BERM',
          'BHUTAN': 'BHU',
          'BOLIVIA': 'BOL',
          'BOSNIA-HERZEGOVINA': 'BIH',
          'BOTSWANA': 'BOT',
          'BRAZIL': 'BRZL',
          'BRITISH INDIAN OCEAN TERRITORY': 'IOT',
          'BRUNEI': 'BRNI',
          'BULGARIA': 'BULG',
          'BURKINA FASO': 'BURK',
          'BURMA': 'BURM',
          'BURUNDI': 'BRND',
          'CAMBODIA': 'CBDA',
          'CAMEROON': 'CMRN',
          'CANADA': 'CAN',
          'CABO VERDE': 'CAVI',
          'CAYMAN ISLANDS': 'CAYI',
          'CENTRAL AFRICAN REPUBLIC': 'CAFR',
          'CHAD': 'CHAD',
          'CHILE': 'CHIL',
          'CHINA': 'CHIN',
          'CHRISTMAS ISLAND': 'CHRI',
          'COCOS KEELING ISLANDS': 'COCI',
          'COLOMBIA': 'COL',
          'COMOROS': 'COMO',
          'CONGO, DEMOCRATIC REPUBLIC OF THE': 'COD',
          'CONGO, REPUBLIC OF THE': 'CONB',
          'COOK ISLANDS': 'CKIS',
          'COSTA RICA': 'CSTR',
          'COTE D`IVOIRE': 'IVCO',
          'CROATIA': 'HRV',
          'CUBA': 'CUBA',
          'CURACAO': 'CUR',
          'CYPRUS': 'CYPR',
          'CZECH REPUBLIC': 'CZEC',
          'DENMARK': 'DEN',
          'DJIBOUTI': 'DJI',
          'DOMINICA': 'DOMN',
          'DOMINICAN REPUBLIC': 'DOMR',
          'ECUADOR': 'ECUA',
          'EGYPT': 'EGYP',
          'EL SALVADOR': 'ELSL',
          'EQUATORIAL GUINEA': 'EGN',
          'ERITREA': 'ERI',
          'ESTONIA': 'EST',
          'ESWATINI': 'SZLD',
          'ETHIOPIA': 'ETH',
          'FALKLAND ISLANDS': 'FKLI',
          'FAROE ISLANDS': 'FRO',
          'FIJI': 'FIJI',
          'FINLAND': 'FIN',
          'FRANCE': 'FRAN',
          'FRENCH POLYNESIA': 'FPOL',
          'FRENCH SOUTHERN AND ANTARCTIC TERRITORIES': 'FSAT',
          'GABON': 'GABN',
          'GAMBIA, THE': 'GAM',
          'GAZA STRIP': 'XGZ',
          'GEORGIA': 'GEO',
          'GERMANY': 'GER',
          'GHANA': 'GHAN',
          'GIBRALTAR': 'GIB',
          'GREECE': 'GRC',
          'GREENLAND': 'GRLD',
          'GRENADA': 'GREN',
          'GUAM': 'GUAM',
          'GUATEMALA': 'GUAT',
          'GUINEA': 'GNEA',
          'GUINEA - BISSAU': 'GUIB',
          'GUYANA': 'GUY',
          'HAITI': 'HAT',
          'HEARD AND MCDONALD ISLANDS': 'HMD',
          'HOLY SEE (VATICAN CITY)': 'VAT',
          'HONDURAS': 'HOND',
          'HONG KONG BNO': 'HOKO',
          'HONG KONG SAR': 'HNK',
          'HOWLAND ISLAND': 'XHI',
          'HUNGARY': 'HUNG',
          'ICELAND': 'ICLD',
          'IN THE AIR': 'XIR',
          'INDIA': 'IND',
          'INDONESIA': 'IDSA',
          'IRAN': 'IRAN',
          'IRAQ': 'IRAQ',
          'IRELAND': 'IRE',
          'ISRAEL': 'ISRL',
          'ITALY': 'ITLY',
          'JAMAICA': 'JAM',
          'JAPAN': 'JPN',
          'JERUSALEM': 'JRSM',
          'JORDAN': 'JORD',
          'KAZAKHSTAN': 'KAZ',
          'KENYA': 'KENY',
          'KIRIBATI': 'KIRI',
          'KOREA, DEMOCRATIC REPUBLIC OF (NORTH)': 'PRK',
          'KOREA, REPUBLIC OF (SOUTH)': 'KOR',
          'KOSOVO': 'KSV',
          'KUWAIT': 'KUWT',
          'KYRGYZSTAN': 'KGZ',
          'LAOS': 'LAOS',
          'LATVIA': 'LATV',
          'LEBANON': 'LEBN',
          'LESOTHO': 'LES',
          'LIBERIA': 'LIBR',
          'LIBYA': 'LBYA',
          'LIECHTENSTEIN': 'LCHT',
          'LITHUANIA': 'LITH',
          'LUXEMBOURG': 'LXM',
          'MACAU': 'MAC',
          'MACEDONIA, NORTH': 'MKD',
          'MADAGASCAR': 'MADG',
          'MALAWI': 'MALW',
          'MALAYSIA': 'MLAS',
          'MALDEN ISLAND': 'MLDI',
          'MALDIVES': 'MLDV',
          'MALI': 'MALI',
          'MALTA': 'MLTA',
          'MARSHALL ISLANDS': 'RMI',
          'MAURITANIA': 'MAUR',
          'MAURITIUS': 'MRTS',
          'MAYOTTE': 'MYT',
          'MICRONESIA': 'FSM',
          'MIDWAY ISLANDS': 'MDWI',
          'MOLDOVA': 'MLD',
          'MONACO': 'MON',
          'MONGOLIA': 'MONG',
          'MONTENEGRO': 'MTG',
          'MONTSERRAT': 'MONT',
          'MOROCCO': 'MORO',
          'MOZAMBIQUE': 'MOZ',
          'NAMIBIA': 'NAMB',
          'NAURU': 'NAU',
          'NEPAL': 'NEP',
          'NETHERLANDS': 'NETH',
          'NEW CALEDONIA': 'NCAL',
          'NEW ZEALAND': 'NZLD',
          'NICARAGUA': 'NIC',
          'NIGER': 'NIR',
          'NIGERIA': 'NRA',
          'NIUE': 'NIUE',
          'NORFOLK ISLAND': 'NFK',
          'NORTH MARIANA ISLANDS': 'MNP',
          'NORTHERN IRELAND': 'NIRE',
          'NORWAY': 'NORW',
          'OMAN': 'OMAN',
          'PAKISTAN': 'PKST',
          'PALAU': 'PALA',
          'PALMYRA ATOLL': 'PLMR',
          'PANAMA': 'PAN',
          'PAPUA NEW GUINEA': 'PNG',
          'PARAGUAY': 'PARA',
          'PERU': 'PERU',
          'PHILIPPINES': 'PHIL',
          'PITCAIRN ISLANDS': 'PITC',
          'POLAND': 'POL',
          'PORTUGAL': 'PORT',
          'PUERTO RICO': 'PR',
          'QATAR': 'QTAR',
          'ROMANIA': 'ROM',
          'RUSSIA': 'RUS',
          'RWANDA': 'RWND',
          'SAINT MARTIN': 'MAF',
          'SAMOA': 'WSAM',
          'SAN MARINO': 'SMAR',
          'SAO TOME AND PRINCIPE': 'STPR',
          'SAUDI ARABIA': 'SARB',
          'SENEGAL': 'SENG',
          'SERBIA': 'SBA',
          'SEYCHELLES': 'SEYC',
          'SIERRA LEONE': 'SLEO',
          'SINGAPORE': 'SING',
          'SINT MAARTEN': 'STM',
          'SLOVAKIA': 'SVK',
          'SLOVENIA': 'SVN',
          'SOLOMON ISLANDS': 'SLMN',
          'SOMALIA': 'SOMA',
          'SOUTH AFRICA': 'SAFR',
          'SOUTH GEORGIA AND THE SOUTH SANDWICH ISLAND': 'SGS',
          'SOUTH SUDAN': 'SSDN',
          'SPAIN': 'SPN',
          'SRI LANKA': 'SRL',
          'ST. BARTHELEMY': 'STBR',
          'ST. HELENA': 'SHEL',
          'ST. KITTS AND NEVIS': 'STCN',
          'ST. LUCIA': 'SLCA',
          'ST. PIERRE AND MIQUELON': 'SPMI',
          'ST. VINCENT AND THE GRENADINES': 'STVN',
          'SUDAN': 'SUDA',
          'SURINAME': 'SURM',
          'SVALBARD': 'SJM',
          'SWEDEN': 'SWDN',
          'SWITZERLAND': 'SWTZ',
          'SYRIA': 'SYR',
          'TAIWAN': 'TWAN',
          'TAJIKISTAN': 'TJK',
          'TANZANIA': 'TAZN',
          'THAILAND': 'THAI',
          'TIMOR-LESTE': 'TMOR',
          'TOGO': 'TOGO',
          'TOKELAU': 'TKL',
          'TONGA': 'TONG',
          'TRINIDAD AND TOBAGO': 'TRIN',
          'TUNISIA': 'TNSA',
          'TURKEY': 'TRKY',
          'TURKMENISTAN': 'TKM',
          'TURKS AND CAICOS ISLANDS': 'TCIS',
          'TUVALU': 'TUV',
          'UGANDA': 'UGAN',
          'UKRAINE': 'UKR',
          'UNITED ARAB EMIRATES': 'UAE',
          'UNITED KINGDOM': 'GRBR',
          'UNITED STATES OF AMERICA': 'USA',
          'URUGUAY': 'URU',
          'UZBEKISTAN': 'UZB',
          'VANUATU': 'VANU',
          'VENEZUELA': 'VENZ',
          'VIETNAM': 'VTNM',
          'VIRGIN ISLANDS (U.S.)': 'VI',
          'VIRGIN ISLANDS, BRITISH': 'BRVI',
          'WAKE ISLAND': 'WKI',
          'WALLIS AND FUTUNA ISLANDS': 'WAFT',
          'WEST BANK': 'XWB',
          'WESTERN SAHARA': 'SSAH',
          'YEMEN': 'YEM',
          'ZAMBIA': 'ZAMB',
          'ZIMBABWE': 'ZIMB'
        }
      },
      {
        fieldName: 'personal_info.nationality',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlNationality',
        type: 'select',
        required: true
      },
      {
        fieldName: 'personal_info.other_nationalities',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_rblOtherNationalities',
        type: 'radio',
        required: true
      },
      {
        fieldName: 'personal_info.us_social_security_number',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtSocialSecurityNumber',
        type: 'text',
        required: false
      },
      {
        fieldName: 'personal_info.us_taxpayer_id_number',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtTaxpayerIDNumber',
        type: 'text',
        required: false
      },
      {
        fieldName: 'personal_info.national_identification_number',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtNationalIDNumber',
        type: 'text',
        required: false
      }
    ]
  },
  {
    sectionName: 'Passport Information',
    fields: [
      {
        fieldName: 'passport_info.passport_number',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtPassportNumber',
        type: 'text',
        required: true
      },
      {
        fieldName: 'passport_info.passport_type',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlPassportType',
        type: 'select',
        required: true
      },
      {
        fieldName: 'passport_info.passport_issue_date',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtPassportIssueDate',
        type: 'date',
        required: true
      },
      {
        fieldName: 'passport_info.passport_expiry_date',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtPassportExpiryDate',
        type: 'date',
        required: true
      },
      {
        fieldName: 'passport_info.passport_issued_city',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtPassportIssuedCity',
        type: 'text',
        required: true
      },
      {
        fieldName: 'passport_info.passport_issued_state',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtPassportIssuedState',
        type: 'text',
        required: false
      },
      {
        fieldName: 'passport_info.passport_issued_country',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlPassportIssuedCountry',
        type: 'select',
        required: true
      },
      {
        fieldName: 'passport_info.passport_lost_stolen',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_rblPassportLostStolen',
        type: 'radio',
        required: true
      }
    ]
  },
  {
    sectionName: 'Contact Information',
    fields: [
      {
        fieldName: 'contact_info.home_address_line1',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtHomeAddressLine1',
        type: 'text',
        required: true
      },
      {
        fieldName: 'contact_info.home_city',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtHomeCity',
        type: 'text',
        required: true
      },
      {
        fieldName: 'contact_info.home_state',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtHomeState',
        type: 'text',
        required: false
      },
      {
        fieldName: 'contact_info.home_postal_code',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtHomePostalCode',
        type: 'text',
        required: true
      },
      {
        fieldName: 'contact_info.home_country',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlHomeCountry',
        type: 'select',
        required: true
      },
      {
        fieldName: 'contact_info.primary_phone',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtPrimaryPhone',
        type: 'text',
        required: true
      },
      {
        fieldName: 'contact_info.email_address',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtEmailAddress',
        type: 'text',
        required: true
      }
    ]
  },
  {
    sectionName: 'Travel Information',
    fields: [
      {
        fieldName: 'travel_info.purpose_of_trip',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlPurposeOfTrip',
        type: 'select',
        required: true
      },
      {
        fieldName: 'travel_info.purpose_specify',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtPurposeSpecify',
        type: 'text',
        required: false
      },
      {
        fieldName: 'travel_info.arrival_date',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtArrivalDate',
        type: 'date',
        required: true
      },
      {
        fieldName: 'travel_info.departure_date',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtDepartureDate',
        type: 'date',
        required: true
      },
      {
        fieldName: 'travel_info.length_of_stay_value',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtLengthOfStay',
        type: 'text',
        required: true
      },
      {
        fieldName: 'travel_info.length_of_stay_unit',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlLengthOfStayUnit',
        type: 'select',
        required: true
      },
      {
        fieldName: 'travel_info.us_stay_address_line1',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtUSStayAddressLine1',
        type: 'text',
        required: true
      },
      {
        fieldName: 'travel_info.us_stay_city',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtUSStayCity',
        type: 'text',
        required: true
      },
      {
        fieldName: 'travel_info.us_stay_state',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlUSStayState',
        type: 'select',
        required: true
      },
      {
        fieldName: 'travel_info.us_stay_zip',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtUSStayZip',
        type: 'text',
        required: true
      },
      {
        fieldName: 'travel_info.trip_payer',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlTripPayer',
        type: 'select',
        required: true
      }
    ]
  }
];

/**
 * Helper function to get field mapping by field name
 */
export function getFieldMapping(fieldName: string): FormFieldMapping | undefined {
  for (const section of DS160_FORM_MAPPINGS) {
    const field = section.fields.find(f => f.fieldName === fieldName);
    if (field) return field;
  }
  return undefined;
}

/**
 * Helper function to get all field mappings
 */
export function getAllFieldMappings(): FormFieldMapping[] {
  return DS160_FORM_MAPPINGS.flatMap(section => section.fields);
}

/**
 * Helper function to validate form data against mappings
 */
export function validateFormData(formData: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const section of DS160_FORM_MAPPINGS) {
    for (const field of section.fields) {
      if (field.required && !formData[field.fieldName]) {
        errors.push(`Required field missing: ${field.fieldName}`);
      }
      
      if (formData[field.fieldName] && field.validation) {
        if (!field.validation(formData[field.fieldName])) {
          errors.push(`Validation failed for field: ${field.fieldName}`);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

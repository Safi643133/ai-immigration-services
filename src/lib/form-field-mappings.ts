/**
 * DS-160 Form Field Mappings
 * 
 * This file contains the mapping between our form data structure
 * and the actual DS-160 form field names and selectors.
 */

export interface ConditionalField {
  fieldName: string;
  selector: string;
  type: 'text' | 'select' | 'radio' | 'checkbox' | 'date' | 'date_split' | 'textarea';
  required?: boolean;
  valueMapping?: Record<string, string>;
  conditional?: ConditionalLogic;
  conditionalNo?: ConditionalLogicNo;
}

export interface DateSelectors {
  day: string;
  month: string;
  year: string;
}

export interface ConditionalLogic {
  value?: string;
  showFields?: ConditionalField[];
  checkbox?: {
    fieldName: string;
    selector: string;
  };
}

export interface ConditionalLogicNo {
  value?: string;
  showFields?: ConditionalField[];
  checkbox?: {
    fieldName: string;
    selector: string;
  };
}

export interface FormFieldMapping {
  fieldName: string;
  selector: string;
  type: 'text' | 'select' | 'radio' | 'checkbox' | 'date' | 'date_split' | 'textarea';
  required?: boolean;
  validation?: (value: any) => boolean;
  conditional?: ConditionalLogic;
  conditionalNo?: ConditionalLogicNo;
  valueMapping?: Record<string, string>;
  dateSelectors?: DateSelectors;
}

export interface FormSection {
  sectionName: string;
  fields: FormFieldMapping[];
}

export const DS160_FORM_MAPPINGS: FormSection[] = [
  {
    sectionName: 'Personal Information - Step 1',
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
      }
    ]
  },
  {
    sectionName: 'Personal Information - Step 2',
    fields: [
      {
        fieldName: 'personal_info.nationality',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_NATL',
        type: 'select',
        required: true,
        valueMapping: {
          'AFGHANISTAN': 'AFGH',
          'ALBANIA': 'ALB',
          'ALGERIA': 'ALGR',
          'ANDORRA': 'ANDO',
          'ANGOLA': 'ANGL',
          'ANTIGUA AND BARBUDA': 'ANTI',
          'ARGENTINA': 'ARG',
          'ARMENIA': 'ARM',
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
          'BOSNIA AND HERZEGOVINA': 'BIH',
          'BOTSWANA': 'BOT',
          'BRAZIL': 'BRZL',
          'BRUNEI': 'BRNI',
          'BULGARIA': 'BULG',
          'BURKINA FASO': 'BURK',
          'BURMA': 'BURM',
          'BURUNDI': 'BRND',
          'CAMBODIA': 'CBDA',
          'CAMEROON': 'CMRN',
          'CANADA': 'CAN',
          'CAPE VERDE': 'CAVI',
          'CAYMAN ISLANDS': 'CAYI',
          'CENTRAL AFRICAN REPUBLIC': 'CAFR',
          'CHAD': 'CHAD',
          'CHILE': 'CHIL',
          'CHINA': 'CHIN',
          'COLOMBIA': 'COL',
          'COMOROS': 'COMO',
          'CONGO, DEMOCRATIC REPUBLIC OF THE': 'COD',
          'CONGO, REPUBLIC OF THE': 'CONB',
          'COSTA RICA': 'CSTR',
          'COTE D\'IVOIRE': 'IVCO',
          'CROATIA': 'HRV',
          'CUBA': 'CUBA',
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
          'FIJI': 'FIJI',
          'FINLAND': 'FIN',
          'FRANCE': 'FRAN',
          'GABON': 'GABN',
          'GAMBIA, THE': 'GAM',
          'GEORGIA': 'GEO',
          'GERMANY': 'GER',
          'GHANA': 'GHAN',
          'GIBRALTAR': 'GIB',
          'GREECE': 'GRC',
          'GRENADA': 'GREN',
          'GUATEMALA': 'GUAT',
          'GUINEA': 'GNEA',
          'GUINEA-BISSAU': 'GUIB',
          'GUYANA': 'GUY',
          'HAITI': 'HAT',
          'HOLY SEE (VATICAN CITY)': 'VAT',
          'HONDURAS': 'HOND',
          'HONG KONG BNO': 'HOKO',
          'HONG KONG SAR': 'HNK',
          'HUNGARY': 'HUNG',
          'ICELAND': 'ICLD',
          'INDIA': 'IND',
          'INDONESIA': 'IDSA',
          'IRAN': 'IRAN',
          'IRAQ': 'IRAQ',
          'IRELAND': 'IRE',
          'ISRAEL': 'ISRL',
          'ITALY': 'ITLY',
          'JAMAICA': 'JAM',
          'JAPAN': 'JPN',
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
          'MALDIVES': 'MLDV',
          'MALI': 'MALI',
          'MALTA': 'MLTA',
          'MARSHALL ISLANDS': 'RMI',
          'MAURITANIA': 'MAUR',
          'MAURITIUS': 'MRTS',
          'MEXICO': 'MEX',
          'MICRONESIA': 'FSM',
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
          'NEW ZEALAND': 'NZLD',
          'NICARAGUA': 'NIC',
          'NIGER': 'NIR',
          'NIGERIA': 'NRA',
          'NORWAY': 'NORW',
          'OMAN': 'OMAN',
          'PAKISTAN': 'PKST',
          'PALAU': 'PALA',
          'PALESTINIAN AUTHORITY': 'PAL',
          'PANAMA': 'PAN',
          'PAPUA NEW GUINEA': 'PNG',
          'PARAGUAY': 'PARA',
          'PERU': 'PERU',
          'PHILIPPINES': 'PHIL',
          'PITCAIRN ISLANDS': 'PITC',
          'POLAND': 'POL',
          'PORTUGAL': 'PORT',
          'QATAR': 'QTAR',
          'ROMANIA': 'ROM',
          'RUSSIA': 'RUS',
          'RWANDA': 'RWND',
          'SAMOA': 'WSAM',
          'SAN MARINO': 'SMAR',
          'SAO TOME AND PRINCIPE': 'STPR',
          'SAUDI ARABIA': 'SARB',
          'SENEGAL': 'SENG',
          'SERBIA': 'SBA',
          'SEYCHELLES': 'SEYC',
          'SIERRA LEONE': 'SLEO',
          'SINGAPORE': 'SING',
          'SLOVAKIA': 'SVK',
          'SLOVENIA': 'SVN',
          'SOLOMON ISLANDS': 'SLMN',
          'SOMALIA': 'SOMA',
          'SOUTH AFRICA': 'SAFR',
          'SOUTH SUDAN': 'SSDN',
          'SPAIN': 'SPN',
          'SRI LANKA': 'SRL',
          'ST. HELENA': 'SHEL',
          'ST. KITTS AND NEVIS': 'STCN',
          'ST. LUCIA': 'SLCA',
          'ST. VINCENT AND THE GRENADINES': 'STVN',
          'STATELESS': 'XXX',
          'SUDAN': 'SUDA',
          'SURINAME': 'SURM',
          'SWEDEN': 'SWDN',
          'SWITZERLAND': 'SWTZ',
          'SYRIA': 'SYR',
          'TAIWAN': 'TWAN',
          'TAJIKISTAN': 'TJK',
          'TANZANIA': 'TAZN',
          'THAILAND': 'THAI',
          'TIMOR-LESTE': 'TMOR',
          'TOGO': 'TOGO',
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
          'URUGUAY': 'URU',
          'UZBEKISTAN': 'UZB',
          'VANUATU': 'VANU',
          'VENEZUELA': 'VENZ',
          'VIETNAM': 'VTNM',
          'VIRGIN ISLANDS, BRITISH': 'BRVI',
          'WALLIS AND FUTUNA ISLANDS': 'WAFT',
          'WESTERN SAHARA': 'SSAH',
          'YEMEN': 'YEM',
          'ZAMBIA': 'ZAMB',
          'ZIMBABWE': 'ZIMB'
        }
      },
      {
        fieldName: 'personal_info.other_nationalities',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_rblAPP_OTH_NATL_IND',
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
              fieldName: 'personal_info.other_nationalities_list.0.country',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl00_ddlOTHER_NATL',
              type: 'select',
              required: false
            },
            {
              fieldName: 'personal_info.other_nationalities_list.0.has_passport',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl00_rblOTHER_PPT_IND',
              type: 'radio',
              required: false,
              valueMapping: {
                'Yes': 'Y',
                'No': 'N'
              },
              conditional: {
                value: 'Y',
                showFields: [
                  {
                    fieldName: 'personal_info.other_nationalities_list.0.passport_number',
                    selector: '#ctl00_SiteContentPlaceHolder_FormView1_dtlOTHER_NATL_ctl00_tbxOTHER_PPT_NUM',
                    type: 'text',
                    required: false
                  }
                ]
              }
            }
          ]
        }
      },
      {
        fieldName: 'personal_info.permanent_resident_other_country',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_rblPermResOtherCntryInd',
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
              fieldName: 'personal_info.permanent_resident_country',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_dtlOthPermResCntry_ctl00_ddlOthPermResCntry',
              type: 'select',
              required: false
            }
          ]
        }
      },
      {
        fieldName: 'personal_info.national_identification_number',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_NATIONAL_ID',
        type: 'text',
        required: false,
        conditional: {
          checkbox: {
            fieldName: 'personal_info.national_identification_number_na',
            selector: '#ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_NATIONAL_ID_NA'
          }
        }
      },
      {
        fieldName: 'personal_info.us_social_security_number',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SSN1',
        type: 'text',
        required: false,
        conditional: {
          checkbox: {
            fieldName: 'personal_info.us_ssn_na',
            selector: '#ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_SSN_NA'
          }
        }
      },
      {
        fieldName: 'personal_info.us_taxpayer_id_number',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_TAX_ID',
        type: 'text',
        required: false,
        conditional: {
          checkbox: {
            fieldName: 'personal_info.us_itin_na',
            selector: '#ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_TAX_ID_NA'
          }
        }
      }
    ]
  },
  {
    sectionName: 'Travel Information - Step 3',
    fields: [
      {
        fieldName: 'travel_info.purpose_of_trip',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_dlPrincipalAppTravel_ctl00_ddlPurposeOfTrip',
        type: 'select',
        required: true,
        valueMapping: {
          'FOREIGN GOVERNMENT OFFICIAL (A)': 'A',
          'TEMP. BUSINESS OR PLEASURE VISITOR (B)': 'B',
          'ALIEN IN TRANSIT (C)': 'C',
          'CNMI WORKER OR INVESTOR (CW/E2C)': 'CNMI',
          'CREWMEMBER (D)': 'D',
          'TREATY TRADER OR INVESTOR (E)': 'E',
          'ACADEMIC OR LANGUAGE STUDENT (F)': 'F',
          'INTERNATIONAL ORGANIZATION REP./EMP. (G)': 'G',
          'TEMPORARY WORKER (H)': 'H',
          'FOREIGN MEDIA REPRESENTATIVE (I)': 'I',
          'EXCHANGE VISITOR (J)': 'J',
          'FIANCÉ(E) OR SPOUSE OF A U.S. CITIZEN (K)': 'K',
          'INTRACOMPANY TRANSFEREE (L)': 'L',
          'VOCATIONAL/NONACADEMIC STUDENT (M)': 'M',
          'OTHER (N)': 'N',
          'NATO STAFF (NATO)': 'NATO',
          'ALIEN WITH EXTRAORDINARY ABILITY (O)': 'O',
          'INTERNATIONALLY RECOGNIZED ALIEN (P)': 'P',
          'CULTURAL EXCHANGE VISITOR (Q)': 'Q',
          'RELIGIOUS WORKER (R)': 'R',
          'INFORMANT OR WITNESS (S)': 'S',
          'VICTIM OF TRAFFICKING (T)': 'T',
          'NAFTA PROFESSIONAL (TD/TN)': 'TD/TN',
          'VICTIM OF CRIMINAL ACTIVITY (U)': 'U',
          'PAROLE BENEFICIARY (PARCIS)': 'PAROLE-BEN'
        },
        conditional: {
          value: 'G',
          showFields: [
            {
              fieldName: 'travel_info.purpose_specify',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_dlPrincipalAppTravel_ctl00_ddlOtherPurpose',
              type: 'select',
              required: false,
              valueMapping: {
                'CHILD OF A G1 (G1)': 'G1-CH',
                'PRINCIPAL REPRESENTATIVE (G1)': 'G1-G1',
                'SPOUSE OF A G1 (G1)': 'G1-SP',
                'STAFF OF PRINCIPAL REPRESENTATIVE (G1)': 'G1-ST',
                'CHILD OF A G2 (G2)': 'G2-CH',
                'REPRESENTATIVE (G2)': 'G2-RP',
                'SPOUSE OF A G2 (G2)': 'G2-SP',
                'CHILD OF A G3 (G3)': 'G3-CH',
                'NON-RECOGNIZED/-MEMBER COUNTRY REP(G3)': 'G3-RP',
                'SPOUSE OF A G3 (G3)': 'G3-SP',
                'CHILD OF AN G4 (G4)': 'G4-CH',
                'INTERNATIONAL ORG. EMPLOYEE (G4)': 'G4-G4',
                'SPOUSE OF A G4 (G4)': 'G4-SP',
                'CHILD OF A G5 (G5)': 'G5-CH',
                'PERSONAL EMP. OF A G1, 2, 3, OR 4 (G5)': 'G5-EM',
                'SPOUSE OF A G5 (G5)': 'G5-SP'
              }
            }
          ]
        }
      },
      {
        fieldName: 'travel_info.specific_travel_plans',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_rblSpecificTravel',
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
              fieldName: 'travel_info.arrival_date_day',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlARRIVAL_US_DTEDay',
              type: 'date_split',
              required: false
            },
            {
              fieldName: 'travel_info.arrival_date_month',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlARRIVAL_US_DTEMonth',
              type: 'date_split',
              required: false
            },
            {
              fieldName: 'travel_info.arrival_date_year',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxARRIVAL_US_DTEYear',
              type: 'date_split',
              required: false
            },
            {
              fieldName: 'travel_info.arrival_flight',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxArriveFlight',
              type: 'text',
              required: false
            },
            {
              fieldName: 'travel_info.arrival_city',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxArriveCity',
              type: 'text',
              required: false
            },
            {
              fieldName: 'travel_info.departure_date_day',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlDEPARTURE_US_DTEDay',
              type: 'date_split',
              required: false
            },
            {
              fieldName: 'travel_info.departure_date_month',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlDEPARTURE_US_DTEMonth',
              type: 'date_split',
              required: false
            },
            {
              fieldName: 'travel_info.departure_date_year',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxDEPARTURE_US_DTEYear',
              type: 'date_split',
              required: false
            },
            {
              fieldName: 'travel_info.departure_flight',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxDepartFlight',
              type: 'text',
              required: false
            },
            {
              fieldName: 'travel_info.departure_city',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxDepartCity',
              type: 'text',
              required: false
            },
            {
              fieldName: 'travel_info.location',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_dtlTravelLoc_ctl00_tbxSPECTRAVEL_LOCATION',
              type: 'text',
              required: false
            }
          ]
        },
        conditionalNo: {
          value: 'N',
          showFields: [
            {
              fieldName: 'travel_info.intended_arrival_date_day',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlTRAVEL_DTEDay',
              type: 'date_split',
              required: false
            },
            {
              fieldName: 'travel_info.intended_arrival_date_month',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlTRAVEL_DTEMonth',
              type: 'date_split',
              required: false
            },
            {
              fieldName: 'travel_info.intended_arrival_date_year',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxTRAVEL_DTEYear',
              type: 'date_split',
              required: false
            },
            {
              fieldName: 'travel_info.length_of_stay_value',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxTRAVEL_LOS',
              type: 'text',
              required: false
            },
            {
              fieldName: 'travel_info.length_of_stay_unit',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlTRAVEL_LOS_CD',
              type: 'select',
              required: false,
              valueMapping: {
                'Day(s)': 'D',
                'Week(s)': 'W',
                'Month(s)': 'M',
                'Year(s)': 'Y'
              }
            }
          ]
        }
      },
      // Specific travel plans fields are handled in conditional fields section
      // arrival_date, arrival_date_day, arrival_date_month, arrival_date_year
      // arrival_flight, arrival_city, departure_date, departure_date_day, departure_date_month, departure_date_year
      // departure_flight, departure_city, location
      {
        fieldName: 'travel_info.length_of_stay_value',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_txtLengthOfStay',
        type: 'text',
        required: false
      },
      {
        fieldName: 'travel_info.length_of_stay_unit',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlLengthOfStayUnit',
        type: 'select',
        required: false,
        valueMapping: {
          'Day(s)': 'DAYS',
          'Week(s)': 'WEEKS',
          'Month(s)': 'MONTHS',
          'Year(s)': 'YEARS'
        }
      },
      {
        fieldName: 'travel_info.us_stay_address_line1',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxStreetAddress1',
        type: 'text',
        required: false
      },
      {
        fieldName: 'travel_info.us_stay_address_line2',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxStreetAddress2',
        type: 'text',
        required: false
      },
      {
        fieldName: 'travel_info.us_stay_city',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxCity',
        type: 'text',
        required: false
      },
      {
        fieldName: 'travel_info.us_stay_state',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlTravelState',
        type: 'select',
        required: false
      },
      {
        fieldName: 'travel_info.us_stay_zip',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbZIPCode',
        type: 'text',
        required: false
      },
      {
        fieldName: 'travel_info.trip_payer',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlWhoIsPaying',
        type: 'select',
        required: false,
        valueMapping: {
          'Self': 'S',
          'Other Person': 'O',
          'Present Employer': 'P',
          'Employer in the U.S': 'U',
          'Other Company/Organization': 'C'
        }
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
      // Specific travel plans fields are handled in conditional fields section
      // arrival_date, arrival_flight, arrival_city, departure_date, departure_flight, departure_city, location
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
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlWhoIsPaying',
        type: 'select',
        required: true,
        valueMapping: {
          'Self': 'S',
          'Other Person': 'O',
          'Present Employer': 'P',
          'Employer in the U.S': 'U',
          'Other Company/Organization': 'C'
        }
      }
    ]
  },
  {
    sectionName: 'Travel Companions - Step 4',
    fields: [
      {
        fieldName: 'traveling_companions.traveling_with_others',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_rblOtherPersonsTravelingWithYou',
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
              fieldName: 'traveling_companions.traveling_as_group',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_rblGroupTravel',
              type: 'radio',
              required: false,
              valueMapping: {
                'Yes': 'Y',
                'No': 'N'
              },
              conditional: {
                value: 'Y',
                showFields: [
                  {
                    fieldName: 'traveling_companions.group_name',
                    selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxGroupName',
                    type: 'text',
                    required: false
                  }
                ]
              },
              conditionalNo: {
                value: 'N',
                showFields: [
                  {
                    fieldName: 'traveling_companions.companion_surnames',
                    selector: '#ctl00_SiteContentPlaceHolder_FormView1_dlTravelCompanions_ctl00_tbxSurname',
                    type: 'text',
                    required: false
                  },
                  {
                    fieldName: 'traveling_companions.companion_given_names',
                    selector: '#ctl00_SiteContentPlaceHolder_FormView1_dlTravelCompanions_ctl00_tbxGivenName',
                    type: 'text',
                    required: false
                  },
                  {
                    fieldName: 'traveling_companions.companion_relationship',
                    selector: '#ctl00_SiteContentPlaceHolder_FormView1_dlTravelCompanions_ctl00_ddlTCRelationship',
                    type: 'select',
                    required: false,
                    valueMapping: {
                      'PARENT': 'P',
                      'SPOUSE': 'S',
                      'CHILD': 'C',
                      'OTHER RELATIVE': 'R',
                      'FRIEND': 'F',
                      'BUSINESS ASSOCIATE': 'B',
                      'OTHER': 'O'
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    ]
  },
  {
    sectionName: 'Previous U.S. Travel - Step 5',
    fields: [
      {
        fieldName: 'us_history.been_in_us',
        selector: '#ctl00_SiteContentPlaceHolder_FormView1_rblPREV_US_TRAVEL_IND',
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
              fieldName: 'us_history.last_visit_date_day',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl00_ddlPREV_US_VISIT_DTEDay',
              type: 'select',
              required: false
            },
            {
              fieldName: 'us_history.last_visit_date_month',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl00_ddlPREV_US_VISIT_DTEMonth',
              type: 'select',
              required: false
            },
            {
              fieldName: 'us_history.last_visit_date_year',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl00_tbxPREV_US_VISIT_DTEYear',
              type: 'text',
              required: false
            },
            {
              fieldName: 'us_history.last_visit_length_value',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl00_tbxPREV_US_VISIT_LOS',
              type: 'text',
              required: false
            },
            {
              fieldName: 'us_history.last_visit_length_unit',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl00_ddlPREV_US_VISIT_LOS_CD',
              type: 'select',
              required: false,
              valueMapping: {
                'Year(s)': 'Y',
                'Month(s)': 'M',
                'Week(s)': 'W',
                'Day(s)': 'D',
                'Less than 24 hours': 'H'
              }
            },
            {
              fieldName: 'us_history.us_driver_license',
              selector: '#ctl00_SiteContentPlaceHolder_FormView1_rblPREV_US_DRIVER_LIC_IND',
              type: 'radio',
              required: false,
              valueMapping: {
                'Yes': 'Y',
                'No': 'N'
              },
              conditional: {
                value: 'Y',
                showFields: [
                  {
                    fieldName: 'us_history.driver_license_number',
                    selector: '#ctl00_SiteContentPlaceHolder_FormView1_dtlUS_DRIVER_LICENSE_ctl00_tbxUS_DRIVER_LICENSE',
                    type: 'text',
                    required: false
                  },
                  {
                    fieldName: 'us_history.driver_license_unknown',
                    selector: '#ctl00_SiteContentPlaceHolder_FormView1_dtlUS_DRIVER_LICENSE_ctl00_cbxUS_DRIVER_LICENSE_NA',
                    type: 'checkbox',
                    required: false
                  },
                  {
                    fieldName: 'us_history.driver_license_state',
                    selector: '#ctl00_SiteContentPlaceHolder_FormView1_dtlUS_DRIVER_LICENSE_ctl00_ddlUS_DRIVER_LICENSE_STATE',
                    type: 'select',
                    required: false
                  }
                ]
              }
                         }
           ]
         }
       },
       {
         fieldName: 'us_history.us_visa_issued',
         selector: '#ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_IND',
         type: 'radio',
         required: false,
         valueMapping: {
           'Yes': 'Y',
           'No': 'N'
         },
         conditional: {
           value: 'Y',
           showFields: [
             {
               fieldName: 'us_history.last_visa_issued_date_day',
               selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlPREV_VISA_ISSUED_DTEDay',
               type: 'select',
               required: false
             },
             {
               fieldName: 'us_history.last_visa_issued_date_month',
               selector: '#ctl00_SiteContentPlaceHolder_FormView1_ddlPREV_VISA_ISSUED_DTEMonth',
               type: 'select',
               required: false
             },
             {
               fieldName: 'us_history.last_visa_issued_date_year',
               selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_ISSUED_DTEYear',
               type: 'text',
               required: false
             },
             {
               fieldName: 'us_history.visa_number',
               selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_FOIL_NUMBER',
               type: 'text',
               required: false
             },
             {
               fieldName: 'us_history.visa_number_unknown',
               selector: '#ctl00_SiteContentPlaceHolder_FormView1_cbxPREV_VISA_FOIL_NUMBER_NA',
               type: 'checkbox',
               required: false
             },
             {
               fieldName: 'us_history.same_visa_type',
               selector: '#ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_SAME_TYPE_IND',
               type: 'radio',
               required: false,
               valueMapping: {
                 'Yes': 'Y',
                 'No': 'N'
               }
             },
             {
               fieldName: 'us_history.same_country',
               selector: '#ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_SAME_CNTRY_IND',
               type: 'radio',
               required: false,
               valueMapping: {
                 'Yes': 'Y',
                 'No': 'N'
               }
             },
             {
               fieldName: 'us_history.ten_printed',
               selector: '#ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_TEN_PRINT_IND',
               type: 'radio',
               required: false,
               valueMapping: {
                 'Yes': 'Y',
                 'No': 'N'
               }
             },
             {
               fieldName: 'us_history.visa_lost_stolen',
               selector: '#ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_LOST_IND',
               type: 'radio',
               required: false,
               valueMapping: {
                 'Yes': 'Y',
                 'No': 'N'
               },
               conditional: {
                 value: 'Y',
                 showFields: [
                   {
                     fieldName: 'us_history.visa_lost_year',
                     selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_LOST_YEAR',
                     type: 'text',
                     required: false
                   },
                   {
                     fieldName: 'us_history.visa_lost_explanation',
                     selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_LOST_EXPL',
                     type: 'textarea',
                     required: false
                   }
                 ]
               }
             },
             {
               fieldName: 'us_history.visa_cancelled_revoked',
               selector: '#ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_CANCELLED_IND',
               type: 'radio',
               required: false,
               valueMapping: {
                 'Yes': 'Y',
                 'No': 'N'
               },
               conditional: {
                 value: 'Y',
                 showFields: [
                   {
                     fieldName: 'us_history.visa_cancelled_explanation',
                     selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_CANCELLED_EXPL',
                     type: 'textarea',
                     required: false
                   }
                 ]
               }
             }
           ]
         }
       },
       {
         fieldName: 'us_history.visa_refused',
         selector: '#ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_REFUSED_IND',
         type: 'radio',
         required: false,
         valueMapping: {
           'Yes': 'Y',
           'No': 'N'
         },
         conditional: {
           value: 'Y',
           showFields: [
             {
               fieldName: 'us_history.visa_refused_explanation',
               selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_REFUSED_EXPL',
               type: 'textarea',
               required: false
             }
           ]
         }
       },
       {
         fieldName: 'us_history.immigrant_petition',
         selector: '#ctl00_SiteContentPlaceHolder_FormView1_rblIV_PETITION_IND',
         type: 'radio',
         required: false,
         valueMapping: {
           'Yes': 'Y',
           'No': 'N'
         },
         conditional: {
           value: 'Y',
           showFields: [
             {
               fieldName: 'us_history.immigrant_petition_explanation',
               selector: '#ctl00_SiteContentPlaceHolder_FormView1_tbxIV_PETITION_EXPL',
               type: 'textarea',
               required: false
             }
           ]
         }
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
 * Helper function to get only Step 1 field mappings
 */
export function getStep1FieldMappings(): FormFieldMapping[] {
  const step1Section = DS160_FORM_MAPPINGS.find(section => 
    section.sectionName === 'Personal Information - Step 1'
  );
  return step1Section ? step1Section.fields : [];
}

/**
 * Helper function to get only Step 2 field mappings
 */
export function getStep2FieldMappings(): FormFieldMapping[] {
  const step2Section = DS160_FORM_MAPPINGS.find(section => 
    section.sectionName === 'Personal Information - Step 2'
  );
  return step2Section ? step2Section.fields : [];
}

/**
 * Helper function to get only Step 3 field mappings
 */
export function getStep3FieldMappings(): FormFieldMapping[] {
  const step3Section = DS160_FORM_MAPPINGS.find(section => 
    section.sectionName === 'Travel Information - Step 3'
  );
  return step3Section ? step3Section.fields : [];
}

/**
 * Helper function to get only Step 4 field mappings
 */
export function getStep4FieldMappings(): FormFieldMapping[] {
  const step4Section = DS160_FORM_MAPPINGS.find(section => 
    section.sectionName === 'Travel Companions - Step 4'
  );
  return step4Section ? step4Section.fields : [];
}

/**
 * Helper function to get only Step 5 field mappings
 */
export function getStep5FieldMappings(): FormFieldMapping[] {
  const step5Section = DS160_FORM_MAPPINGS.find(section => 
    section.sectionName === 'Previous U.S. Travel - Step 5'
  );
  return step5Section ? step5Section.fields : [];
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

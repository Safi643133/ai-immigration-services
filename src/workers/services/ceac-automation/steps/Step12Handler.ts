import { Page } from 'playwright'
import { BaseStepHandler } from './BaseStepHandler'
import { DS160FormData } from '@/lib/types/ceac'
import { getStep12FieldMappings } from '@/lib/form-field-mappings'

export class Step12Handler extends BaseStepHandler {
  constructor() {
    super(12, 'Additional Work/Education/Training Information', 'Filling additional work/education/training information')
  }

  protected getFieldMappings() {
    return getStep12FieldMappings()
  }

  protected validateStepData(formData: DS160FormData): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required fields
    if (!formData['additional_occupation.belong_clan_tribe']?.trim()) {
      errors.push('Belong to clan/tribe question is required')
    }
    if (!formData['additional_occupation.traveled_last_five_years']?.trim()) {
      errors.push('Traveled in last five years question is required')
    }
    if (!formData['additional_occupation.belonged_professional_org']?.trim()) {
      errors.push('Belonged to professional organization question is required')
    }
    if (!formData['additional_occupation.specialized_skills_training']?.trim()) {
      errors.push('Specialized skills training question is required')
    }
    if (!formData['additional_occupation.served_military']?.trim()) {
      errors.push('Served in military question is required')
    }
    if (!formData['additional_occupation.involved_paramilitary']?.trim()) {
      errors.push('Involved in paramilitary question is required')
    }

    // Conditional validation for clan/tribe
    const belongClan = formData['additional_occupation.belong_clan_tribe']
    if (belongClan === 'Yes') {
      if (!formData['additional_occupation.clan_tribe_name']?.trim()) {
        errors.push('Clan/tribe name is required when belong to clan/tribe is Yes')
      }
    }

    // Conditional validation for travel history
    const traveled = formData['additional_occupation.traveled_last_five_years']
    if (traveled === 'Yes') {
      if (!formData['additional_occupation.traveled_country_region']?.trim()) {
        errors.push('Traveled country/region is required when traveled in last five years is Yes')
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Override the handleStep method to use custom Step 12 logic
   */
  async handleStep(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Starting Step 12 form filling...')
    
    try {
      // Update job progress
      await this.progressService.updateStepProgress(jobId, 'form_step_12', 'running', 'Filling Step 12 - Additional Work/Education/Training Information...', 80)
      
      // Get Step 12 field mappings
      const step12Mappings = getStep12FieldMappings()
      console.log(`📝 Found ${step12Mappings.length} Step 12 fields to fill`)
      
      // Fill each field based on mapping
      for (const fieldMapping of step12Mappings) {
        try {
          const fieldValue = formData[fieldMapping.fieldName]
          
          if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
            console.log(`⏭️ Skipping empty field: ${fieldMapping.fieldName}`)
            continue
          }
          
          console.log(`📝 Filling field: ${fieldMapping.fieldName} = ${fieldValue}`)
          
          const element = page.locator(fieldMapping.selector)
          await element.waitFor({ state: 'visible', timeout: 15000 })
          
          switch (fieldMapping.type) {
            case 'radio':
              if (fieldValue === 'Yes' || fieldValue === 'Y') {
                await element.check()
                console.log(`✅ Selected radio button: ${fieldMapping.fieldName}`)
                
                // Wait for conditional sections to appear after radio selection
                console.log('⏳ Waiting for conditional sections to appear...')
                await page.waitForTimeout(2000)
              } else {
                // For "No" selection, find the corresponding "No" radio button
                const noSelector = fieldMapping.selector.replace('_0', '_1')
                const noElement = page.locator(noSelector)
                await noElement.waitFor({ state: 'visible', timeout: 15000 })
                await noElement.check()
                console.log(`✅ Selected "No" radio button: ${fieldMapping.fieldName}`)
                
                // Wait for conditional sections to appear after radio selection
                console.log('⏳ Waiting for conditional sections to appear...')
                await page.waitForTimeout(2000)
              }
              break
              
            case 'text':
              await element.fill(fieldValue.toString())
              console.log(`✅ Filled text field: ${fieldMapping.fieldName}`)
              break
              
            case 'select':
              // Use value mapping if available, otherwise use the original value
              let selectValue = fieldValue.toString()
              console.log(`🔍 STEP12 - Original value: ${selectValue}`)
              console.log(`🔍 STEP12 - Available mappings:`, fieldMapping.valueMapping ? Object.keys(fieldMapping.valueMapping) : 'None')
              
              if (fieldMapping.valueMapping && fieldMapping.valueMapping[selectValue]) {
                selectValue = fieldMapping.valueMapping[selectValue]
                console.log(`🔍 STEP12 - Mapped to: ${selectValue}`)
              } else if (fieldMapping.valueMapping) {
                // Try case-insensitive matching
                const upperValue = selectValue.toUpperCase()
                if (fieldMapping.valueMapping[upperValue]) {
                  selectValue = fieldMapping.valueMapping[upperValue]
                  console.log(`🔍 STEP12 - Case-insensitive mapped to: ${selectValue}`)
                } else {
                  console.log(`⚠️ STEP12 - No mapping found for: ${selectValue}`)
                }
              }
              
              console.log(`🔍 STEP12 - Final select value: ${selectValue}`)
              console.log(`🔍 Selecting dropdown: ${fieldMapping.fieldName} with value: ${selectValue}`)
              
              try {
                await element.selectOption({ value: selectValue })
                console.log(`✅ Successfully selected by value: ${selectValue}`)
                
                // Wait for postback if the dropdown triggers one
                try {
                  await page.waitForLoadState('networkidle', { timeout: 5000 })
                  console.log(`✅ Postback completed after selection`)
                } catch (timeoutError) {
                  console.log(`ℹ️ No postback detected or timeout - continuing`)
                }
              } catch (error) {
                console.log(`⚠️ Could not select by value, trying by label: ${fieldValue}`)
                await element.selectOption({ label: fieldValue.toString() })
                console.log(`✅ Successfully selected by label: ${fieldValue}`)
              }
              break
              
            default:
              console.warn(`⚠️ Unknown field type: ${fieldMapping.type} for ${fieldMapping.fieldName}`)
          }
          
          // Small delay between fields
          await page.waitForTimeout(200)
          
        } catch (error) {
          console.error(`❌ Error filling field ${fieldMapping.fieldName}:`, error)
          throw error
        }
      }
      
      // Handle conditional fields based on radio selections
      await this.handleStep12ConditionalFields(page, jobId, formData)
      
      console.log('✅ Step 12 form filling completed successfully')
      
      // Click Next button to proceed to Step 13
      await this.clickStep12NextButton(page, jobId)
      
    } catch (error) {
      console.error('❌ Error in Step 12 form filling:', error)
      throw error
    }
  }

  /**
   * Handle conditional fields for Step 12 based on radio selections
   */
  private async handleStep12ConditionalFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Handling Step 12 conditional fields...')
    
    const belongClan = formData['additional_occupation.belong_clan_tribe']
    const traveled = formData['additional_occupation.traveled_last_five_years']
    const belongedOrg = formData['additional_occupation.belonged_professional_org']
    const specializedSkills = formData['additional_occupation.specialized_skills_training']
    const servedMilitary = formData['additional_occupation.served_military']
    const involvedParamilitary = formData['additional_occupation.involved_paramilitary']
    
    console.log(`📝 Clan: ${belongClan}, Traveled: ${traveled}, Org: ${belongedOrg}, Skills: ${specializedSkills}, Military: ${servedMilitary}, Paramilitary: ${involvedParamilitary}`)
    
    // Handle clan/tribe conditional fields
    if (belongClan === 'Yes' || belongClan === 'Y') {
      console.log('📝 Handling clan/tribe conditional fields...')
      await this.fillClanTribeConditionalFields(page, jobId, formData)
    }
    
    // Handle travel history conditional fields
    if (traveled === 'Yes' || traveled === 'Y') {
      console.log('📝 Handling travel history conditional fields...')
      await this.fillTravelHistoryConditionalFields(page, jobId, formData)
    }
    
    // Handle professional organizations conditional fields
    if (belongedOrg === 'Yes' || belongedOrg === 'Y') {
      console.log('📝 Handling professional organizations conditional fields...')
      // Wait for conditional field to appear after radio selection
      await page.waitForTimeout(2000)
      await this.fillProfessionalOrganizationsConditionalFields(page, jobId, formData)
    }
    
    // Handle specialized skills conditional fields
    if (specializedSkills === 'Yes' || specializedSkills === 'Y') {
      console.log('📝 Handling specialized skills conditional fields...')
      // Wait for conditional field to appear after radio selection
      await page.waitForTimeout(2000)
      await this.fillSpecializedSkillsConditionalFields(page, jobId, formData)
    }
    
    // Handle military service conditional fields
    if (servedMilitary === 'Yes' || servedMilitary === 'Y') {
      console.log('📝 Handling military service conditional fields...')
      // Wait for conditional field to appear after radio selection
      await page.waitForTimeout(2000)
      await this.fillMilitaryServiceConditionalFields(page, jobId, formData)
    }
    
    // Handle paramilitary involvement conditional fields
    if (involvedParamilitary === 'Yes' || involvedParamilitary === 'Y') {
      console.log('📝 Handling paramilitary involvement conditional fields...')
      // Wait for conditional field to appear after radio selection
      await page.waitForTimeout(2000)
      await this.fillParamilitaryInvolvementConditionalFields(page, jobId, formData)
    }
    
    console.log('✅ Step 12 conditional fields handling completed')
  }

  /**
   * Fill clan/tribe conditional fields
   */
  private async fillClanTribeConditionalFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling clan/tribe conditional fields...')
    
    const clanName = formData['additional_occupation.clan_tribe_name']
    if (clanName) {
      console.log(`📝 Filling clan/tribe name: ${clanName}`)
      const nameElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxCLAN_TRIBE_NAME')
      await nameElement.waitFor({ state: 'visible', timeout: 15000 })
      await nameElement.fill(clanName.toString())
      console.log('✅ Filled clan/tribe name')
    }
  }

  /**
   * Fill travel history conditional fields
   */
  private async fillTravelHistoryConditionalFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling travel history conditional fields...')
    
    const country = formData['additional_occupation.traveled_country_region']
    if (country) {
      console.log(`📝 Filling traveled country/region: ${country}`)
      const countryElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlCountriesVisited_ctl00_ddlCOUNTRIES_VISITED')
      await countryElement.waitFor({ state: 'visible', timeout: 15000 })
      
      // Map country names to CEAC codes (comprehensive list from the dropdown)
      const countryCodeMap: { [key: string]: string } = {
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
        'BONAIRE': 'BON',
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
        'FRENCH GUIANA': 'FRGN',
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
        'GUADELOUPE': 'GUAD',
        'GUAM': 'GUAM',
        'GUATEMALA': 'GUAT',
        'GUINEA': 'GNEA',
        'GUINEA - BISSAU': 'GUIB',
        'GUYANA': 'GUY',
        'HAITI': 'HAT',
        'HEARD AND MCDONALD ISLANDS': 'HMD',
        'HOLY SEE (VATICAN CITY)': 'VAT',
        'HONDURAS': 'HOND',
        'HONG KONG': 'HNK',
        'HOWLAND ISLAND': 'XHI',
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
        'MARTINIQUE': 'MART',
        'MAURITANIA': 'MAUR',
        'MAURITIUS': 'MRTS',
        'MAYOTTE': 'MYT',
        'MEXICO': 'MEX',
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
        'REUNION': 'REUN',
        'ROMANIA': 'ROM',
        'RUSSIA': 'RUS',
        'RWANDA': 'RWND',
        'SABA ISLAND': 'SABA',
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
        'ST. EUSTATIUS': 'STEU',
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
      
      // Try to find the country code
      let countryCode = countryCodeMap[country.toUpperCase()]
      if (!countryCode) {
        // If not found in our mapping, try to select by label
        console.log(`⚠️ Country code not found for: ${country}, trying to select by label`)
        try {
          await countryElement.selectOption({ label: country })
          console.log(`✅ Selected country by label: ${country}`)
        } catch (error) {
          console.log(`❌ Could not select country by label: ${country}`)
          throw error
        }
      } else {
        // Select by value using the country code
        console.log(`📝 Selecting country with code: ${countryCode}`)
        try {
          await countryElement.selectOption({ value: countryCode })
          console.log(`✅ Selected country with code: ${countryCode}`)
        } catch (error) {
          console.log(`⚠️ Could not select by code, trying by label: ${country}`)
          await countryElement.selectOption({ label: country })
          console.log(`✅ Selected country by label: ${country}`)
        }
      }
    }
  }

  /**
   * Fill professional organizations conditional fields
   */
  private async fillProfessionalOrganizationsConditionalFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling professional organizations conditional fields...')
    
    const orgName = formData['additional_occupation.professional_org_name']
    if (orgName) {
      console.log(`📝 Filling professional organization name: ${orgName}`)
      const orgElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlORGANIZATIONS_ctl00_tbxORGANIZATION_NAME')
      await orgElement.waitFor({ state: 'visible', timeout: 15000 })
      await orgElement.fill(orgName.toString())
      console.log('✅ Filled professional organization name')
    }
  }

  /**
   * Fill specialized skills conditional fields
   */
  private async fillSpecializedSkillsConditionalFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling specialized skills conditional fields...')
    
    const skillsExplain = formData['additional_occupation.specialized_skills_explain']
    if (skillsExplain) {
      console.log(`📝 Filling specialized skills explanation: ${skillsExplain}`)
      const skillsElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxSPECIALIZED_SKILLS_EXPL')
      await skillsElement.waitFor({ state: 'visible', timeout: 15000 })
      await skillsElement.fill(skillsExplain.toString())
      console.log('✅ Filled specialized skills explanation')
    }
  }

  /**
   * Fill military service conditional fields
   */
  private async fillMilitaryServiceConditionalFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling military service conditional fields...')
    
    // Fill country/region
    const country = formData['additional_occupation.military_country_region']
    if (country) {
      console.log(`📝 Filling military country/region: ${country}`)
      const countryElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlMILITARY_SERVICE_ctl00_ddlMILITARY_SVC_CNTRY')
      await countryElement.waitFor({ state: 'visible', timeout: 15000 })
      
      // Map country names to CEAC codes (same comprehensive list as travel history)
      const countryCodeMap: { [key: string]: string } = {
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
        'BONAIRE': 'BON',
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
        'FRENCH GUIANA': 'FRGN',
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
        'GUADELOUPE': 'GUAD',
        'GUAM': 'GUAM',
        'GUATEMALA': 'GUAT',
        'GUINEA': 'GNEA',
        'GUINEA - BISSAU': 'GUIB',
        'GUYANA': 'GUY',
        'HAITI': 'HAT',
        'HEARD AND MCDONALD ISLANDS': 'HMD',
        'HOLY SEE (VATICAN CITY)': 'VAT',
        'HONDURAS': 'HOND',
        'HONG KONG': 'HNK',
        'HOWLAND ISLAND': 'XHI',
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
        'MARTINIQUE': 'MART',
        'MAURITANIA': 'MAUR',
        'MAURITIUS': 'MRTS',
        'MAYOTTE': 'MYT',
        'MEXICO': 'MEX',
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
        'REUNION': 'REUN',
        'ROMANIA': 'ROM',
        'RUSSIA': 'RUS',
        'RWANDA': 'RWND',
        'SABA ISLAND': 'SABA',
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
        'ST. EUSTATIUS': 'STEU',
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
      
      // Try to find the country code
      let countryCode = countryCodeMap[country.toUpperCase()]
      if (!countryCode) {
        // If not found in our mapping, try to select by label
        console.log(`⚠️ Country code not found for: ${country}, trying to select by label`)
        try {
          await countryElement.selectOption({ label: country })
          console.log(`✅ Selected military country by label: ${country}`)
        } catch (error) {
          console.log(`❌ Could not select military country by label: ${country}`)
          throw error
        }
      } else {
        // Select by value using the country code
        console.log(`📝 Selecting military country with code: ${countryCode}`)
        try {
          await countryElement.selectOption({ value: countryCode })
          console.log(`✅ Selected military country with code: ${countryCode}`)
        } catch (error) {
          console.log(`⚠️ Could not select by code, trying by label: ${country}`)
          await countryElement.selectOption({ label: country })
          console.log(`✅ Selected military country by label: ${country}`)
        }
      }
    }
    
    // Fill branch of service
    const branch = formData['additional_occupation.military_branch']
    console.log(`🔍 Military branch data: ${branch}`)
    if (branch) {
      console.log(`📝 Filling military branch: ${branch}`)
      const branchElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlMILITARY_SERVICE_ctl00_tbxMILITARY_SVC_BRANCH')
      
      // Wait for element to be visible
      await branchElement.waitFor({ state: 'visible', timeout: 15000 })
      
      // Check if element exists
      const elementCount = await branchElement.count()
      console.log(`🔍 Found ${elementCount} military branch elements`)
      
      // Clear the field first
      await branchElement.clear()
      
      // Fill the field
      await branchElement.fill(branch.toString())
      
      // Trigger change event
      await branchElement.evaluate((el) => {
        el.dispatchEvent(new Event('change', { bubbles: true }))
        el.dispatchEvent(new Event('input', { bubbles: true }))
      })
      
      console.log('✅ Filled military branch')
      
      // Wait a moment for any postback
      await page.waitForTimeout(1000)
    }
    
    // Fill rank/position
    const rank = formData['additional_occupation.military_rank_position']
    console.log(`🔍 Military rank data: ${rank}`)
    if (rank) {
      console.log(`📝 Filling military rank/position: ${rank}`)
      const rankElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlMILITARY_SERVICE_ctl00_tbxMILITARY_SVC_RANK')
      
      // Wait for element to be visible
      await rankElement.waitFor({ state: 'visible', timeout: 15000 })
      
      // Check if element exists
      const elementCount = await rankElement.count()
      console.log(`🔍 Found ${elementCount} military rank elements`)
      
      // Clear the field first
      await rankElement.clear()
      
      // Fill the field
      await rankElement.fill(rank.toString())
      
      // Trigger change event
      await rankElement.evaluate((el) => {
        el.dispatchEvent(new Event('change', { bubbles: true }))
        el.dispatchEvent(new Event('input', { bubbles: true }))
      })
      
      console.log('✅ Filled military rank/position')
      
      // Wait a moment for any postback
      await page.waitForTimeout(1000)
    }
    
    // Fill military specialty
    const specialty = formData['additional_occupation.military_specialty']
    if (specialty) {
      console.log(`📝 Filling military specialty: ${specialty}`)
      const specialtyElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlMILITARY_SERVICE_ctl00_tbxMILITARY_SVC_SPECIALTY')
      await specialtyElement.waitFor({ state: 'visible', timeout: 15000 })
      await specialtyElement.fill(specialty.toString())
      console.log('✅ Filled military specialty')
    }
    
    // Fill service from date
    const serviceFrom = formData['additional_occupation.military_service_from']
    if (serviceFrom) {
      console.log(`📝 Filling military service from date: ${serviceFrom}`)
      const { day, month, year } = this.splitDate(serviceFrom.toString())
      
      const dayElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlMILITARY_SERVICE_ctl00_ddlMILITARY_SVC_FROMDay')
      const monthElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlMILITARY_SERVICE_ctl00_ddlMILITARY_SVC_FROMMonth')
      const yearElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlMILITARY_SERVICE_ctl00_tbxMILITARY_SVC_FROMYear')
      
      await dayElement.waitFor({ state: 'visible', timeout: 15000 })
      await monthElement.waitFor({ state: 'visible', timeout: 15000 })
      await yearElement.waitFor({ state: 'visible', timeout: 15000 })
      
      await dayElement.selectOption({ value: day })
      await monthElement.selectOption({ value: month })
      await yearElement.fill(year)
      
      console.log('✅ Filled military service from date')
    }
    
    // Fill service to date
    const serviceTo = formData['additional_occupation.military_service_to']
    if (serviceTo) {
      console.log(`📝 Filling military service to date: ${serviceTo}`)
      const { day, month, year } = this.splitDate(serviceTo.toString())
      
      const dayElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlMILITARY_SERVICE_ctl00_ddlMILITARY_SVC_TODay')
      const monthElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlMILITARY_SERVICE_ctl00_ddlMILITARY_SVC_TOMonth')
      const yearElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlMILITARY_SERVICE_ctl00_tbxMILITARY_SVC_TOYear')
      
      await dayElement.waitFor({ state: 'visible', timeout: 15000 })
      await monthElement.waitFor({ state: 'visible', timeout: 15000 })
      await yearElement.waitFor({ state: 'visible', timeout: 15000 })
      
      await dayElement.selectOption({ value: day })
      await monthElement.selectOption({ value: month })
      await yearElement.fill(year)
      
      console.log('✅ Filled military service to date')
    }
  }

  /**
   * Split date string into day, month, year components
   */
  private splitDate(dateString: string): { day: string; month: string; year: string } {
    if (!dateString) return { day: '', month: '', year: '' }
    
    try {
      const date = new Date(dateString)
      const day = date.getDate().toString()
      const month = (date.getMonth() + 1).toString() // getMonth() returns 0-11
      const year = date.getFullYear().toString()
      
      return { day, month, year }
    } catch (error) {
      console.warn(`⚠️ Failed to parse date: ${dateString}`)
      return { day: '', month: '', year: '' }
    }
  }

  /**
   * Fill paramilitary involvement conditional fields
   */
  private async fillParamilitaryInvolvementConditionalFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling paramilitary involvement conditional fields...')
    
    const paramilitaryExplain = formData['additional_occupation.involved_paramilitary_explain']
    if (paramilitaryExplain) {
      console.log(`📝 Filling paramilitary involvement explanation: ${paramilitaryExplain}`)
      const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxINSURGENT_ORG_EXPL')
      await explainElement.waitFor({ state: 'visible', timeout: 15000 })
      await explainElement.fill(paramilitaryExplain.toString())
      console.log('✅ Filled paramilitary involvement explanation')
    }
  }

  /**
   * Click Step 12 Next button
   */
  private async clickStep12NextButton(page: Page, jobId: string): Promise<void> {
    console.log('🔄 Clicking Step 12 Next button...')
    
    try {
      // Wait for the Next button to be visible
      const nextButton = page.locator('#ctl00_SiteContentPlaceHolder_UpdateButton3')
      await nextButton.waitFor({ state: 'visible', timeout: 15000 })
      
      console.log('✅ Step 12 Next button is ready')
      
      // Click the Next button
      await nextButton.click()
      console.log('✅ Clicked Step 12 Next button')
      
      // Wait for navigation with better error handling
      try {
        console.log('⏳ Waiting for page to load after Next button click...')
        await page.waitForLoadState('networkidle', { timeout: 45000 })
        console.log('✅ Page loaded successfully')
      } catch (error) {
        console.log('⚠️ Network idle timeout, trying alternative wait strategy...')
        
        // Try waiting for domcontentloaded instead
        try {
          await page.waitForLoadState('domcontentloaded', { timeout: 30000 })
          console.log('✅ DOM content loaded')
          
          // Additional wait for any remaining network activity
          await page.waitForTimeout(5000)
          console.log('✅ Additional wait completed')
        } catch (domError) {
          console.log('⚠️ DOM content loaded also timed out, proceeding anyway...')
          await page.waitForTimeout(3000)
        }
      }
      
      // Check for validation errors after clicking Next
      const hasValidationErrors = await this.checkForValidationErrors(page)
      
      if (hasValidationErrors) {
        console.error('❌ Validation errors detected on Step 12')
        
        // Take screenshot of the error page
        await this.takeErrorScreenshot(page, jobId)
        
        // Update job status to failed
        await this.updateJobStatusToFailed(jobId, 'Validation errors on Step 12')
        
        // Throw error to stop processing
        throw new Error('Form validation failed on Step 12. Check screenshot for details.')
      }
      
      // Update job progress
      await this.progressService.updateStepProgress(jobId, 'form_step_13', 'running', 'Completed Step 12 - Additional Work/Education/Training Information...', 85)
      console.log('📊 Updated job progress to Step 13 (85%)')
      
    } catch (error) {
      console.error('❌ Error clicking Step 12 Next button:', error)
      
      // Take a screenshot for debugging
      await page.screenshot({ path: `error-step12-next-${jobId}.png` })
      console.log('📸 Screenshot saved: error-step12-next.png')
      
      throw error
    }
  }
}

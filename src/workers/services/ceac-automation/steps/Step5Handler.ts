import { Page } from 'playwright';
import { BaseStepHandler } from './BaseStepHandler';
import { getStep5FieldMappings } from '@/lib/form-field-mappings';
import { DS160FormData } from '@/lib/types/ceac';

export class Step5Handler extends BaseStepHandler {
  constructor() {
    super(5, 'Previous U.S. Travel', 'Filling previous U.S. travel information');
  }

  protected getFieldMappings() {
    return getStep5FieldMappings();
  }

  protected validateStepData(formData: DS160FormData): { valid: boolean; errors: string[] } {
    const requiredFields = [
      'us_history.been_in_us',
      'us_history.last_visit_date',
      'us_history.last_visit_length_value',
      'us_history.last_visit_length_unit',
      'us_history.us_driver_license',
      'us_history.driver_license_number',
      'us_history.driver_license_state',
      'us_history.us_visa_issued',
      'us_history.visa_refused',
      'us_history.immigrant_petition'
    ];

    const errors: string[] = [];
    const valid = requiredFields.every(field => {
      if (formData[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
        return false;
      }
      return true;
    });

    return { valid, errors };
  }

  protected async handleStepSpecificLogic(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Starting DS-160 Step 5 form filling...');

    // Handle "Have you ever been in the U.S.?" radio button
    const beenInUS = formData['us_history.been_in_us'];
    if (beenInUS) {
      console.log(`📝 Filling been in US: ${beenInUS}`);
      const radioValue = beenInUS === 'Yes' ? 'Y' : 'N';
      const radioButtonId = `ctl00_SiteContentPlaceHolder_FormView1_rblPREV_US_TRAVEL_IND_${radioValue === 'Y' ? '0' : '1'}`;
      const radioElement = page.locator(`#${radioButtonId}`);
      await radioElement.waitFor({ state: 'visible', timeout: 15000 });
      await radioElement.click();
      console.log(`✅ Selected been in US: ${beenInUS} (${radioValue})`);

      // Wait for postback
      await this.waitForPostback(page, 'been in US selection');
      console.log('✅ Postback completed after been in US selection');

      // Handle conditional fields if Yes
      if (beenInUS === 'Yes') {
        console.log('📝 Been in US is Yes, filling previous visit fields...');
        await this.fillPreviousVisitFields(page, jobId, formData);

        // Handle driver license question
        const hasUSDL = formData['us_history.us_driver_license'];
        if (hasUSDL !== undefined && hasUSDL !== null && hasUSDL !== '') {
          console.log(`📝 Selecting driver license option: ${hasUSDL}`);
          await this.selectDriverLicenseOption(page, jobId, hasUSDL);

          if (hasUSDL === 'Yes') {
            console.log('📝 Has US driver license is Yes, filling driver license fields...');
            await this.fillDriverLicenseFields(page, jobId, formData);
          }
        }
      }
    }

    // Handle "Have you ever been issued a U.S. visa?" radio button (independent)
    const hasUSVisa = formData['us_history.us_visa_issued'];
    if (hasUSVisa) {
      console.log(`📝 Filling US visa issued: ${hasUSVisa}`);
      const radioValue = hasUSVisa === 'Yes' ? 'Y' : 'N';
      const radioButtonId = `ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_IND_${radioValue === 'Y' ? '0' : '1'}`;
      const radioElement = page.locator(`#${radioButtonId}`);
      await radioElement.waitFor({ state: 'visible', timeout: 15000 });
      await radioElement.click();
      console.log(`✅ Selected US visa issued: ${hasUSVisa} (${radioValue})`);

      // Wait for postback
      await this.waitForPostback(page, 'US visa issued selection');
      console.log('✅ Postback completed after US visa issued selection');

      // Handle conditional fields if Yes
      if (hasUSVisa === 'Yes') {
        console.log('📝 Has US visa is Yes, filling visa fields...');
        await this.fillUSVisaFields(page, jobId, formData);
      }
    }

    // Handle "Have you ever been refused a U.S. visa?" radio button (independent)
    const visaRefused = formData['us_history.visa_refused'];
    if (visaRefused) {
      console.log(`📝 Filling visa refused: ${visaRefused}`);
      const radioValue = visaRefused === 'Yes' ? 'Y' : 'N';
      const radioButtonId = `ctl00_SiteContentPlaceHolder_FormView1_rblPREV_VISA_REFUSED_IND_${radioValue === 'Y' ? '0' : '1'}`;
      const radioElement = page.locator(`#${radioButtonId}`);
      await radioElement.waitFor({ state: 'visible', timeout: 15000 });
      await radioElement.click();
      console.log(`✅ Selected visa refused: ${visaRefused} (${radioValue})`);

      // Wait for postback
      await this.waitForPostback(page, 'visa refused selection');
      console.log('✅ Postback completed after visa refused selection');

      // Handle conditional fields if Yes
      if (visaRefused === 'Yes') {
        console.log('📝 Visa refused is Yes, filling refusal explanation...');
        await this.fillVisaRefusalFields(page, jobId, formData);
      }
    }

    // Handle "Has anyone ever filed an immigrant petition on your behalf?" radio button (independent)
    const immigrantPetition = formData['us_history.immigrant_petition'];
    if (immigrantPetition) {
      console.log(`📝 Filling immigrant petition: ${immigrantPetition}`);
      const radioValue = immigrantPetition === 'Yes' ? 'Y' : 'N';
      const radioButtonId = `ctl00_SiteContentPlaceHolder_FormView1_rblIV_PETITION_IND_${radioValue === 'Y' ? '0' : '1'}`;
      const radioElement = page.locator(`#${radioButtonId}`);
      await radioElement.waitFor({ state: 'visible', timeout: 15000 });
      await radioElement.click();
      console.log(`✅ Selected immigrant petition: ${immigrantPetition} (${radioValue})`);

      // Wait for postback
      await this.waitForPostback(page, 'immigrant petition selection');
      console.log('✅ Postback completed after immigrant petition selection');

      // Handle conditional fields if Yes
      if (immigrantPetition === 'Yes') {
        console.log('📝 Immigrant petition is Yes, filling petition explanation...');
        await this.fillImmigrantPetitionFields(page, jobId, formData);
      }
    }

    // Handle "Are you or have you ever been a U.S. legal permanent resident?" radio button (independent)
    const permanentResident = formData['us_history.permanent_resident'];
    if (permanentResident) {
      console.log(`📝 Filling permanent resident: ${permanentResident}`);
      const radioValue = permanentResident === 'Yes' ? 'Y' : 'N';
      const radioButtonId = `ctl00_SiteContentPlaceHolder_FormView1_rblPERM_RESIDENT_IND_${radioValue === 'Y' ? '0' : '1'}`;
      const radioElement = page.locator(`#${radioButtonId}`);
      await radioElement.waitFor({ state: 'visible', timeout: 15000 });
      await radioElement.click();
      console.log(`✅ Selected permanent resident: ${permanentResident} (${radioValue})`);

      // Wait for postback
      await this.waitForPostback(page, 'permanent resident selection');
      console.log('✅ Postback completed after permanent resident selection');

      // Handle conditional fields if Yes
      if (permanentResident === 'Yes') {
        console.log('📝 Permanent resident is Yes, filling explanation...');
        await this.fillPermanentResidentFields(page, jobId, formData);
      }
    }

    console.log('✅ DS-160 Step 5 form filling completed.');
  }

  protected async checkStepSpecificValidationErrors(page: Page): Promise<boolean> {
    // Check for CEAC-specific Step 5 validation messages
    const validationSelectors = [
      '#ctl00_SiteContentPlaceHolder_FormView1_ValidationSummary1',
      '.validation-summary-errors',
      '.field-validation-error'
    ];

    for (const selector of validationSelectors) {
      const errorElement = await page.$(selector);
      if (errorElement) {
        const errorText = await errorElement.textContent();
        if (errorText && errorText.trim().length > 0) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Fill previous visit fields
   */
  private async fillPreviousVisitFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling previous visit fields...');

    // Wait for previous visit fields to appear
    await page.waitForTimeout(3000);

    // Fill date arrived (split into day, month, year)
    const lastVisitDate = formData['us_history.last_visit_date'];
    if (lastVisitDate) {
      console.log(`📝 Filling last visit date: ${lastVisitDate}`);
      const { day, month, year } = this.splitDate(lastVisitDate.toString());

      // Fill day dropdown
      const dayElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl00_ddlPREV_US_VISIT_DTEDay');
      await dayElement.waitFor({ state: 'visible', timeout: 15000 });
      await dayElement.selectOption({ value: day });
      console.log(`✅ Filled last visit day: ${day}`);

      // Fill month dropdown
      const monthElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl00_ddlPREV_US_VISIT_DTEMonth');
      await monthElement.waitFor({ state: 'visible', timeout: 15000 });
      await monthElement.selectOption({ value: month });
      console.log(`✅ Filled last visit month: ${month}`);

      // Fill year input
      const yearElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl00_tbxPREV_US_VISIT_DTEYear');
      await yearElement.waitFor({ state: 'visible', timeout: 15000 });
      await yearElement.fill(year);
      console.log(`✅ Filled last visit year: ${year}`);
    }

    // Fill length of stay
    const lengthValue = formData['us_history.last_visit_length_value'];
    if (lengthValue) {
      console.log(`📝 Filling length of stay value: ${lengthValue}`);
      const lengthElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl00_tbxPREV_US_VISIT_LOS');
      await lengthElement.waitFor({ state: 'visible', timeout: 15000 });
      await lengthElement.fill(lengthValue.toString());
      console.log(`✅ Filled length of stay value: ${lengthValue}`);
    }

    // Fill length of stay unit
    const lengthUnit = formData['us_history.last_visit_length_unit'];
    if (lengthUnit) {
      console.log(`📝 Filling length of stay unit: ${lengthUnit}`);

      // Map unit to CEAC values
      const unitMapping: Record<string, string> = {
        'Year(s)': 'Y',
        'Month(s)': 'M',
        'Week(s)': 'W',
        'Day(s)': 'D',
        'Less than 24 hours': 'H'
      };

      const unitValue = unitMapping[lengthUnit.toString()] || lengthUnit.toString();
      const unitElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_ctl00_ddlPREV_US_VISIT_LOS_CD');
      await unitElement.waitFor({ state: 'visible', timeout: 15000 });
      await unitElement.selectOption({ value: unitValue });
      console.log(`✅ Filled length of stay unit: ${lengthUnit} (${unitValue})`);
    }

    console.log('✅ Completed filling previous visit fields');
  }

  /**
   * Fill driver license fields
   */
  private async fillDriverLicenseFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling driver license fields...');

    // Wait for driver license fields to appear
    await page.waitForTimeout(3000);

    // Fill driver license number
    const licenseNumber = formData['us_history.driver_license_number'];
    if (licenseNumber && licenseNumber !== 'N/A') {
      console.log(`📝 Filling driver license number: ${licenseNumber}`);
      const licenseElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlUS_DRIVER_LICENSE_ctl00_tbxUS_DRIVER_LICENSE');
      await licenseElement.waitFor({ state: 'visible', timeout: 15000 });
      await licenseElement.fill(licenseNumber.toString());
      console.log(`✅ Filled driver license number: ${licenseNumber}`);
    }

    // Handle "Do not know" checkbox
    const licenseUnknown = formData['us_history.driver_license_unknown'];
    if (licenseUnknown === true || licenseNumber === 'N/A') {
      console.log('📝 Checking "Do not know" checkbox for driver license');
      const unknownElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlUS_DRIVER_LICENSE_ctl00_cbxUS_DRIVER_LICENSE_NA');
      await unknownElement.waitFor({ state: 'visible', timeout: 15000 });
      await unknownElement.check();
      console.log('✅ Checked "Do not know" checkbox for driver license');
    }

    // Fill driver license state
    const licenseState = formData['us_history.driver_license_state'];
    if (licenseState) {
      console.log(`📝 Filling driver license state: ${licenseState}`);
      const stateElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dtlUS_DRIVER_LICENSE_ctl00_ddlUS_DRIVER_LICENSE_STATE');
      await stateElement.waitFor({ state: 'visible', timeout: 15000 });
      await stateElement.selectOption({ value: licenseState.toString() });
      console.log(`✅ Filled driver license state: ${licenseState}`);
    }

    console.log('✅ Completed filling driver license fields');
  }

  /**
   * Fill U.S. Visa fields
   */
  private async fillUSVisaFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling U.S. Visa fields...');

    // Wait for visa fields to appear
    await page.waitForTimeout(3000);

    // Fill last visa issued date (split into day, month, year)
    const lastVisaDate = formData['us_history.last_visa_issued_date'];
    if (lastVisaDate) {
      console.log(`📝 Filling last visa issued date: ${lastVisaDate}`);
      const { day, month, year } = this.splitDate(lastVisaDate.toString());

      // Fill day dropdown
      const dayElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlPREV_VISA_ISSUED_DTEDay');
      await dayElement.waitFor({ state: 'visible', timeout: 15000 });
      await dayElement.selectOption({ value: day });
      console.log(`✅ Filled last visa day: ${day}`);

      // Fill month dropdown
      const monthElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ddlPREV_VISA_ISSUED_DTEMonth');
      await monthElement.waitFor({ state: 'visible', timeout: 15000 });
      await monthElement.selectOption({ value: month });
      console.log(`✅ Filled last visa month: ${month}`);

      // Fill year input
      const yearElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_ISSUED_DTEYear');
      await yearElement.waitFor({ state: 'visible', timeout: 15000 });
      await yearElement.fill(year);
      console.log(`✅ Filled last visa year: ${year}`);
    }

    // Fill visa number
    const visaNumber = formData['us_history.visa_number'];
    if (visaNumber && visaNumber !== 'N/A') {
      console.log(`📝 Filling visa number: ${visaNumber}`);
      const visaNumberElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_FOIL_NUMBER');
      await visaNumberElement.waitFor({ state: 'visible', timeout: 15000 });
      await visaNumberElement.fill(visaNumber.toString());
      console.log(`✅ Filled visa number: ${visaNumber}`);
    }

    // Handle "Do not know" checkbox for visa number
    const visaNumberUnknown = formData['us_history.visa_number_unknown'];
    if (visaNumberUnknown === true || visaNumber === 'N/A') {
      console.log('📝 Checking "Do not know" checkbox for visa number');
      const unknownElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_cbxPREV_VISA_FOIL_NUMBER_NA');
      await unknownElement.waitFor({ state: 'visible', timeout: 15000 });
      await unknownElement.check();
      console.log('✅ Checked "Do not know" checkbox for visa number');
    }

    // Fill same visa type
    const sameVisaType = formData['us_history.same_visa_type'];
    if (sameVisaType) {
      console.log(`📝 Filling same visa type: ${sameVisaType}`);
      const radioValue = sameVisaType === 'Yes' ? 'Y' : 'N';
      const radioSelector = `input[type="radio"][name*="rblPREV_VISA_SAME_TYPE_IND"][value="${radioValue}"]`;
      const radioElement = page.locator(radioSelector);
      await radioElement.waitFor({ state: 'visible', timeout: 15000 });
      await radioElement.click();
      console.log(`✅ Selected same visa type: ${sameVisaType} (${radioValue})`);
    }

    // Fill same country
    const sameCountry = formData['us_history.same_country'];
    if (sameCountry) {
      console.log(`📝 Filling same country: ${sameCountry}`);
      const radioValue = sameCountry === 'Yes' ? 'Y' : 'N';
      const radioSelector = `input[type="radio"][name*="rblPREV_VISA_SAME_CNTRY_IND"][value="${radioValue}"]`;
      const radioElement = page.locator(radioSelector);
      await radioElement.waitFor({ state: 'visible', timeout: 15000 });
      await radioElement.click();
      console.log(`✅ Selected same country: ${sameCountry} (${radioValue})`);
    }

    // Fill ten printed
    const tenPrinted = formData['us_history.ten_printed'];
    if (tenPrinted) {
      console.log(`📝 Filling ten printed: ${tenPrinted}`);
      const radioValue = tenPrinted === 'Yes' ? 'Y' : 'N';
      const radioSelector = `input[type="radio"][name*="rblPREV_VISA_TEN_PRINT_IND"][value="${radioValue}"]`;
      const radioElement = page.locator(radioSelector);
      await radioElement.waitFor({ state: 'visible', timeout: 15000 });
      await radioElement.click();
      console.log(`✅ Selected ten printed: ${tenPrinted} (${radioValue})`);
    }

    // Handle visa lost/stolen
    const visaLostStolen = formData['us_history.visa_lost_stolen'];
    if (visaLostStolen) {
      console.log(`📝 Filling visa lost/stolen: ${visaLostStolen}`);
      const radioValue = visaLostStolen === 'Yes' ? 'Y' : 'N';
      const radioSelector = `input[type="radio"][name*="rblPREV_VISA_LOST_IND"][value="${radioValue}"]`;
      const radioElement = page.locator(radioSelector);
      await radioElement.waitFor({ state: 'visible', timeout: 15000 });
      await radioElement.click();
      console.log(`✅ Selected visa lost/stolen: ${visaLostStolen} (${radioValue})`);

      // Wait for postback if Yes
      if (visaLostStolen === 'Yes') {
        await this.waitForPostback(page, 'visa lost/stolen selection');
        console.log('✅ Postback completed after visa lost/stolen selection');
        await page.waitForTimeout(3000); // Wait for conditional fields to appear

        // Fill visa lost year
        const visaLostYear = formData['us_history.visa_lost_year'];
        if (visaLostYear) {
          console.log(`📝 Filling visa lost year: ${visaLostYear}`);
          const yearElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_LOST_YEAR');
          await yearElement.waitFor({ state: 'visible', timeout: 15000 });
          await yearElement.fill(visaLostYear.toString());
          console.log(`✅ Filled visa lost year: ${visaLostYear}`);
        }

        // Fill visa lost explanation
        const visaLostExplanation = formData['us_history.visa_lost_explanation'];
        if (visaLostExplanation) {
          console.log(`📝 Filling visa lost explanation: ${visaLostExplanation}`);
          const explanationElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_LOST_EXPL');
          await explanationElement.waitFor({ state: 'visible', timeout: 15000 });
          await explanationElement.fill(visaLostExplanation.toString());
          console.log(`✅ Filled visa lost explanation: ${visaLostExplanation}`);
        }
      }
    }

    // Handle visa cancelled/revoked
    const visaCancelledRevoked = formData['us_history.visa_cancelled_revoked'];
    if (visaCancelledRevoked) {
      console.log(`📝 Filling visa cancelled/revoked: ${visaCancelledRevoked}`);
      const radioValue = visaCancelledRevoked === 'Yes' ? 'Y' : 'N';
      const radioSelector = `input[type="radio"][name*="rblPREV_VISA_CANCELLED_IND"][value="${radioValue}"]`;
      const radioElement = page.locator(radioSelector);
      await radioElement.waitFor({ state: 'visible', timeout: 15000 });
      await radioElement.click();
      console.log(`✅ Selected visa cancelled/revoked: ${visaCancelledRevoked} (${radioValue})`);

      // Wait for postback if Yes
      if (visaCancelledRevoked === 'Yes') {
        await this.waitForPostback(page, 'visa cancelled/revoked selection');
        console.log('✅ Postback completed after visa cancelled/revoked selection');
        await page.waitForTimeout(3000); // Wait for conditional fields to appear

        // Fill visa cancelled explanation
        const visaCancelledExplanation = formData['us_history.visa_cancelled_explanation'];
        if (visaCancelledExplanation) {
          console.log(`📝 Filling visa cancelled explanation: ${visaCancelledExplanation}`);
          const explanationElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_CANCELLED_EXPL');
          await explanationElement.waitFor({ state: 'visible', timeout: 15000 });
          await explanationElement.fill(visaCancelledExplanation.toString());
          console.log(`✅ Filled visa cancelled explanation: ${visaCancelledExplanation}`);
        }
      }
    }

    console.log('✅ Completed filling U.S. Visa fields');
  }

  /**
   * Fill visa refusal fields
   */
  private async fillVisaRefusalFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling visa refusal fields...');

    // Wait for visa refusal fields to appear
    await page.waitForTimeout(3000);

    // Fill visa refused explanation
    const visaRefusedExplanation = formData['us_history.visa_refused_explanation'];
    if (visaRefusedExplanation) {
      console.log(`📝 Filling visa refused explanation: ${visaRefusedExplanation}`);
      const explanationElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_REFUSED_EXPL');
      await explanationElement.waitFor({ state: 'visible', timeout: 15000 });
      await explanationElement.fill(visaRefusedExplanation.toString());
      console.log(`✅ Filled visa refused explanation: ${visaRefusedExplanation}`);
    }

    console.log('✅ Completed filling visa refusal fields');
  }

  /**
   * Fill immigrant petition fields
   */
  private async fillImmigrantPetitionFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling immigrant petition fields...');

    // Wait for immigrant petition fields to appear
    await page.waitForTimeout(3000);

    // Fill immigrant petition explanation
    const immigrantPetitionExplanation = formData['us_history.immigrant_petition_explanation'];
    if (immigrantPetitionExplanation) {
      console.log(`📝 Filling immigrant petition explanation: ${immigrantPetitionExplanation}`);
      const explanationElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxIV_PETITION_EXPL');
      await explanationElement.waitFor({ state: 'visible', timeout: 15000 });
      await explanationElement.fill(immigrantPetitionExplanation.toString());
      console.log(`✅ Filled immigrant petition explanation: ${immigrantPetitionExplanation}`);
    }

    console.log('✅ Completed filling immigrant petition fields');
  }

  /**
   * Fill permanent resident fields
   */
  private async fillPermanentResidentFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling permanent resident fields...');

    // Wait for permanent resident fields to appear
    await page.waitForTimeout(3000);

    // Fill permanent resident explanation
    const permanentResidentExplanation = formData['us_history.permanent_resident_explanation'];
    if (permanentResidentExplanation) {
      console.log(`📝 Filling permanent resident explanation: ${permanentResidentExplanation}`);
      const explanationElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxPERM_RESIDENT_EXPL');
      await explanationElement.waitFor({ state: 'visible', timeout: 15000 });
      await explanationElement.fill(permanentResidentExplanation.toString());
      console.log(`✅ Filled permanent resident explanation: ${permanentResidentExplanation}`);
    }

    console.log('✅ Completed filling permanent resident fields');
  }

  /**
   * Select driver license option
   */
  private async selectDriverLicenseOption(page: Page, jobId: string, option: string): Promise<void> {
    console.log(`📝 Selecting driver license option: ${option}`);
    const radioValue = option === 'Yes' ? 'Y' : 'N';
    console.log(`🔍 STEP5 - Driver license radio value: ${radioValue}`);

    // Construct the radio button ID for driver license
    const radioButtonId = `ctl00_SiteContentPlaceHolder_FormView1_rblPREV_US_DRIVER_LIC_IND_${radioValue === 'Y' ? '0' : '1'}`;
    console.log(`🔍 STEP5 - Driver license radio button ID: ${radioButtonId}`);

    const radioElement = page.locator(`#${radioButtonId}`);
    await radioElement.waitFor({ state: 'visible', timeout: 15000 });
    await radioElement.click();
    console.log(`✅ Selected driver license radio button: ${option} (${radioValue})`);

    // Wait for postback
    await this.waitForPostback(page, 'driver license selection');
    console.log('✅ Postback completed after driver license selection');
    await page.waitForTimeout(3000); // Wait for conditional fields to appear
  }

  private splitDate(dateString: string): { day: string; month: string; year: string } {
    if (!dateString) return { day: '', month: '', year: '' };
    
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString();
      const month = (date.getMonth() + 1).toString(); // getMonth() returns 0-11, so add 1
      const year = date.getFullYear().toString();
      
      return { day, month, year };
    } catch (error) {
      console.warn(`⚠️ Failed to parse date: ${dateString}`);
      return { day: '', month: '', year: '' };
    }
  }
}

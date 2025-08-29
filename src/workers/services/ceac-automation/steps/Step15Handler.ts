import { Page } from 'playwright'
import { BaseStepHandler } from './BaseStepHandler'
import { DS160FormData } from '@/lib/types/ceac'
import { FormFieldMapping, getStep15FieldMappings } from '@/lib/form-field-mappings'
import { validateStep15 } from '@/lib/validation/stepValidation'

export class Step15Handler extends BaseStepHandler {
  constructor() {
    super(15, 'Security and Background Information (Part 3)', 'Security and Background Information (Part 3)')
  }

  protected getFieldMappings(): FormFieldMapping[] {
    return getStep15FieldMappings()
  }

  protected validateStepData(formData: DS160FormData): { valid: boolean; errors: string[] } {
    const validation = validateStep15(formData)
    return {
      valid: validation.isValid,
      errors: validation.errors
    }
  }

  async handleStep(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Starting Step 15 - Security and Background Information (Part 3)...')
    
    // Update progress
    await this.progressService.updateStepProgress(
      jobId,
      'form_step_15',
      'running',
      'Filling Security and Background Information (Part 3)',
      85
    )

    // Fill espionage/illegal activity question
    await this.fillEspionageOrIllegalActivityQuestion(page, jobId, formData)
    
    // Fill terrorist activities question
    await this.fillTerroristActivitiesQuestion(page, jobId, formData)
    
    // Fill support to terrorists question
    await this.fillSupportToTerroristsQuestion(page, jobId, formData)
    
    // Fill member of terrorist org question
    await this.fillMemberOfTerroristOrgQuestion(page, jobId, formData)
    
    // Fill family engaged in terrorism question
    await this.fillFamilyEngagedInTerrorismQuestion(page, jobId, formData)
    
    // Fill genocide involvement question
    await this.fillGenocideInvolvementQuestion(page, jobId, formData)
    
    // Fill torture involvement question
    await this.fillTortureInvolvementQuestion(page, jobId, formData)
    
    // Fill violence/killings involvement question
    await this.fillViolenceKillingsInvolvementQuestion(page, jobId, formData)
    
    // Fill child soldiers involvement question
    await this.fillChildSoldiersInvolvementQuestion(page, jobId, formData)
    
    // Fill religious freedom violations question
    await this.fillReligiousFreedomViolationsQuestion(page, jobId, formData)
    
    // Fill population control question
    await this.fillPopulationControlQuestion(page, jobId, formData)
    
    // Fill coercive transplantation question
    await this.fillCoerciveTransplantationQuestion(page, jobId, formData)
    
    console.log('✅ Step 15 form filling completed')
    
    // Click Next button with error checking
    await this.clickStep15NextButton(page, jobId)
  }

  /**
   * Fill espionage/illegal activity question
   */
  private async fillEspionageOrIllegalActivityQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const espionageValue = formData['security_background3.espionage_or_illegal_activity']
    console.log(`📝 Filling espionage/illegal activity question: ${espionageValue}`)
    
    if (espionageValue === 'Yes' || espionageValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblIllegalActivity_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for espionage/illegal activity')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background3.espionage_or_illegal_activity_explain']
      if (explain) {
        console.log(`📝 Filling espionage/illegal activity explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxIllegalActivity')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled espionage/illegal activity explanation')
      }
    } else if (espionageValue === 'No' || espionageValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblIllegalActivity_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for espionage/illegal activity')
    }
  }

  /**
   * Fill terrorist activities question
   */
  private async fillTerroristActivitiesQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const terroristValue = formData['security_background3.terrorist_activities']
    console.log(`📝 Filling terrorist activities question: ${terroristValue}`)
    
    if (terroristValue === 'Yes' || terroristValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblTerroristActivity_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for terrorist activities')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background3.terrorist_activities_explain']
      if (explain) {
        console.log(`📝 Filling terrorist activities explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxTerroristActivity')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled terrorist activities explanation')
      }
    } else if (terroristValue === 'No' || terroristValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblTerroristActivity_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for terrorist activities')
    }
  }

  /**
   * Fill support to terrorists question
   */
  private async fillSupportToTerroristsQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const supportValue = formData['security_background3.support_to_terrorists']
    console.log(`📝 Filling support to terrorists question: ${supportValue}`)
    
    if (supportValue === 'Yes' || supportValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblTerroristSupport_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for support to terrorists')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background3.support_to_terrorists_explain']
      if (explain) {
        console.log(`📝 Filling support to terrorists explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxTerroristSupport')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled support to terrorists explanation')
      }
    } else if (supportValue === 'No' || supportValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblTerroristSupport_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for support to terrorists')
    }
  }

  /**
   * Fill member of terrorist org question
   */
  private async fillMemberOfTerroristOrgQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const memberValue = formData['security_background3.member_of_terrorist_org']
    console.log(`📝 Filling member of terrorist org question: ${memberValue}`)
    
    if (memberValue === 'Yes' || memberValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblTerroristOrg_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for member of terrorist org')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background3.member_of_terrorist_org_explain']
      if (explain) {
        console.log(`📝 Filling member of terrorist org explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxTerroristOrg')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled member of terrorist org explanation')
      }
    } else if (memberValue === 'No' || memberValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblTerroristOrg_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for member of terrorist org')
    }
  }

  /**
   * Fill family engaged in terrorism question
   */
  private async fillFamilyEngagedInTerrorismQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const familyValue = formData['security_background3.family_engaged_in_terrorism_last_five_years']
    console.log(`📝 Filling family engaged in terrorism question: ${familyValue}`)
    
    if (familyValue === 'Yes' || familyValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblTerroristRel_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for family engaged in terrorism')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background3.family_engaged_in_terrorism_last_five_years_explain']
      if (explain) {
        console.log(`📝 Filling family engaged in terrorism explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxTerroristRel')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled family engaged in terrorism explanation')
      }
    } else if (familyValue === 'No' || familyValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblTerroristRel_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for family engaged in terrorism')
    }
  }

  /**
   * Fill genocide involvement question
   */
  private async fillGenocideInvolvementQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const genocideValue = formData['security_background3.genocide_involvement']
    console.log(`📝 Filling genocide involvement question: ${genocideValue}`)
    
    if (genocideValue === 'Yes' || genocideValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblGenocide_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for genocide involvement')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background3.genocide_involvement_explain']
      if (explain) {
        console.log(`📝 Filling genocide involvement explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxGenocide')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled genocide involvement explanation')
      }
    } else if (genocideValue === 'No' || genocideValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblGenocide_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for genocide involvement')
    }
  }

  /**
   * Fill torture involvement question
   */
  private async fillTortureInvolvementQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const tortureValue = formData['security_background3.torture_involvement']
    console.log(`📝 Filling torture involvement question: ${tortureValue}`)
    
    if (tortureValue === 'Yes' || tortureValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblTorture_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for torture involvement')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background3.torture_involvement_explain']
      if (explain) {
        console.log(`📝 Filling torture involvement explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxTorture')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled torture involvement explanation')
      }
    } else if (tortureValue === 'No' || tortureValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblTorture_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for torture involvement')
    }
  }

  /**
   * Fill violence/killings involvement question
   */
  private async fillViolenceKillingsInvolvementQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const violenceValue = formData['security_background3.violence_killings_involvement']
    console.log(`📝 Filling violence/killings involvement question: ${violenceValue}`)
    
    if (violenceValue === 'Yes' || violenceValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblExViolence_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for violence/killings involvement')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background3.violence_killings_involvement_explain']
      if (explain) {
        console.log(`📝 Filling violence/killings involvement explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxExViolence')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled violence/killings involvement explanation')
      }
    } else if (violenceValue === 'No' || violenceValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblExViolence_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for violence/killings involvement')
    }
  }

  /**
   * Fill child soldiers involvement question
   */
  private async fillChildSoldiersInvolvementQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const childValue = formData['security_background3.child_soldiers_involvement']
    console.log(`📝 Filling child soldiers involvement question: ${childValue}`)
    
    if (childValue === 'Yes' || childValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblChildSoldier_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for child soldiers involvement')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background3.child_soldiers_involvement_explain']
      if (explain) {
        console.log(`📝 Filling child soldiers involvement explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxChildSoldier')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled child soldiers involvement explanation')
      }
    } else if (childValue === 'No' || childValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblChildSoldier_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for child soldiers involvement')
    }
  }

  /**
   * Fill religious freedom violations question
   */
  private async fillReligiousFreedomViolationsQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const religiousValue = formData['security_background3.religious_freedom_violations']
    console.log(`📝 Filling religious freedom violations question: ${religiousValue}`)
    
    if (religiousValue === 'Yes' || religiousValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblReligiousFreedom_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for religious freedom violations')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background3.religious_freedom_violations_explain']
      if (explain) {
        console.log(`📝 Filling religious freedom violations explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxReligiousFreedom')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled religious freedom violations explanation')
      }
    } else if (religiousValue === 'No' || religiousValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblReligiousFreedom_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for religious freedom violations')
    }
  }

  /**
   * Fill population control question
   */
  private async fillPopulationControlQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const populationValue = formData['security_background3.population_control_forced_abortion_sterilization']
    console.log(`📝 Filling population control question: ${populationValue}`)
    
    if (populationValue === 'Yes' || populationValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblPopulationControls_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for population control')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background3.population_control_forced_abortion_sterilization_explain']
      if (explain) {
        console.log(`📝 Filling population control explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxPopulationControls')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled population control explanation')
      }
    } else if (populationValue === 'No' || populationValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblPopulationControls_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for population control')
    }
  }

  /**
   * Fill coercive transplantation question
   */
  private async fillCoerciveTransplantationQuestion(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const transplantValue = formData['security_background3.coercive_transplantation']
    console.log(`📝 Filling coercive transplantation question: ${transplantValue}`)
    
    if (transplantValue === 'Yes' || transplantValue === 'Y') {
      // Select Yes
      const yesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblTransplant_0')
      await yesElement.waitFor({ state: 'visible', timeout: 15000 })
      await yesElement.check()
      console.log('✅ Selected "Yes" for coercive transplantation')
      
      // Wait for conditional field to appear
      await page.waitForTimeout(2000)
      
      // Fill explanation
      const explain = formData['security_background3.coercive_transplantation_explain']
      if (explain) {
        console.log(`📝 Filling coercive transplantation explanation: ${explain}`)
        const explainElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxTransplant')
        await explainElement.waitFor({ state: 'visible', timeout: 15000 })
        await explainElement.fill(explain.toString())
        console.log('✅ Filled coercive transplantation explanation')
      }
    } else if (transplantValue === 'No' || transplantValue === 'N') {
      // Select No
      const noElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_rblTransplant_1')
      await noElement.waitFor({ state: 'visible', timeout: 15000 })
      await noElement.check()
      console.log('✅ Selected "No" for coercive transplantation')
    }
  }

  /**
   * Click Next button after Step 15 with error checking
   */
  private async clickStep15NextButton(page: Page, jobId: string): Promise<void> {
    console.log('➡️ Clicking Next button after Step 15...')
    try {
      const nextButton = page.locator('#ctl00_SiteContentPlaceHolder_UpdateButton3')
      if (await nextButton.isVisible({ timeout: 10000 })) {
        await nextButton.click()
        console.log('✅ Step 15 Next button clicked')
        try { // Robust navigation waiting
          console.log('⏳ Waiting for page to load after Next button click...')
          await page.waitForLoadState('networkidle', { timeout: 45000 })
          console.log('✅ Page loaded successfully')
        } catch (error) {
          console.log('⚠️ Network idle timeout, trying alternative wait strategy...')
          try {
            await page.waitForLoadState('domcontentloaded', { timeout: 30000 })
            console.log('✅ DOM content loaded')
            await page.waitForTimeout(5000)
            console.log('✅ Additional wait completed')
          } catch (domError) {
            console.log('⚠️ DOM content loaded also timed out, proceeding anyway...')
            await page.waitForTimeout(3000)
          }
        }
        const hasValidationErrors = await this.checkForValidationErrors(page)
        if (hasValidationErrors) {
          console.error('❌ Validation errors detected on Step 15')
          await this.takeErrorScreenshot(page, jobId)
          await this.updateJobStatusToFailed(jobId, 'Validation errors on Step 15')
          throw new Error('Form validation failed on Step 15. Check screenshot for details.')
        }
        await this.progressService.updateStepProgress(
          jobId,
          'form_step_16',
          'running',
          'Successfully navigated to Step 16',
          90
        )
        await page.screenshot({ path: `after-step15-next-button-click-${jobId}.png` })
        console.log('✅ Successfully navigated to Step 16')
      } else {
        throw new Error('Step 15 Next button not found')
      }
    } catch (error) {
      console.error('❌ Error clicking Step 15 Next button:', error)
      await page.screenshot({ path: `error-step15-next-${jobId}.png` })
      console.log('📸 Screenshot saved: error-step15-next.png')
      throw error
    }
  }
}

import { Page } from 'playwright'
import { BaseStepHandler } from './BaseStepHandler'
import { getStep4FieldMappings } from '../../../../lib/form-field-mappings'
import type { DS160FormData } from '@/lib/types/ceac'

export class Step4Handler extends BaseStepHandler {
  constructor() {
    super(4, 'Travel Companions', 'Travel Companions - Step 4')
  }

  protected getFieldMappings() {
    return getStep4FieldMappings()
  }

  protected validateStepData(formData: DS160FormData): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const travelingWithOthers = formData['traveling_companions.traveling_with_others']
    
    if (!travelingWithOthers) {
      errors.push('Traveling with others field is required')
    }
    
    if (travelingWithOthers === 'Yes') {
      const travelingAsGroup = formData['traveling_companions.traveling_as_group']
      if (!travelingAsGroup) {
        errors.push('Traveling as group field is required when traveling with others is Yes')
      }
      
      if (travelingAsGroup === 'Yes') {
        const groupName = formData['traveling_companions.group_name']
        if (!groupName) {
          errors.push('Group name is required when traveling as group is Yes')
        }
      } else if (travelingAsGroup === 'No') {
        const companionSurnames = formData['traveling_companions.companion_surnames']
        const companionGivenNames = formData['traveling_companions.companion_given_names']
        const companionRelationship = formData['traveling_companions.companion_relationship']
        
        if (!companionSurnames || !companionGivenNames || !companionRelationship) {
          errors.push('Companion surnames, given names, and relationship are required when traveling as group is No')
        }
      }
    }
    
    return { valid: errors.length === 0, errors }
  }

  protected async handleStepSpecificLogic(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Handling Step 4 specific logic...')
    
    const travelingWithOthers = formData['traveling_companions.traveling_with_others']
    const travelingAsGroup = formData['traveling_companions.traveling_as_group']
    
    if (travelingWithOthers === 'Yes') {
      console.log('📝 Traveling with others is Yes, waiting for group travel question to appear...')
      
      // Wait for the group travel question to appear
      await page.waitForTimeout(3000) // Wait 3 seconds for conditional fields to appear
      
      // Check if we need to select the group travel option
      if (travelingAsGroup !== undefined && travelingAsGroup !== null && travelingAsGroup !== '') {
        console.log(`📝 Selecting group travel option: ${travelingAsGroup}`)
        await this.selectGroupTravelOption(page, jobId, travelingAsGroup)
        
        if (travelingAsGroup === 'Yes') {
          console.log('📝 Traveling as group is Yes, filling group name...')
          await this.fillGroupNameField(page, jobId, formData)
        } else if (travelingAsGroup === 'No') {
          console.log('📝 Traveling as group is No, filling individual companion fields...')
          await this.fillIndividualCompanionFields(page, jobId, formData)
        }
      } else {
        console.log('⚠️ No group travel option specified, skipping conditional fields')
      }
    }
    
    console.log('✅ Step 4 conditional fields completed')
  }

  protected async checkStepSpecificValidationErrors(page: Page): Promise<boolean> {
    // Check for Step 4 specific validation errors
    const validationSummary = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_ValidationSummary')
    if (await validationSummary.isVisible()) {
      const errorText = await validationSummary.textContent()
      if (errorText) {
        // Extract error messages from the validation summary
        const errorMessages = errorText
          .split('\n')
          .filter(line => line.trim().length > 0)
          .filter(line => !line.includes('Please correct all areas in error'))
        
        if (errorMessages.length > 0) {
          console.log('❌ Step 4 validation errors found:', errorMessages)
          return true // Has errors
        }
      }
    }
    
    return false // No errors
  }

  /**
   * Select group travel option (Yes/No)
   */
  private async selectGroupTravelOption(page: Page, jobId: string, option: string): Promise<void> {
    console.log(`📝 Selecting group travel option: ${option}`)
    
    // Map option to CEAC value
    const radioValue = option === 'Yes' ? 'Y' : 'N'
    console.log(`🔍 STEP4 - Group travel radio value: ${radioValue}`)
    
    // Create radio selector for group travel
    const radioSelector = `input[type="radio"][name*="rblGroupTravel"][value="${radioValue}"]`
    console.log(`🔍 STEP4 - Group travel radio selector: ${radioSelector}`)
    
    const radioElement = page.locator(radioSelector)
    await radioElement.waitFor({ state: 'visible', timeout: 15000 })
    await radioElement.click()
    console.log(`✅ Selected group travel radio button: ${option} (${radioValue})`)
    
    // Wait for postback (both Yes and No trigger postback)
    await this.waitForPostback(page, 'group travel selection')
    console.log('✅ Postback completed after group travel selection')
    
    // Additional wait for conditional fields to appear
    await page.waitForTimeout(3000)
  }

  /**
   * Fill group name field
   */
  private async fillGroupNameField(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    const groupName = formData['traveling_companions.group_name']
    if (groupName) {
      console.log(`📝 Filling group name: ${groupName}`)
      
      // Wait for group name field to appear
      await page.waitForTimeout(3000) // Wait 3 seconds for conditional fields to appear
      
      const groupNameElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_tbxGroupName')
      await groupNameElement.waitFor({ state: 'visible', timeout: 15000 })
      await groupNameElement.fill(groupName.toString())
      console.log(`✅ Filled group name: ${groupName}`)
    }
  }

  /**
   * Fill individual companion fields
   */
  private async fillIndividualCompanionFields(page: Page, jobId: string, formData: DS160FormData): Promise<void> {
    console.log('📝 Filling individual companion fields...')
    
    // Wait for companion fields to appear
    await page.waitForTimeout(3000) // Wait 3 seconds for conditional fields to appear
    
    // Fill companion surnames
    const companionSurnames = formData['traveling_companions.companion_surnames']
    if (companionSurnames) {
      console.log(`📝 Filling companion surnames: ${companionSurnames}`)
      const surnamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dlTravelCompanions_ctl00_tbxSurname')
      await surnamesElement.waitFor({ state: 'visible', timeout: 15000 })
      await surnamesElement.fill(companionSurnames.toString().toUpperCase())
      console.log(`✅ Filled companion surnames: ${companionSurnames}`)
    }
    
    // Fill companion given names
    const companionGivenNames = formData['traveling_companions.companion_given_names']
    if (companionGivenNames) {
      console.log(`📝 Filling companion given names: ${companionGivenNames}`)
      const givenNamesElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dlTravelCompanions_ctl00_tbxGivenName')
      await givenNamesElement.waitFor({ state: 'visible', timeout: 15000 })
      await givenNamesElement.fill(companionGivenNames.toString().toUpperCase())
      console.log(`✅ Filled companion given names: ${companionGivenNames}`)
    }
    
    // Fill companion relationship
    const companionRelationship = formData['traveling_companions.companion_relationship']
    if (companionRelationship) {
      console.log(`📝 Filling companion relationship: ${companionRelationship}`)
      
      // Map relationship to CEAC values
      const relationshipMapping: Record<string, string> = {
        'PARENT': 'P',
        'SPOUSE': 'S',
        'CHILD': 'C',
        'OTHER RELATIVE': 'R',
        'FRIEND': 'F',
        'BUSINESS ASSOCIATE': 'B',
        'OTHER': 'O'
      }
      
      const relationshipValue = relationshipMapping[companionRelationship.toString()] || companionRelationship.toString()
      const relationshipElement = page.locator('#ctl00_SiteContentPlaceHolder_FormView1_dlTravelCompanions_ctl00_ddlTCRelationship')
      await relationshipElement.waitFor({ state: 'visible', timeout: 15000 })
      await relationshipElement.selectOption({ value: relationshipValue })
      console.log(`✅ Filled companion relationship: ${companionRelationship} (${relationshipValue})`)
    }
    
    console.log('✅ Completed filling individual companion fields')
  }

  /**
   * Override fillFieldByType to add Step 4 specific waits
   */
  protected async fillFieldByType(page: Page, element: any, fieldMapping: any, fieldValue: any, formData: DS160FormData, jobId?: string): Promise<void> {
    await super.fillFieldByType(page, element, fieldMapping, fieldValue, formData, jobId)
    
    // Add Step 4 specific waits for traveling with others selection
    if (fieldMapping.fieldName === 'traveling_companions.traveling_with_others') {
      console.log(`🔍 STEP4 - Traveling with others selected, waiting for conditional fields to appear...`)
      
      // Wait for postback if "No" is selected (triggers postback)
      if (fieldValue === 'No') {
        await this.waitForPostback(page, 'traveling with others selection')
        console.log('✅ Postback completed after traveling with others selection')
      }
      
      await page.waitForTimeout(3000) // Wait 3 seconds for conditional fields to appear
      console.log(`🔍 STEP4 - Waiting completed for traveling with others fields...`)
    }
  }
}

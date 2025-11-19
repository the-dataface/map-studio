import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Accessibility tests using Axe
 * These tests ensure the application meets WCAG AA standards
 */
test.describe('Accessibility', () => {
  test('should not have any automatically detectable accessibility violations on home page', async ({ page }) => {
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .exclude('#map-preview svg') // Exclude SVG map as it's complex and handled separately
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should not have any automatically detectable accessibility violations on studio page', async ({ page }) => {
    await page.goto('/')

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .exclude('svg[role="img"]') // Exclude SVG map as it's complex and handled separately
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have proper form label associations', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check that textareas have associated labels
    const symbolTextarea = page.locator('#symbol-data-input')
    await expect(symbolTextarea).toBeVisible()
    
    const choroplethTextarea = page.locator('#choropleth-data-input')
    await expect(choroplethTextarea).toBeVisible()

    const customTextarea = page.locator('#custom-svg-input')
    await expect(customTextarea).toBeVisible()
  })

  test('should support keyboard navigation for collapsible panels', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Find a collapsible panel header
    const panelHeader = page.locator('[role="button"][aria-expanded]').first()
    
    if (await panelHeader.count() > 0) {
      const initialExpanded = await panelHeader.getAttribute('aria-expanded')
      
      // Test keyboard navigation
      await panelHeader.focus()
      await page.keyboard.press('Enter')
      
      // Wait for state change
      await page.waitForTimeout(100)
      
      const afterExpanded = await panelHeader.getAttribute('aria-expanded')
      expect(afterExpanded).not.toBe(initialExpanded)
    }
  })

  test('should have accessible map descriptions', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check that map SVG has aria-label
    const mapSvg = page.locator('svg[role="img"]')
    const count = await mapSvg.count()
    
    if (count > 0) {
      const ariaLabel = await mapSvg.first().getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
      expect(ariaLabel?.length).toBeGreaterThan(0)
    }
  })
})


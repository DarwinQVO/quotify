import { test, expect } from '@playwright/test'

test('app loads correctly', async ({ page }) => {
  await page.goto('/')
  
  // Check that main elements are present
  await expect(page.getByText('Sources')).toBeVisible()
  await expect(page.getByText('Quotes')).toBeVisible()
  await expect(page.getByText('No video selected')).toBeVisible()
})

test('can open command palette', async ({ page }) => {
  await page.goto('/')
  
  // Open command palette with Cmd+K
  await page.keyboard.press('Meta+k')
  
  await expect(page.getByPlaceholder('Search commands or paste YouTube URL...')).toBeVisible()
})

test('shows empty state for quotes', async ({ page }) => {
  await page.goto('/')
  
  await expect(page.getByText('No quotes yet')).toBeVisible()
  await expect(page.getByText('Select text in the transcript and click "Extract Quote" to get started')).toBeVisible()
})
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-14T12:00:00Z'))
})

test('browse the complete source data and persist a note across an offline reopen', async ({ page, context }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Bilbao Airport → Llanes' })).toBeVisible()
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  // A waiting-update strategy intentionally does not claim an already-open first-load tab.
  await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
  const dismiss = page.getByRole('button', { name: 'Dismiss' })
  if (await dismiss.isVisible()) await dismiss.click()
  await page.getByLabel('Day note', { exact: true }).fill('Pack the blue raincoat. Café at 08:00.')
  await page.getByRole('button', { name: 'Save note' }).click()
  await expect(page.getByRole('status')).toContainText('Note saved')
  await page.reload()
  await expect(page.getByLabel('Day note', { exact: true })).toHaveValue('Pack the blue raincoat. Café at 08:00.')
  await page.getByRole('link', { name: 'Trip', exact: true }).click()
  await expect(page.locator('.trip-row')).toHaveCount(13)
  await page.getByRole('link', { name: 'Explore', exact: true }).click()
  await page.getByRole('searchbox').fill('El Jisu')
  await page.getByRole('link', { name: /Hotel El Jisu/ }).click()
  await expect(page.getByRole('heading', { name: 'Hotel El Jisu' })).toBeVisible()
  await expect(page.getByText('08:30–10:30', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Navigate' })).toHaveAttribute('href', /google.com\/maps/)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Hotel El Jisu' })).toBeVisible()
  await page.getByRole('link', { name: 'Today', exact: true }).click()
  await expect(page.getByLabel('Day note', { exact: true })).toHaveValue('Pack the blue raincoat. Café at 08:00.')
  await page.getByLabel('Day note', { exact: true }).fill('Saved while offline')
  await page.getByRole('button', { name: 'Save note' }).click()
  await expect(page.getByRole('status')).toContainText('Note saved')
  await page.reload()
  await expect(page.getByLabel('Day note', { exact: true })).toHaveValue('Saved while offline')
  await page.screenshot({ path: 'test-results/foundation-mobile.png', fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('protect a draft and export the current complete trip', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Day note', { exact: true }).fill('Do not lose this draft')
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('link', { name: 'Trip', exact: true }).click()
  await expect(page.getByLabel('Day note', { exact: true })).toHaveValue('Do not lose this draft')
  await expect(page).toHaveURL(/#\/today$/)
  await page.getByRole('button', { name: 'Save note' }).click()
  await expect(page.getByRole('status')).toContainText('Note saved')
  await page.getByRole('link', { name: 'More', exact: true }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export trip data' }).click()
  const file = await download
  const stream = await file.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  const trip = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  expect(trip.schemaVersion).toBe(1)
  expect(trip.days).toHaveLength(13)
  expect(trip.days[0].notes).toBe('Do not lose this draft')
})

test('browser Back also preserves unsaved day notes when navigation is cancelled', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Trip', exact: true }).click()
  await page.locator('.trip-row').nth(2).click()
  await page.getByLabel('Day note', { exact: true }).fill('Keep this day-three draft')
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.goBack()
  await expect(page).toHaveURL(/#\/day\/day-3$/)
  await expect(page.getByLabel('Day note', { exact: true })).toHaveValue('Keep this day-three draft')
})

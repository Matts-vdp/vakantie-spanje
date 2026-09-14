import { test, expect } from '@playwright/test'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'

test('real phase-1 to phase-2 worker upgrade under a static subdirectory preserves edits', async ({ page, context }) => {
  test.setTimeout(60000)
  let root = resolve('node_modules/.cache/lifecycle-old/dist')
  let nextWorker = false
  const server = createServer(async (req, res) => {
    const pathname = new URL(req.url!, 'http://localhost').pathname
    if (!pathname.startsWith('/travel/')) { res.writeHead(404).end(); return }
    const path = resolve(root, decodeURIComponent(pathname.slice('/travel/'.length)) || 'index.html')
    if (!path.startsWith(root + sep)) { res.writeHead(404).end(); return }
    try {
      if (!(await stat(path)).isFile()) throw new Error('Not a file')
      const body = nextWorker && pathname.endsWith('/sw.js') ? Buffer.concat([await readFile(path), Buffer.from('\n// Subsequent worker update for form guard verification\n')]) : await readFile(path)
      const mime: Record<string, string> = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' }
      res.writeHead(200, { 'Content-Type': mime[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body)
    } catch { res.writeHead(404).end() }
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as { port: number }
  const url = `http://127.0.0.1:${address.port}/travel/`
  try {
    await page.goto(url)
    await page.evaluate(async () => { await navigator.serviceWorker.ready })
    await page.reload()
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
    await page.getByLabel('Day note', { exact: true }).fill('Saved in actual phase 1')
    await page.getByRole('button', { name: 'Save note', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('Note saved')
    const oldWorker = await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)
    expect(oldWorker).toContain('/travel/sw.js')
    root = resolve('dist')
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())!.update() })
    await expect(page.getByRole('button', { name: 'Update app', exact: true })).toBeVisible()
    await page.getByLabel('Day note', { exact: true }).fill('Draft while update waits')
    await expect(page.getByRole('button', { name: 'Save your note first', exact: true })).toBeDisabled()
    await page.getByRole('button', { name: 'Save note', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Update app', exact: true })).toBeEnabled()
    await page.getByRole('button', { name: 'Update app', exact: true }).click()
    await expect(page.getByRole('link', { name: 'Add a place or note', exact: true })).toBeVisible()
    await expect(page.getByText('Draft while update waits', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Add a place or note', exact: true }).click()
    await page.getByLabel('Name', { exact: true }).fill('Phase 2 offline addition')
    nextWorker = true
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())!.update() })
    await expect(page.getByRole('button', { name: 'Finish editing first', exact: true })).toBeDisabled()
    await context.setOffline(true)
    await page.getByRole('button', { name: 'Save changes', exact: true }).click()
    await expect(page.locator('.timeline')).toContainText('Phase 2 offline addition')
    await page.reload()
    await expect(page.locator('.timeline')).toContainText('Phase 2 offline addition')
    await expect(page.getByText('Draft while update waits', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: 'test-results/phase2-upgraded-subdirectory.png', fullPage: true })
  } finally { await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve())) }
})

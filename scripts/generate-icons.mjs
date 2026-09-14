import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'

// Render the repository-owned SVG; no remote images or fonts.
const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {})
try {
  const svg = readFileSync('public/icon.svg', 'utf8')
  for (const [name, size] of [['icon-192', 192], ['icon-512', 512], ['icon-maskable-512', 512], ['apple-touch-icon', 180]]) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 })
    const maskable = name.includes('maskable')
    await page.setContent(`<style>html,body{margin:0;background:#254e40;width:100%;height:100%;display:grid;place-items:center}svg{width:${maskable ? 80 : 100}%;height:${maskable ? 80 : 100}%}</style>${svg}`)
    await page.screenshot({ path: `public/${name}.png` })
    await page.close()
  }
} finally { await browser.close() }

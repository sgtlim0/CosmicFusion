import type { Particle, MergeEffect, FloatingText, Star } from './types'
import { PLANETS, GAME_WIDTH, GAME_HEIGHT, LIMIT_Y } from './constants'

export function generateStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * GAME_WIDTH,
    y: Math.random() * GAME_HEIGHT,
    size: 0.5 + Math.random() * 2,
    brightness: 0.3 + Math.random() * 0.7,
    twinkleSpeed: 0.02 + Math.random() * 0.04,
  }))
}

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m
    ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
    : { r: 0, g: 0, b: 0 }
}

function lighten(hex: string, amt: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgb(${Math.min(255, r + (255 - r) * amt)},${Math.min(255, g + (255 - g) * amt)},${Math.min(255, b + (255 - b) * amt)})`
}

function darken(hex: string, amt: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgb(${r * (1 - amt)},${g * (1 - amt)},${b * (1 - amt)})`
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  frame: number,
  stars: Star[],
) {
  const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
  grad.addColorStop(0, '#060620')
  grad.addColorStop(0.5, '#0a0a2e')
  grad.addColorStop(1, '#0c0825')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  const nebulas = [
    { x: 90, y: 230, r: 140, color: 'rgba(100,30,150,0.04)' },
    { x: 350, y: 460, r: 120, color: 'rgba(30,80,150,0.04)' },
    { x: 220, y: 630, r: 110, color: 'rgba(150,30,60,0.03)' },
  ]
  for (const n of nebulas) {
    const ng = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
    ng.addColorStop(0, n.color)
    ng.addColorStop(1, 'transparent')
    ctx.fillStyle = ng
    ctx.beginPath()
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
    ctx.fill()
  }

  for (const star of stars) {
    const twinkle = Math.sin(frame * star.twinkleSpeed) * 0.3 + 0.7
    ctx.globalAlpha = star.brightness * twinkle
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

export function drawWalls(ctx: CanvasRenderingContext2D) {
  const leftG = ctx.createLinearGradient(0, 0, 8, 0)
  leftG.addColorStop(0, 'rgba(100,120,200,0.15)')
  leftG.addColorStop(1, 'transparent')
  ctx.fillStyle = leftG
  ctx.fillRect(0, 0, 8, GAME_HEIGHT)

  const rightG = ctx.createLinearGradient(GAME_WIDTH, 0, GAME_WIDTH - 8, 0)
  rightG.addColorStop(0, 'rgba(100,120,200,0.15)')
  rightG.addColorStop(1, 'transparent')
  ctx.fillStyle = rightG
  ctx.fillRect(GAME_WIDTH - 8, 0, 8, GAME_HEIGHT)

  const bottomG = ctx.createLinearGradient(0, GAME_HEIGHT, 0, GAME_HEIGHT - 8)
  bottomG.addColorStop(0, 'rgba(100,120,200,0.2)')
  bottomG.addColorStop(1, 'transparent')
  ctx.fillStyle = bottomG
  ctx.fillRect(0, GAME_HEIGHT - 8, GAME_WIDTH, 8)
}

export function drawLimitLine(ctx: CanvasRenderingContext2D, frame: number) {
  const pulse = Math.sin(frame * 0.08) * 0.3 + 0.5
  ctx.save()
  ctx.setLineDash([8, 6])
  ctx.lineDashOffset = -frame * 0.5
  ctx.strokeStyle = `rgba(255,50,50,${pulse * 0.6})`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, LIMIT_Y)
  ctx.lineTo(GAME_WIDTH, LIMIT_Y)
  ctx.stroke()
  ctx.restore()

  const zG = ctx.createLinearGradient(0, 0, 0, LIMIT_Y)
  zG.addColorStop(0, `rgba(255,30,30,${pulse * 0.04})`)
  zG.addColorStop(1, 'transparent')
  ctx.fillStyle = zG
  ctx.fillRect(0, 0, GAME_WIDTH, LIMIT_Y)
}

export function drawPlanet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  typeIdx: number,
  frame: number,
  alpha = 1,
) {
  const def = PLANETS[typeIdx]
  const r = def.radius

  ctx.save()
  ctx.globalAlpha = alpha

  /* outer glow */
  const saved = ctx.globalCompositeOperation
  ctx.globalCompositeOperation = 'lighter'
  const gG = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2)
  gG.addColorStop(0, def.glowColor)
  gG.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gG
  ctx.beginPath()
  ctx.arc(x, y, r * 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = saved

  /* body gradient */
  const bG = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.05, x, y, r)
  bG.addColorStop(0, lighten(def.color, 0.35))
  bG.addColorStop(0.6, def.color)
  bG.addColorStop(1, darken(def.color, 0.35))
  ctx.fillStyle = bG
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()

  /* specular highlight */
  const sG = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, 0, x - r * 0.3, y - r * 0.35, r * 0.55)
  sG.addColorStop(0, 'rgba(255,255,255,0.35)')
  sG.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = sG
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()

  /* type-specific overlays */
  if (typeIdx === 7) drawBlackHoleOverlay(ctx, x, y, r, frame)
  else if (typeIdx === 6) drawSunCorona(ctx, x, y, r, frame)
  else if (typeIdx === 5) drawJupiterBands(ctx, x, y, r)
  else if (typeIdx === 4) drawEarthOverlay(ctx, x, y, r)

  /* pulsing ring */
  const p = Math.sin(frame * 0.06 + typeIdx * 0.7) * 0.5 + 0.5
  ctx.strokeStyle = def.color
  ctx.globalAlpha = alpha * (0.15 + p * 0.15)
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(x, y, r + 3 + p * 4, 0, Math.PI * 2)
  ctx.stroke()

  ctx.restore()
}

function drawBlackHoleOverlay(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, frame: number) {
  const cG = ctx.createRadialGradient(x, y, 0, x, y, r * 0.6)
  cG.addColorStop(0, 'rgba(0,0,0,0.9)')
  cG.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = cG
  ctx.beginPath()
  ctx.arc(x, y, r * 0.6, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(frame * 0.03)
  for (let i = 0; i < 3; i++) {
    const dr = r * (0.8 + i * 0.15)
    ctx.strokeStyle = `rgba(170,50,255,${0.3 - i * 0.08})`
    ctx.lineWidth = 2 - i * 0.5
    ctx.beginPath()
    ctx.ellipse(0, 0, dr, dr * 0.3, i * 0.3, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

function drawSunCorona(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, frame: number) {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8 + frame * 0.02
    const len = r * 0.4 + Math.sin(frame * 0.1 + i) * r * 0.15
    const sx = x + Math.cos(a) * r
    const sy = y + Math.sin(a) * r
    const ex = x + Math.cos(a) * (r + len)
    const ey = y + Math.sin(a) * (r + len)
    const rG = ctx.createLinearGradient(sx, sy, ex, ey)
    rG.addColorStop(0, 'rgba(255,200,50,0.3)')
    rG.addColorStop(1, 'rgba(255,150,0,0)')
    ctx.strokeStyle = rG
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(ex, ey)
    ctx.stroke()
  }
  ctx.restore()
}

function drawJupiterBands(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.clip()
  const bands = [
    { yo: -0.6, c: 'rgba(200,120,40,0.25)' },
    { yo: -0.2, c: 'rgba(180,100,30,0.2)' },
    { yo: 0.15, c: 'rgba(220,140,50,0.25)' },
    { yo: 0.5, c: 'rgba(190,110,35,0.2)' },
  ]
  for (const b of bands) {
    ctx.fillStyle = b.c
    ctx.fillRect(x - r, y + b.yo * r - 4, r * 2, 8)
  }
  ctx.restore()
}

function drawEarthOverlay(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.clip()
  ctx.fillStyle = 'rgba(50,200,80,0.2)'
  ctx.beginPath()
  ctx.ellipse(x - r * 0.2, y - r * 0.1, r * 0.35, r * 0.25, 0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(x + r * 0.3, y + r * 0.3, r * 0.2, r * 0.15, -0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function drawPreview(
  ctx: CanvasRenderingContext2D,
  dropX: number,
  typeIdx: number,
  frame: number,
) {
  const def = PLANETS[typeIdx]
  const previewY = LIMIT_Y - 45

  ctx.save()
  ctx.setLineDash([4, 4])
  ctx.strokeStyle = 'rgba(200,210,255,0.12)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(dropX, previewY + def.radius)
  ctx.lineTo(dropX, GAME_HEIGHT)
  ctx.stroke()
  ctx.restore()

  drawPlanet(ctx, dropX, previewY, typeIdx, frame, 0.55)
}

export function updateParticles(particles: Particle[]): Particle[] {
  const alive: Particle[] = []
  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.05
    p.vx *= 0.98
    p.life -= 0.02
    if (p.life > 0) alive.push(p)
  }
  return alive
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.globalAlpha = p.life
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

export function updateMergeEffects(effects: MergeEffect[]): MergeEffect[] {
  const alive: MergeEffect[] = []
  for (const e of effects) {
    e.radius += (e.maxRadius - e.radius) * 0.15
    e.life -= 0.03
    if (e.life > 0) alive.push(e)
  }
  return alive
}

export function drawMergeEffects(ctx: CanvasRenderingContext2D, effects: MergeEffect[]) {
  for (const e of effects) {
    ctx.globalAlpha = e.life * 0.5
    ctx.strokeStyle = e.color
    ctx.lineWidth = 3 * e.life
    ctx.beginPath()
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2)
    ctx.stroke()

    const gG = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius)
    gG.addColorStop(0, e.glowColor)
    gG.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.globalAlpha = e.life * 0.3
    ctx.fillStyle = gG
    ctx.beginPath()
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

export function updateFloatingTexts(texts: FloatingText[]): FloatingText[] {
  const alive: FloatingText[] = []
  for (const t of texts) {
    t.y -= 1
    t.life -= 0.02
    if (t.life > 0) alive.push(t)
  }
  return alive
}

export function drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
  for (const t of texts) {
    ctx.globalAlpha = t.life
    ctx.fillStyle = t.color
    ctx.font = `bold ${14 + (1 - t.life) * 6}px system-ui`
    ctx.textAlign = 'center'
    ctx.fillText(t.text, t.x, t.y)
  }
  ctx.globalAlpha = 1
}

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  score: number,
  combo: number,
  nextTypeIdx: number,
) {
  ctx.fillStyle = '#e0e8ff'
  ctx.font = 'bold 16px system-ui'
  ctx.textAlign = 'left'
  ctx.fillText(`Score: ${score.toLocaleString()}`, 12, 28)

  if (combo > 1) {
    ctx.fillStyle = '#ffcc00'
    ctx.font = 'bold 14px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(`${combo}x COMBO!`, GAME_WIDTH / 2, 28)
  }

  ctx.fillStyle = 'rgba(200,210,255,0.5)'
  ctx.font = '11px system-ui'
  ctx.textAlign = 'right'
  ctx.fillText('NEXT', GAME_WIDTH - 18, 18)

  const nd = PLANETS[nextTypeIdx]
  const pr = Math.min(nd.radius, 16)
  const px = GAME_WIDTH - 26
  const py = 38
  const mg = ctx.createRadialGradient(px - 1, py - 1, 0, px, py, pr)
  mg.addColorStop(0, lighten(nd.color, 0.3))
  mg.addColorStop(1, nd.color)
  ctx.fillStyle = mg
  ctx.beginPath()
  ctx.arc(px, py, pr, 0, Math.PI * 2)
  ctx.fill()
}

export function drawWarning(
  ctx: CanvasRenderingContext2D,
  progress: number,
  frame: number,
) {
  if (progress <= 0) return
  const flash = Math.sin(frame * 0.15) * 0.5 + 0.5
  ctx.fillStyle = `rgba(255,0,0,${progress * 0.3 * flash})`
  ctx.fillRect(0, 0, GAME_WIDTH, LIMIT_Y)
  if (progress > 0.5) {
    ctx.fillStyle = `rgba(255,50,50,${progress * flash * 0.8})`
    ctx.font = 'bold 14px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('DANGER!', GAME_WIDTH / 2, LIMIT_Y / 2 + 5)
  }
}

import { useRef, useCallback, useEffect, useState } from 'react'
import Matter from 'matter-js'
import type { GamePhase, Particle, MergeEffect, FloatingText, Star } from '../game/types'
import {
  PLANETS, GAME_WIDTH, GAME_HEIGHT, LIMIT_Y,
  DROP_COOLDOWN, GAME_OVER_FRAMES, HIGH_SCORE_KEY,
  DROP_TYPES, GRAVITY_CONSTANT, ATTRACTION_RANGE,
} from '../game/constants'
import {
  generateStars, drawBackground, drawWalls, drawLimitLine,
  drawPlanet, drawPreview, updateParticles, drawParticles,
  updateMergeEffects, drawMergeEffects, updateFloatingTexts,
  drawFloatingTexts, drawHUD, drawWarning,
} from '../game/renderer'
import { playDrop, playMerge, playCombo, playBlackHole, playGameOver } from '../utils/sound'

interface MergeEntry {
  bodyA: Matter.Body
  bodyB: Matter.Body
  type: number
}

export function useCosmicFusion() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [phase, setPhase] = useState<GamePhase>('menu')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    const s = localStorage.getItem(HIGH_SCORE_KEY)
    return s ? parseInt(s, 10) : 0
  })
  const [nextType, setNextType] = useState(0)

  /* ---- refs for stale-closure prevention ---- */
  const phaseRef = useRef<GamePhase>('menu')
  const scoreRef = useRef(0)
  const engineRef = useRef<Matter.Engine | null>(null)
  const bodyMap = useRef(new Map<number, number>()) // body.id → planet type index
  const particlesRef = useRef<Particle[]>([])
  const effectsRef = useRef<MergeEffect[]>([])
  const textsRef = useRef<FloatingText[]>([])
  const mergeQRef = useRef<MergeEntry[]>([])
  const nextRef = useRef(0)
  const dropXRef = useRef(GAME_WIDTH / 2)
  const lastDropRef = useRef(0)
  const comboRef = useRef(0)
  const comboTimerRef = useRef(0)
  const frameRef = useRef(0)
  const animRef = useRef(0)
  const processRef = useRef<() => void>(() => {})
  const goTimerRef = useRef(0) // game over timer
  const scaleRef = useRef(1)
  const starsRef = useRef<Star[]>([])
  const graceSet = useRef(new Set<number>()) // recently dropped body ids

  /* ---- helpers ---- */
  const pickNext = useCallback(
    () => DROP_TYPES[Math.floor(Math.random() * DROP_TYPES.length)],
    [],
  )

  const dropPlanet = useCallback(() => {
    if (phaseRef.current !== 'playing') return
    const now = Date.now()
    if (now - lastDropRef.current < DROP_COOLDOWN) return
    const engine = engineRef.current
    if (!engine) return

    const x = dropXRef.current
    const y = LIMIT_Y - 45
    const t = nextRef.current
    const def = PLANETS[t]

    const body = Matter.Bodies.circle(x, y, def.radius, {
      restitution: 0.2,
      friction: 0.3,
      density: 0.001 * (t + 1),
      label: 'planet',
    })
    Matter.Composite.add(engine.world, body)
    bodyMap.current.set(body.id, t)

    graceSet.current.add(body.id)
    setTimeout(() => graceSet.current.delete(body.id), 1500)

    lastDropRef.current = now
    playDrop()

    const nt = pickNext()
    nextRef.current = nt
    setNextType(nt)
  }, [pickNext])

  /* ---- start game ---- */
  const startGame = useCallback(() => {
    if (engineRef.current) {
      Matter.Engine.clear(engineRef.current)
    }

    const engine = Matter.Engine.create({ gravity: { x: 0, y: 1.5 } })
    engineRef.current = engine

    const wOpts: Matter.IBodyDefinition = { isStatic: true, label: 'wall', friction: 0.3 }
    Matter.Composite.add(engine.world, [
      Matter.Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + 10, GAME_WIDTH + 40, 20, wOpts),
      Matter.Bodies.rectangle(-10, GAME_HEIGHT / 2, 20, GAME_HEIGHT * 2, wOpts),
      Matter.Bodies.rectangle(GAME_WIDTH + 10, GAME_HEIGHT / 2, 20, GAME_HEIGHT * 2, wOpts),
    ])

    Matter.Events.on(engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        const tA = bodyMap.current.get(pair.bodyA.id)
        const tB = bodyMap.current.get(pair.bodyB.id)
        if (tA !== undefined && tB !== undefined && tA === tB && tA < PLANETS.length - 1) {
          mergeQRef.current.push({ bodyA: pair.bodyA, bodyB: pair.bodyB, type: tA })
        }
      }
    })

    bodyMap.current.clear()
    particlesRef.current = []
    effectsRef.current = []
    textsRef.current = []
    mergeQRef.current = []
    graceSet.current.clear()
    scoreRef.current = 0
    setScore(0)
    comboRef.current = 0
    comboTimerRef.current = 0
    goTimerRef.current = 0
    dropXRef.current = GAME_WIDTH / 2
    lastDropRef.current = 0
    frameRef.current = 0

    if (starsRef.current.length === 0) {
      starsRef.current = generateStars(100)
    }

    const nt = pickNext()
    nextRef.current = nt
    setNextType(nt)

    phaseRef.current = 'playing'
    setPhase('playing')
  }, [pickNext])

  /* ---- go to menu ---- */
  const goToMenu = useCallback(() => {
    cancelAnimationFrame(animRef.current)
    if (engineRef.current) {
      Matter.Engine.clear(engineRef.current)
      engineRef.current = null
    }
    phaseRef.current = 'menu'
    setPhase('menu')
  }, [])

  /* ---- canvas sizing (re-run when phase changes so canvas is in DOM) ---- */
  useEffect(() => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !wrapper) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const cw = wrapper.clientWidth
      const ch = wrapper.clientHeight
      if (cw === 0 || ch === 0) return
      const s = Math.min(cw / GAME_WIDTH, ch / GAME_HEIGHT)
      canvas.width = Math.round(GAME_WIDTH * s * dpr)
      canvas.height = Math.round(GAME_HEIGHT * s * dpr)
      canvas.style.width = `${GAME_WIDTH * s}px`
      canvas.style.height = `${GAME_HEIGHT * s}px`
      scaleRef.current = s
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [phase])

  /* ---- input (re-run when phase changes so canvas is in DOM) ---- */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const getX = (cx: number) => {
      const rect = canvas.getBoundingClientRect()
      return Math.max(45, Math.min(GAME_WIDTH - 45, (cx - rect.left) / scaleRef.current))
    }

    const onMouseMove = (e: MouseEvent) => { dropXRef.current = getX(e.clientX) }
    const onClick = () => { if (phaseRef.current === 'playing') dropPlanet() }
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length > 0) dropXRef.current = getX(e.touches[0].clientX)
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length > 0) dropXRef.current = getX(e.touches[0].clientX)
    }
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      if (phaseRef.current === 'playing') dropPlanet()
    }

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('click', onClick)
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd, { passive: false })
    return () => {
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [dropPlanet, phase])

  /* ---- main process (updated every render) ---- */
  useEffect(() => {
    processRef.current = () => {
      if (phaseRef.current !== 'playing') return
      const engine = engineRef.current
      if (!engine) return
      const canvas = canvasRef.current
      if (!canvas) return
      const c = canvas.getContext('2d')
      if (!c) return

      const frame = ++frameRef.current
      const scale = scaleRef.current
      const dpr = window.devicePixelRatio || 1

      /* physics */
      Matter.Engine.update(engine, 1000 / 60)

      /* gravitational attraction */
      const allBodies = Matter.Composite.allBodies(engine.world)
      const planets = allBodies.filter(b => bodyMap.current.has(b.id))

      for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
          const a = planets[i], b = planets[j]
          const dx = b.position.x - a.position.x
          const dy = b.position.y - a.position.y
          const distSq = dx * dx + dy * dy
          const dist = Math.sqrt(distSq)
          if (dist < ATTRACTION_RANGE && dist > 1) {
            const f = GRAVITY_CONSTANT * a.mass * b.mass / distSq
            const fx = f * dx / dist
            const fy = f * dy / dist
            Matter.Body.applyForce(a, a.position, { x: fx, y: fy })
            Matter.Body.applyForce(b, b.position, { x: -fx, y: -fy })
          }
        }
      }

      /* process merges */
      const used = new Set<number>()
      let mergedAny = false

      for (const m of mergeQRef.current) {
        if (used.has(m.bodyA.id) || used.has(m.bodyB.id)) continue
        if (!bodyMap.current.has(m.bodyA.id) || !bodyMap.current.has(m.bodyB.id)) continue
        used.add(m.bodyA.id)
        used.add(m.bodyB.id)

        const mx = (m.bodyA.position.x + m.bodyB.position.x) / 2
        const my = (m.bodyA.position.y + m.bodyB.position.y) / 2
        const nt = m.type + 1

        Matter.Composite.remove(engine.world, m.bodyA)
        Matter.Composite.remove(engine.world, m.bodyB)
        bodyMap.current.delete(m.bodyA.id)
        bodyMap.current.delete(m.bodyB.id)

        const nd = PLANETS[nt]
        const nb = Matter.Bodies.circle(mx, my, nd.radius, {
          restitution: 0.2,
          friction: 0.3,
          density: 0.001 * (nt + 1),
          label: 'planet',
        })
        Matter.Composite.add(engine.world, nb)
        bodyMap.current.set(nb.id, nt)

        const pts = nd.score
        scoreRef.current += pts
        setScore(scoreRef.current)

        effectsRef.current.push({
          x: mx, y: my, radius: 0, maxRadius: nd.radius * 2.5,
          life: 1, color: nd.color, glowColor: nd.glowColor,
        })

        for (let k = 0; k < 12; k++) {
          const ang = (Math.PI * 2 * k) / 12 + Math.random() * 0.3
          const spd = 2 + Math.random() * 4
          particlesRef.current.push({
            x: mx, y: my,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 1,
            life: 1, maxLife: 1,
            color: nd.color, size: 2 + Math.random() * 3,
          })
        }

        textsRef.current.push({ x: mx, y: my - 20, text: `+${pts}`, life: 1, color: nd.color })
        playMerge(nt)
        mergedAny = true
        if (nt === 7) playBlackHole()
      }
      mergeQRef.current = []

      /* combo */
      if (mergedAny) {
        comboRef.current++
        comboTimerRef.current = 60
        if (comboRef.current > 1) {
          const bonus = comboRef.current * 50
          scoreRef.current += bonus
          setScore(scoreRef.current)
          playCombo(comboRef.current)
          textsRef.current.push({
            x: GAME_WIDTH / 2, y: LIMIT_Y + 30,
            text: `${comboRef.current}x COMBO +${bonus}`, life: 1.2, color: '#ffcc00',
          })
        }
      }
      if (comboTimerRef.current > 0) {
        comboTimerRef.current--
        if (comboTimerRef.current <= 0) comboRef.current = 0
      }

      /* game over check */
      let danger = false
      for (const b of planets) {
        if (graceSet.current.has(b.id)) continue
        const ti = bodyMap.current.get(b.id)
        if (ti === undefined) continue
        if (b.position.y - PLANETS[ti].radius < LIMIT_Y) {
          const spd = Math.sqrt(b.velocity.x ** 2 + b.velocity.y ** 2)
          if (spd < 2) { danger = true; break }
        }
      }

      if (danger) {
        goTimerRef.current++
        if (goTimerRef.current > GAME_OVER_FRAMES) {
          phaseRef.current = 'gameOver'
          setPhase('gameOver')
          const fs = scoreRef.current
          const hs = Math.max(fs, parseInt(localStorage.getItem(HIGH_SCORE_KEY) ?? '0', 10))
          localStorage.setItem(HIGH_SCORE_KEY, String(hs))
          setHighScore(hs)
          playGameOver()
          return
        }
      } else {
        goTimerRef.current = Math.max(0, goTimerRef.current - 2)
      }

      /* ---- render ---- */
      c.clearRect(0, 0, canvas.width, canvas.height)
      c.save()
      c.scale(scale * dpr, scale * dpr)

      drawBackground(c, frame, starsRef.current)
      drawWalls(c)
      drawLimitLine(c, frame)

      effectsRef.current = updateMergeEffects(effectsRef.current)
      drawMergeEffects(c, effectsRef.current)

      for (const b of planets) {
        const ti = bodyMap.current.get(b.id)
        if (ti !== undefined) drawPlanet(c, b.position.x, b.position.y, ti, frame)
      }

      particlesRef.current = updateParticles(particlesRef.current)
      drawParticles(c, particlesRef.current)

      textsRef.current = updateFloatingTexts(textsRef.current)
      drawFloatingTexts(c, textsRef.current)

      if (Date.now() - lastDropRef.current >= DROP_COOLDOWN) {
        drawPreview(c, dropXRef.current, nextRef.current, frame)
      }

      drawHUD(c, scoreRef.current, comboRef.current, nextRef.current)
      drawWarning(c, goTimerRef.current / GAME_OVER_FRAMES, frame)

      c.restore()
    }
  })

  /* ---- animation loop tied to phase ---- */
  useEffect(() => {
    if (phase !== 'playing') {
      cancelAnimationFrame(animRef.current)
      return
    }
    const tick = () => {
      processRef.current()
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [phase])

  /* ---- cleanup on unmount ---- */
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current)
      if (engineRef.current) {
        Matter.Engine.clear(engineRef.current)
        engineRef.current = null
      }
    }
  }, [])

  return { canvasRef, wrapperRef, phase, score, highScore, nextType, startGame, goToMenu }
}
